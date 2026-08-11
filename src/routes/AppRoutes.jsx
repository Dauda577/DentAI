import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '@/constants/routes'
import ProtectedRoute from './ProtectedRoute'
import AuthLayout from '@/layouts/AuthLayout'
import DashboardLayout from '@/layouts/DashboardLayout'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import { useAuth } from '@/hooks/useAuth'

const Login = lazy(() => import('@/pages/Auth/Login'))
const Register = lazy(() => import('@/pages/Auth/Register'))
const ForgotPassword = lazy(() => import('@/pages/Auth/ForgotPassword'))
const AuthCallback = lazy(() => import('@/pages/Auth/AuthCallback'))

const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard'))
const PatientsList = lazy(() => import('@/pages/Patients/PatientsList'))
const PatientProfile = lazy(() => import('@/pages/Patients/PatientProfile'))
const NewDiagnosis = lazy(() => import('@/pages/Diagnosis/NewDiagnosis'))
const Processing = lazy(() => import('@/pages/Diagnosis/Processing'))
const DiagnosisResult = lazy(() => import('@/pages/Diagnosis/DiagnosisResult'))
const TreatmentPlan = lazy(() => import('@/pages/Treatment/TreatmentPlan'))
const Reports = lazy(() => import('@/pages/Reports/Reports'))
const Settings = lazy(() => import('@/pages/Settings/Settings'))

const NotFound = lazy(() => import('@/pages/NotFound'))
const Unauthorized = lazy(() => import('@/pages/Unauthorized'))

function RootRedirect() {
  const { isAuthenticated, isInitializing } = useAuth()
  if (isInitializing) return <LoadingOverlay />
  return <Navigate to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN} replace />
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <Routes>
        <Route path={ROUTES.ROOT} element={<RootRedirect />} />
        <Route path={ROUTES.AUTH_CALLBACK} element={<AuthCallback />} />

        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
            <Route path={ROUTES.PATIENTS} element={<PatientsList />} />
            <Route path={ROUTES.PATIENT_PROFILE()} element={<PatientProfile />} />
            <Route path={ROUTES.NEW_DIAGNOSIS} element={<NewDiagnosis />} />
            <Route path={ROUTES.DIAGNOSIS_PROCESSING()} element={<Processing />} />
            <Route path={ROUTES.DIAGNOSIS_RESULT()} element={<DiagnosisResult />} />
            <Route path={ROUTES.TREATMENT_PLAN()} element={<TreatmentPlan />} />
            <Route path={ROUTES.REPORTS} element={<Reports />} />
            <Route path={ROUTES.SETTINGS} element={<Settings />} />
          </Route>
        </Route>

        <Route path={ROUTES.UNAUTHORIZED} element={<Unauthorized />} />
        <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
