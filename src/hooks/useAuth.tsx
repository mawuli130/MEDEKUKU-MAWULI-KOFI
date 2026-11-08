import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService } from '@/services/auth'

interface AuthValue {
  email: string | null
  loading: boolean
  mode: 'supabase' | 'local'
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const user = await authService.getCurrentUser()
    setEmail(user?.email ?? null)
  }, [])

  useEffect(() => {
    let active = true
    authService
      .getCurrentUser()
      .then((user) => {
        if (active) setEmail(user?.email ?? null)
      })
      .catch(() => {
        if (active) setEmail(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const unsubscribe = authService.onChange((nextEmail) => {
      setEmail(nextEmail)
      setLoading(false)
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (nextEmail: string, password: string) => {
    await authService.signIn(nextEmail, password)
    const user = await authService.getCurrentUser()
    setEmail(user?.email ?? null)
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setEmail(null)
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ email, loading, mode: authService.mode, signIn, signOut, refresh }),
    [email, loading, signIn, signOut, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
