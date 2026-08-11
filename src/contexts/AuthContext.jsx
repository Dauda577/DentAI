import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { AuthService } from '@/services/AuthService'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => AuthService.getStoredUser())
  const [isLoading, setIsLoading] = useState(false)
  // True until the initial session check (against Supabase, or the mock)
  // resolves — lets ProtectedRoute avoid bouncing to /login before we
  // actually know whether a session exists.
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    let isMounted = true

    AuthService.getCurrentUser()
      .then((verifiedUser) => {
        if (isMounted) setUser(verifiedUser)
      })
      .catch(() => {
        if (isMounted) setUser(null)
      })
      .finally(() => {
        if (isMounted) setIsInitializing(false)
      })

    const unsubscribe = AuthService.onAuthStateChange((session) => {
      if (!isMounted) return
      if (!session) {
        setUser(null)
        return
      }
      AuthService.getCurrentUser()
        .then((verifiedUser) => isMounted && setUser(verifiedUser))
        .catch(() => isMounted && setUser(null))
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const login = useCallback(async (credentials) => {
    setIsLoading(true)
    try {
      const { user: loggedInUser } = await AuthService.login(credentials)
      setUser(loggedInUser)
      return loggedInUser
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (payload) => {
    setIsLoading(true)
    try {
      const { user: newUser, needsEmailConfirmation } = await AuthService.register(payload)
      if (!needsEmailConfirmation) {
        setUser(newUser)
      }
      return { user: newUser, needsEmailConfirmation }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await AuthService.logout()
    setUser(null)
  }, [])

  const loginWithGoogle = useCallback(async () => {
    return AuthService.loginWithGoogle()
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      isInitializing,
      login,
      register,
      logout,
      loginWithGoogle,
    }),
    [user, isLoading, isInitializing, login, register, logout, loginWithGoogle]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
