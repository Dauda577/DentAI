import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import LoadingOverlay from '@/components/ui/LoadingOverlay'

export default function AuthCallback() {
  const { isAuthenticated, isInitializing } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isInitializing) return
    navigate(isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN, { replace: true })
  }, [isAuthenticated, isInitializing, navigate])

  return <LoadingOverlay />
}
