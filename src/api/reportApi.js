import { supabase } from '@/lib/supabaseClient'

const SELECT_FIELDS = 'id, patient_reference, patient_name, type, status, summary, created_at, session_id'

function mapReport(row) {
  return {
    id: row.id,
    patientReference: row.patient_reference ?? '',
    patientName: row.patient_name,
    type: row.type ?? 'Diagnostic Report',
    date: row.created_at,
    status: row.status ?? 'generated',
    summary: row.summary,
    sessionId: row.session_id,
  }
}

function ensureSingle(data) {
  if (!data || data.length === 0) {
    const err = new Error('Report not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  return data[0]
}

export const reportApi = {
  async list({ search = '', page = 1, pageSize = 5 } = {}) {
    let query = supabase
      .from('reports')
      .select(SELECT_FIELDS, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`patient_name.ilike.%${search}%,patient_reference.ilike.%${search}%`)
    }
    query = query.range((page - 1) * pageSize, page * pageSize - 1)

    const { data, count, error } = await query
    if (error) throw error

    return {
      items: (data ?? []).map(mapReport),
      page,
      pageCount: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
      total: count ?? 0,
    }
  },

  async get(id) {
    const { data, error } = await supabase
      .from('reports')
      .select(SELECT_FIELDS)
      .eq('id', id)
      .limit(1)
    if (error) throw error
    return mapReport(ensureSingle(data))
  },
}
