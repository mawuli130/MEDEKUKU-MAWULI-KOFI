import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

/**
 * Route guard for /admin.
 *
 * Client-side guarding is a UX measure only: every write is still authorised by
 * Supabase RLS against the admin_users table, so a bypassed guard cannot mutate
 * data.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { email, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-ink-950">
        <div className="flex flex-col items-center gap-3 text-silver-400">
          <Loader2 className="h-6 w-6 animate-spin text-signal-400" aria-hidden="true" />
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em]">Verifying session</p>
        </div>
      </div>
    )
  }

  if (!email) {
    return (
      <Navigate
        to="/admin"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <>{children}</>
}
