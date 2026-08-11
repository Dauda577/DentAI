import { supabase } from '@/lib/supabaseClient'
import { DIAGNOSIS_STAGE } from '@/constants/status'

// --- Inference ------------------------------------------------------------
// Set VITE_INFERENCE_API_URL to use a real CBCT diagnosis API.
// When unset, a time-based mock provides visual feedback.
const INFERENCE_API_URL = import.meta.env.VITE_INFERENCE_API_URL || ''
const STAGE_ORDER = [
  DIAGNOSIS_STAGE.UPLOADING,
  DIAGNOSIS_STAGE.PREPARING,
  DIAGNOSIS_STAGE.PROCESSING,
  DIAGNOSIS_STAGE.GENERATING,
  DIAGNOSIS_STAGE.FINALIZING,
]
const STAGE_DURATION_MS = 1400

const MOCK_RESULT_DISEASES = [
  { name: 'Caries', confidence: 0.86, status: 'Detected' },
  { name: 'Damaged / Missing Tooth', confidence: 0.71, status: 'Detected' },
  { name: 'Pulpitis', confidence: 0.58, status: 'Possible' },
  { name: 'Impacted Tooth', confidence: 0.19, status: 'Unlikely' },
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
  const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    patientInfo.patientId ?? ''
  )
  if (looksLikeUuid) return patientInfo.patientId

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
  return data.id
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

    const patientId = await resolvePatient(user.id, patientInfo)

    const { data: session, error: insertError } = await supabase
      .from('diagnosis_sessions')
      .insert({
        user_id: user.id,
        patient_id: patientId,
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

    return { sessionId: session.id }
  },

  async getStatus(sessionId) {
    const { data, error } = await supabase
      .from('diagnosis_sessions')
      .select('id, stage, created_at')
      .eq('id', sessionId)
      .limit(1)
    if (error) throw error
    const row = ensureSingle(data)

    if (row.stage === DIAGNOSIS_STAGE.COMPLETE || row.stage === DIAGNOSIS_STAGE.FAILED) {
      return { sessionId, stage: row.stage, progress: 100 }
    }

    const elapsed = Date.now() - new Date(row.created_at).getTime()
    const stageIndex = Math.min(STAGE_ORDER.length, Math.floor(elapsed / STAGE_DURATION_MS))
    const isComplete = stageIndex >= STAGE_ORDER.length
    const totalDuration = STAGE_ORDER.length * STAGE_DURATION_MS
    const progress = Math.min(100, Math.round((elapsed / totalDuration) * 100))

    if (isComplete) {
      const { error: finalizeError } = await supabase
        .from('diagnosis_sessions')
        .update({
          stage: DIAGNOSIS_STAGE.COMPLETE,
          progress: 100,
          diseases: MOCK_RESULT_DISEASES,
        })
        .eq('id', sessionId)
        .eq('stage', DIAGNOSIS_STAGE.UPLOADING)
      if (finalizeError) throw finalizeError
      return { sessionId, stage: DIAGNOSIS_STAGE.COMPLETE, progress: 100 }
    }

    return { sessionId, stage: STAGE_ORDER[stageIndex], progress }
  },

  async getResult(sessionId) {
    const { data, error } = await supabase
      .from('diagnosis_sessions')
      .select(
        'id, patient_id, patient_name, patient_age, patient_sex, patient_weight, clinical_notes, cbct_file_name, created_at, diseases'
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

    return {
      sessionId,
      patient: {
        patientId: row.patient_id,
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
    }
  },

  async runRealInference(sessionId) {
    if (!INFERENCE_API_URL) return null

    const { data: session } = await supabase
      .from('diagnosis_sessions')
      .select('patient_name, patient_age, patient_sex, clinical_notes, cbct_file_path')
      .eq('id', sessionId)
      .maybeSingle()
    if (!session) return null

    let cbctBlob = null
    if (session.cbct_file_path) {
      const { data: fileData, error: dlErr } = await supabase.storage
        .from('cbct-scans')
        .download(session.cbct_file_path)
      if (!dlErr && fileData) cbctBlob = fileData
    }

    const form = new FormData()
    if (cbctBlob) form.append('cbct', cbctBlob, 'scan.nii')
    form.append('present_medical_history', session.clinical_notes || '')
    if (session.patient_age != null) form.append('age', String(session.patient_age))
    if (session.patient_sex) form.append('sex', session.patient_sex)

    const resp = await fetch(`${INFERENCE_API_URL}/diagnose`, { method: 'POST', body: form })
    if (!resp.ok) throw new Error(`Inference API returned ${resp.status}`)
    const result = await resp.json()

    if (result.diseases) {
      const STATUS_THRESHOLDS = [
        { threshold: 0.75, status: 'Detected' },
        { threshold: 0.45, status: 'Possible' },
        { threshold: 0, status: 'Unlikely' },
      ]
      const diseases = Object.entries(result.diseases).map(([name, prob]) => {
        const label = name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        const status = STATUS_THRESHOLDS.find(t => prob >= t.threshold)?.status ?? 'Unlikely'
        return { name: label, confidence: Math.round(prob * 100) / 100, status }
      })

      await supabase
        .from('diagnosis_sessions')
        .update({ diseases })
        .eq('id', sessionId)

      return diseases
    }

    return null
  },
}
