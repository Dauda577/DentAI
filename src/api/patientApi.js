import { supabase } from '@/lib/supabaseClient'

const SELECT_WITH_COUNTS = 'id, name, age, sex, phone, created_at, sessions:diagnosis_sessions(count)'
const SORTABLE_KEYS = ['name', 'age', 'created_at']

function mapPatient(row) {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    sex: row.sex,
    phone: row.phone ?? '',
    lastVisit: row.created_at,
    diagnosesCount: row.sessions?.[0]?.count ?? 0,
  }
}

function ensureSingle(data) {
  if (!data || data.length === 0) {
    const err = new Error('Patient not found')
    err.code = 'NOT_FOUND'
    throw err
  }
  return data[0]
}

export const patientApi = {
  async list({ search = '', sort, page = 1, pageSize = 5 } = {}) {
    let query = supabase
      .from('patients')
      .select(SELECT_WITH_COUNTS, { count: 'exact' })
      .order('created_at', { ascending: false })

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    if (sort?.key && SORTABLE_KEYS.includes(sort.key)) {
      query = query.order(sort.key, { ascending: sort.direction !== 'desc' })
    }
    query = query.range((page - 1) * pageSize, page * pageSize - 1)

    const { data, count, error } = await query
    if (error) throw error

    return {
      items: (data ?? []).map(mapPatient),
      page,
      pageCount: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
      total: count ?? 0,
    }
  },

  async get(id) {
    const { data, error } = await supabase
      .from('patients')
      .select(SELECT_WITH_COUNTS)
      .eq('id', id)
      .limit(1)
    if (error) throw error
    return mapPatient(ensureSingle(data))
  },

  async create(payload) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('patients')
      .insert({ user_id: user?.id, ...payload })
      .select('id, name, age, sex, phone, created_at')
      .single()
    if (error) throw error
    return { ...data, lastVisit: null, diagnosesCount: 0 }
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from('patients')
      .update(payload)
      .eq('id', id)
      .select(SELECT_WITH_COUNTS)
      .limit(1)
    if (error) throw error
    return mapPatient(ensureSingle(data))
  },

  async remove(id) {
    const { error } = await supabase.from('patients').delete().eq('id', id)
    if (error) throw error
    return { success: true }
  },
}
