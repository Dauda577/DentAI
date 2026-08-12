import { supabase } from '@/lib/supabaseClient'
import { DIAGNOSIS_STAGE } from '@/constants/status'

// --- Inference ------------------------------------------------------------
// Points at the deployed inference service. When unset, submissions fail
// fast (stage = failed) instead of falling back to mock data.
const INFERENCE_API_URL = import.meta.env.VITE_INFERENCE_API_URL || ''

// Clinical-note field names (camelCase form state) -> model field names.
const STATUS_THRESHOLDS = [
  { threshold: 0.75, status: 'Detected' },
  { threshold: 0.45, status: 'Possible' },
  { threshold: 0, status: 'Unlikely' },
]

function ensureSingle(data) {
  if (!data || data.length === 0) {
    const err = new Error('Session not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  return data[0]
}

async function resolvePatient(userId, patientInfo) {
  const reference = (patientInfo.patientId ?? '').trim()

  if (reference) {
    const { data: existing } = await supabase
      .from('patients')
      .select('id, patient_reference')
      .eq('user_id', userId)
      .eq('patient_reference', reference)
      .maybeSingle()
    if (existing) return { patientId: existing.id, patientReference: existing.patient_reference }

    const { data, error } = await supabase
      .from('patients')
      .insert({
        user_id: userId,
        name: patientInfo.name,
        age: patientInfo.age,
        sex: patientInfo.sex,
        patient_reference: reference,
      })
      .select('id')
      .single()
    if (error) throw error
    return { patientId: data.id, patientReference: reference }
  }

  const { data, error } = await supabase
    .from('patients')
    .insert({
      user_id: userId,
      name: patientInfo.name,
      age: patientInfo.age,
      sex: patientInfo.sex,
    })
    .select('id')
    .single()
  if (error) throw error
  return { patientId: data.id, patientReference: '' }
}

async function generateReport(sessionId) {
  const { data: session } = await supabase
    .from('diagnosis_sessions')
    .select('id, user_id, patient_id, patient_reference, patient_name, patient_age, patient_sex, diseases, clinical_notes, created_at')
    .eq('id', sessionId)
    .maybeSingle()
  if (!session) return

  const findings = Array.isArray(session.diseases)
    ? session.diseases
        .filter((d) => d.status !== 'Unlikely')
        .map((d) => `${d.name}: ${d.status} (${Math.round(d.confidence * 100)}% confidence)`)
        .join('; ')
    : 'No significant findings.'

  const summary = [
    `Patient: ${session.patient_reference ? `${session.patient_reference} · ` : ''}${session.patient_name}, ${session.patient_age}y ${session.patient_sex || ''}`,
    `Date: ${new Date(session.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    `Findings: ${findings}`,
    session.clinical_notes ? `Notes: ${session.clinical_notes}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  await supabase.from('reports').insert({
    user_id: session.user_id,
    session_id: session.id,
    patient_id: session.patient_id,
    patient_reference: session.patient_reference,
    patient_name: session.patient_name,
    type: 'Diagnostic Report',
    status: 'generated',
    summary,
  })
}

// Writes a status/progress update to a session. If the update fails solely
// because the treatment_summary column has not been migrated yet, retries
// without that field so the rest of the pipeline never gets stuck.
async function updateSession(sessionId, fields) {
  const { error } = await supabase
    .from('diagnosis_sessions')
    .update(fields)
    .eq('id', sessionId)
  if (error && Object.prototype.hasOwnProperty.call(fields, 'treatment_summary')) {
    const { treatment_summary: _treatment_summary, ...rest } = fields
    const retry = await supabase
      .from('diagnosis_sessions')
      .update(rest)
      .eq('id', sessionId)
    if (retry.error) throw retry.error
    return
  }
  if (error) throw error
}

async function sendCompletionEmail(sessionId) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return
    await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-diagnosis-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ sessionId }),
    })
  } catch {}
}

