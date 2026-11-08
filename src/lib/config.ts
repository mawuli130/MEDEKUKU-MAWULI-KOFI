/**
 * Runtime configuration.
 *
 * Supabase credentials are read from Vite env vars. When they are absent the app
 * runs against the local persistence adapter (see src/services/localAdapter.ts)
 * so the whole site — including admin CRUD — stays testable offline. The active
 * data source is surfaced in the admin dashboard and the README.
 */

const rawUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

function looksLikeUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export const SUPABASE_URL = rawUrl
export const SUPABASE_ANON_KEY = rawKey

/** True only when both values are present *and* plausibly valid. */
export const IS_SUPABASE_CONFIGURED = looksLikeUrl(rawUrl) && rawKey.length > 20

/**
 * Opt back into the demo adapter even when Supabase env vars exist.
 * Handy for previewing content management before the database is seeded.
 */
export const FORCE_DEMO_MODE = (import.meta.env.VITE_DEMO_MODE ?? '').toLowerCase() === 'true'

export const DATA_SOURCE: 'supabase' | 'local' =
  IS_SUPABASE_CONFIGURED && !FORCE_DEMO_MODE ? 'supabase' : 'local'

export const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://mawuli-diagnostics.vercel.app').replace(
  /\/+$/,
  '',
)

/**
 * Credentials for the local demo adapter only. There is no such thing as a
 * default production password: with Supabase configured, authentication is
 * handled entirely by Supabase Auth.
 */
export const DEMO_CREDENTIALS = {
  email: (import.meta.env.VITE_DEMO_ADMIN_EMAIL ?? 'admin@mawulidiagnostics.com').trim().toLowerCase(),
  password: (import.meta.env.VITE_DEMO_ADMIN_PASSWORD ?? 'Diagnostics2026!').trim(),
}

export const CONTACT = {
  brandShort: 'Mawuli Diagnostics',
  brandFull: 'Mawuli Engineering & Diagnostic Services',
  name: 'Medekuku Mawuli Kofi',
  role: 'Automotive Electronics & Diagnostic Technician',
  city: 'Accra',
  country: 'Ghana',
}

export const STORAGE_BUCKETS = {
  gallery: 'gallery',
  projects: 'projects',
  certificates: 'certificates',
  profile: 'profile',
  cv: 'cv',
  videos: 'videos',
} as const

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
export const ACCEPTED_DOCUMENT_TYPES = ['application/pdf']
