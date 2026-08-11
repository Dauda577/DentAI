export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  AUTH_CALLBACK: '/auth/callback',

  DASHBOARD: '/dashboard',

  PATIENTS: '/patients',
  PATIENT_PROFILE: (id = ':id') => `/patients/${id}`,

  NEW_DIAGNOSIS: '/diagnosis/new',
  DIAGNOSIS_PROCESSING: (sessionId = ':sessionId') => `/diagnosis/${sessionId}/processing`,
  DIAGNOSIS_RESULT: (sessionId = ':sessionId') => `/diagnosis/${sessionId}/result`,

  TREATMENT_PLAN: (sessionId = ':sessionId') => `/treatment/${sessionId}`,

  REPORTS: '/reports',
  SETTINGS: '/settings',

  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '*',
}