export const diagnosisApi = {
  async submit({ patientInfo, clinicalNotes, cbctFile }) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      const err = new Error('Not authenticated')
      err.code = 'UNAUTHENTICATED'
      throw err
    }

    const { patientId, patientReference } = await resolvePatient(user.id, patientInfo)

    const { data: session, error: insertError } = await supabase
      .from('diagnosis_sessions')
      .insert({
        user_id: user.id,
        patient_id: patientId,
        patient_reference: patientReference,
        patient_name: patientInfo.name,
        patient_age: patientInfo.age,
        patient_sex: patientInfo.sex,
        patient_weight: patientInfo.weight ?? null,
        clinical_notes: clinicalNotes,
        stage: DIAGNOSIS_STAGE.UPLOADING,
        progress: 0,
      })
      .select('id')
      .single()
    if (insertError) throw insertError

    if (cbctFile) {
      const { error: uploadError } = await supabase.storage
        .from('cbct-scans')
        .upload(`${user.id}/${session.id}/${cbctFile.name}`, cbctFile, { upsert: true })
      if (uploadError) throw uploadError

      const { error: updateError } = await supabase
        .from('diagnosis_sessions')
        .update({
          cbct_file_name: cbctFile.name,
          cbct_file_path: `${user.id}/${session.id}/${cbctFile.name}`,
        })
        .eq('id', session.id)
      if (updateError) throw updateError
    }

    // Start the real inference run in the background. The Processing page
    // polls getStatus (a pure DB read) until it reaches a terminal stage.
    diagnosisApi.runRealInference(session.id).catch(() => {})

    return { sessionId: session.id }
  },

  async getStatus(sessionId) {
    const { data, error } = await supabase
      .from('diagnosis_sessions')
      .select('id, stage, progress')
      .eq('id', sessionId)
      .limit(1)
    if (error) throw error
    const row = ensureSingle(data)

    return { sessionId, stage: row.stage, progress: row.progress ?? 0 }
  },

  async getResult(sessionId) {
    const { data, error } = await supabase
      .from('diagnosis_sessions')
      .select(
        'id, patient_id, patient_reference, patient_name, patient_age, patient_sex, patient_weight, clinical_notes, cbct_file_name, created_at, diseases'
      )
      .eq('id', sessionId)
      .limit(1)
    if (error) throw error
    const row = ensureSingle(data)

    if (!row.diseases) {
      const err = new Error('Diagnosis result is not ready yet')
      err.code = 'RESULT_NOT_READY'
      throw err
    }

    let treatmentSummary = null
    const extra = await supabase
      .from('diagnosis_sessions')
      .select('treatment_summary')
      .eq('id', sessionId)
      .limit(1)
    if (!extra.error) treatmentSummary = extra.data?.[0]?.treatment_summary ?? null

    return {
      sessionId,
      patient: {
        patientId: row.patient_reference || row.patient_id,
        name: row.patient_name,
        age: row.patient_age,
        sex: row.patient_sex,
        weight: row.patient_weight,
      },
      date: row.created_at,
      inputSummary: {
        cbctUploaded: Boolean(row.cbct_file_name),
        cbctFileName: row.cbct_file_name,
        clinicalNotesReceived: true,
      },
      clinicalNotes: row.clinical_notes,
      diseases: row.diseases,
      treatmentSummary,
    }
  },

  // Drives a full inference run for a session and writes every stage to the
  // DB. Safe to call more than once (e.g. from the Processing page Retry).
  async runRealInference(sessionId) {
    if (!INFERENCE_API_URL) {
      await updateSession(sessionId, { stage: DIAGNOSIS_STAGE.FAILED })
      const err = new Error('Inference service is not configured')
      err.code = 'INFERENCE_NOT_CONFIGURED'
      throw err
    }

    const { data: session } = await supabase
      .from('diagnosis_sessions')
      .select('patient_age, patient_sex, clinical_notes, cbct_file_path, cbct_file_name')
      .eq('id', sessionId)
      .maybeSingle()
    if (!session) return

    await updateSession(sessionId, { stage: DIAGNOSIS_STAGE.PREPARING, progress: 20 })

    let cbctBlob = null
    if (session.cbct_file_path) {
      const { data: fileData } = await supabase.storage
        .from('cbct-scans')
        .download(session.cbct_file_path)
      if (fileData) cbctBlob = fileData
    }

    await updateSession(sessionId, { stage: DIAGNOSIS_STAGE.PROCESSING, progress: 40 })

    const notes = session.clinical_notes || {}
    const form = new FormData()
    form.append('main_appeal', notes.chiefComplaint || '')
    form.append('subsequent', notes.subsequent || '')
    form.append('present_medical_history', notes.presentMedicalHistory || '')
    form.append('past_medical_history', notes.pastMedicalHistory || '')
    form.append('oral_check', notes.oralExamination || '')
    if (session.patient_age != null) form.append('age', String(session.patient_age))
    if (session.patient_sex) form.append('sex', session.patient_sex)
    if (cbctBlob) {
      // Send with the original filename so the service picks the right
      // reader. The service falls back to text-only if it cannot parse it.
      form.append('cbct', cbctBlob, session.cbct_file_name || 'scan.nii')
    }

    await updateSession(sessionId, { stage: DIAGNOSIS_STAGE.GENERATING, progress: 70 })

    let resp
    try {
      resp = await fetch(`${INFERENCE_API_URL}/predict`, { method: 'POST', body: form })
    } catch (err) {
      await updateSession(sessionId, { stage: DIAGNOSIS_STAGE.FAILED })
      throw err
    }
    if (!resp.ok) {
      await updateSession(sessionId, { stage: DIAGNOSIS_STAGE.FAILED })
      throw new Error(`Inference API returned ${resp.status}`)
    }
    const result = await resp.json()

    const probabilities =
      result?.probabilities && typeof result.probabilities === 'object' ? result.probabilities : {}

    const diseases = Object.entries(probabilities).map(([name, prob]) => {
      const label = name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      const status = STATUS_THRESHOLDS.find((t) => prob >= t.threshold)?.status ?? 'Unlikely'
      return { name: label, confidence: Math.round(prob * 100) / 100, status }
    })

    await updateSession(sessionId, {
      stage: DIAGNOSIS_STAGE.FINALIZING,
      progress: 90,
      diseases,
      treatment_summary: result.treatment_summary ?? null,
    })

    await updateSession(sessionId, { stage: DIAGNOSIS_STAGE.COMPLETE, progress: 100 })

    // Report + email are generated only after results are persisted, so they
    // can never race ahead of the real model output.
    generateReport(sessionId).catch(() => {})
    sendCompletionEmail(sessionId).catch(() => {})

    return diseases
  },
}
