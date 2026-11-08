/**
 * Authentication.
 *
 * With Supabase configured this is Supabase Auth (email + password); the
 * administrator whitelist lives in the `admin_users` table and is enforced by
 * RLS, so signing in does not by itself grant write access.
 *
 * Without Supabase credentials, a single local session can be opened with the
 * demo credentials from the environment. That path is for local previews only
 * and is clearly labelled in the admin UI.
 */
import { DEMO_CREDENTIALS, DATA_SOURCE, IS_SUPABASE_CONFIGURED } from '@/lib/config'
import { getSupabaseClient, requireSupabaseClient } from '@/lib/supabase'
import { LOCAL_AUTH_KEY } from '@/services/localStore'
import type { AuthService } from '@/services/types'

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

const DEMO_SESSION_TTL = 1000 * 60 * 60 * 8

interface LocalSession {
  email: string
  issuedAt: number
}

function readLocalSession(): LocalSession | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LocalSession
    if (!parsed?.email || Date.now() - parsed.issuedAt > DEMO_SESSION_TTL) {
      window.localStorage.removeItem(LOCAL_AUTH_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

const listeners = new Set<(email: string | null) => void>()

function emit(email: string | null) {
  for (const listener of listeners) listener(email)
}

export const authService: AuthService = {
  mode: DATA_SOURCE,

  async signIn(email, password) {
    const normalisedEmail = email.trim().toLowerCase()

    if (DATA_SOURCE === 'supabase') {
      const client = requireSupabaseClient()
      const { data, error } = await client.auth.signInWithPassword({
        email: normalisedEmail,
        password,
      })
      if (error) {
        if (error.message.toLowerCase().includes('invalid')) {
          throw new AuthError('Email or password is incorrect.')
        }
        throw new AuthError(error.message)
      }
      if (!data.user) throw new AuthError('Sign in failed. Please try again.')
      emit(data.user.email ?? null)
      return
    }

    if (normalisedEmail !== DEMO_CREDENTIALS.email || password !== DEMO_CREDENTIALS.password) {
      throw new AuthError('Email or password is incorrect.')
    }
    window.localStorage.setItem(
      LOCAL_AUTH_KEY,
      JSON.stringify({ email: normalisedEmail, issuedAt: Date.now() } satisfies LocalSession),
    )
    emit(normalisedEmail)
  },

  async signOut() {
    if (IS_SUPABASE_CONFIGURED) {
      await getSupabaseClient()?.auth.signOut()
    }
    window.localStorage.removeItem(LOCAL_AUTH_KEY)
    emit(null)
  },

  async getCurrentUser() {
    if (DATA_SOURCE === 'supabase') {
      const client = getSupabaseClient()
      if (!client) return null
      const { data } = await client.auth.getSession()
      const user = data.session?.user
      if (!user || !user.email) return null
      return { id: user.id, email: user.email }
    }
    const session = readLocalSession()
    if (!session) return null
    return { id: 'local-admin', email: session.email }
  },

  async requestPasswordReset(email) {
    const normalised = email.trim().toLowerCase()
    if (DATA_SOURCE === 'supabase') {
      const client = requireSupabaseClient()
      const { error } = await client.auth.resetPasswordForEmail(normalised, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      })
      if (error) throw new AuthError(error.message)
      return
    }
    throw new AuthError(
      'Password reset needs Supabase authentication. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then use the reset form again.',
    )
  },

  onChange(callback) {
    listeners.add(callback)

    let unsubscribeSupabase: (() => void) | null = null
    if (DATA_SOURCE === 'supabase') {
      const client = getSupabaseClient()
      if (client) {
        const { data } = client.auth.onAuthStateChange((_event, session) => {
          callback(session?.user?.email ?? null)
        })
        unsubscribeSupabase = () => data.subscription.unsubscribe()
      }
    }

    return () => {
      listeners.delete(callback)
      unsubscribeSupabase?.()
    }
  },
}

/** Completes a Supabase password-recovery link. */
export async function updatePassword(password: string): Promise<void> {
  if (DATA_SOURCE === 'supabase') {
    const client = requireSupabaseClient()
    const { error } = await client.auth.updateUser({ password })
    if (error) throw new AuthError(error.message)
    return
  }
  throw new AuthError('Password updates require Supabase authentication.')
}
