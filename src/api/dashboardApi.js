import { supabase } from '@/lib/supabaseClient'
import { DIAGNOSIS_STAGE } from '@/constants/status'

const STAGE_TO_DASHBOARD_STATUS = {
  [DIAGNOSIS_STAGE.COMPLETE]: 'Completed',
  [DIAGNOSIS_STAGE.FAILED]: 'Failed',
}

// A session left in a working stage for this long is almost certainly stuck
// (e.g. the inference call died or the tab was closed mid-run). Surface it as
// "Stalled" instead of an endless "Processing".
const STALE_MS = 2 * 60 * 60 * 1000

export const dashboardApi = {
  async getStats() {
    const [patients, sessions, reports] = await Promise.all([
      supabase.from('patients').select('id', { count: 'exact', head: true }),
      supabase
        .from('diagnosis_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('stage', DIAGNOSIS_STAGE.COMPLETE),
      supabase.from('reports').select('id', { count: 'exact', head: true }),
    ])

    const errors = [patients, sessions, reports].map((r) => r.error).filter(Boolean)
    if (errors.length > 0) throw errors[0]

    return {
      totalPatients: patients.count ?? 0,
      diagnosesCompleted: sessions.count ?? 0,
      reportsGenerated: reports.count ?? 0,
      systemStatus: 'operational',
    }
  },

  async getRecentDiagnoses({ page = 1, pageSize = 5 } = {}) {
    const { data, count, error } = await supabase
      .from('diagnosis_sessions')
      .select('id, patient_id, patient_reference, patient_name, stage, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)
    if (error) throw error

    return {
      items: (data ?? []).map((row) => {
        const stage = row.stage
        const status = STAGE_TO_DASHBOARD_STATUS[stage] ?? 'Processing'
        const isWorkingStage = !STAGE_TO_DASHBOARD_STATUS[stage]
        const createdMs = row.created_at ? new Date(row.created_at).getTime() : 0
        const isStalled = isWorkingStage && Date.now() - createdMs > STALE_MS
        return {
          id: row.id,
          patientId: row.patient_id,
          patientRef: row.patient_reference || '',
          patientName: row.patient_name,
          date: row.created_at,
          status: isStalled ? 'Stalled' : status,
        }
      }),
      page,
      pageCount: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
    }
  },
}
