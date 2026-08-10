import axios from 'axios'
import { ROUTES } from '@/constants/routes'
import { supabase } from '@/lib/supabaseClient'
import { storage } from '@/utils/storage'

// Three independent flags, deliberately not tied together:
// - USE_MOCKS: patients/reports/dashboard/settings — no real backend for
//   these exists yet, keep this true until one does.
// - USE_MOCKS_DIAGNOSIS: diagnosis/treatment specifically — the Python
//   inference service only ever implements these two, so this is the one
//   flag that actually has a real backend to turn off mocks for.
// - USE_SUPABASE_AUTH: auth — independent of both, Supabase handles this.
export const USE_MOCKS = String(import.meta.env.VITE_USE_MOCKS ?? 'true') === 'true'
export const USE_MOCKS_DIAGNOSIS = String(import.meta.env.VITE_USE_MOCKS_DIAGNOSIS ?? 'true') === 'true'
export const USE_SUPABASE_AUTH = String(import.meta.env.VITE_USE_SUPABASE_AUTH ?? 'false') === 'true'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
})

apiClient.interceptors.request.use(async (config) => {
  if (USE_SUPABASE_AUTH) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`
    }
  } else {
    const token = storage.get('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (USE_SUPABASE_AUTH) {
        await supabase.auth.signOut()
      } else {
        storage.remove('token')
        storage.remove('user')
      }
      if (window.location.pathname !== ROUTES.LOGIN) {
        window.location.assign(ROUTES.LOGIN)
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
