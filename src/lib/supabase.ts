import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { IS_SUPABASE_CONFIGURED, SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/config'

/**
 * Browser Supabase client.
 *
 * Only the public anon key is used here — never the service-role key. All
 * authorisation decisions are enforced by Row Level Security policies defined in
 * supabase/migrations. Returns null when credentials are absent so the app can
 * fall back to the local adapter without throwing.
 */
let cached: SupabaseClient | null | undefined

export function getSupabaseClient(): SupabaseClient | null {
  if (cached !== undefined) return cached
  if (!IS_SUPABASE_CONFIGURED) {
    cached = null
    return null
  }
  cached = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'mawuli.supabase.auth',
    },
    global: {
      headers: { 'x-application-name': 'mawuli-diagnostics-portfolio' },
    },
  })
  return cached
}

export function requireSupabaseClient(): SupabaseClient {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.',
    )
  }
  return client
}
