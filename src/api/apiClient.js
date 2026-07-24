import axios from 'axios'
import { ROUTES } from '@/constants/routes'
import { supabase } from '@/lib/supabaseClient'
import { storage } from '@/utils/storage'

// These are intentionally independent: you can have real Supabase auth
// working while the rest of the app (patients, diagnoses, reports, etc.)
// still runs on mocks until the FastAPI backend exists, or vice versa.
export const USE_MOCKS = String(import.meta.env.VITE_USE_MOCKS ?? 'true') === 'true'
export const USE_SUPABASE_AUTH = String(import.meta.env.VITE_USE_SUPABASE_AUTH ?? 'false') === 'true'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
})

// Resource APIs (patients, diagnoses, etc.) authenticate to the FastAPI
// backend with the same Supabase-issued JWT, when Supabase auth is active.
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
