/** Small, dependency-free helpers used across the app. */
import type { Measurement, Project, DiagnosticCase, VerificationCheck } from '@/types'
import { PROJECT_CATEGORIES, type ProjectCategory } from '@/types'

/* ------------------------------- text ------------------------------- */

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

/** "Toyota Corolla 2014 · 1.8L Petrol" with graceful blanks. */
export function vehicleLabel(vehicle: {
  vehicle_make?: string | null
  vehicle_model?: string | null
  vehicle_year?: number | null
}): string {
  const parts = [vehicle.vehicle_make, vehicle.vehicle_model, vehicle.vehicle_year]
    .filter((part) => part !== null && part !== undefined && `${part}`.trim() !== '')
  return parts.join(' ')
}

export function truncate(text: string, max: number): string {
  if (!text) return ''
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trimEnd()}…`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

export function titleCase(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/* ------------------------------- slugs ------------------------------ */

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90)
    .replace(/^-|-$/g, '')
}

/* ------------------------------- dates ------------------------------ */

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(date)
}

export function relativeTime(value: string): string {
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  const minutes = Math.round(diff / 60000)
  if (Number.isNaN(minutes)) return '—'
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(value)
}

/* ------------------------------ youtube ----------------------------- */

const YT_ID = /^[A-Za-z0-9_-]{11}$/

/**
 * Extract the 11-character video id from any supported YouTube URL form:
 *   youtube.com/watch?v=ID · youtu.be/ID · youtube.com/shorts/ID · /embed/ID · /live/ID
 * Returns null when the URL is not a YouTube video URL.
 */
export function extractYoutubeId(rawUrl: string): string | null {
  if (!rawUrl) return null
  const input = rawUrl.trim()
  if (YT_ID.test(input)) return input

  let url: URL
  try {
    url = new URL(input.startsWith('http') ? input : `https://${input}`)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '')
  const isYoutube =
    host === 'youtube.com' ||
    host === 'youtube-nocookie.com' ||
    host === 'youtu.be' ||
    host.endsWith('.youtube.com')
  if (!isYoutube) return null

  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0]
    return id && YT_ID.test(id) ? id : null
  }

  const v = url.searchParams.get('v')
  if (v && YT_ID.test(v)) return v

  const segments = url.pathname.split('/').filter(Boolean)
  const marker = segments.findIndex((s) => ['embed', 'shorts', 'live', 'v'].includes(s))
  if (marker >= 0) {
    const candidate = segments[marker + 1]
    if (candidate && YT_ID.test(candidate)) return candidate
  }
  return null
}

export function youtubeThumbnail(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

/** Privacy-enhanced embed URL — no autoplay, no related videos from other channels. */
export function youtubeEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  })
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`
}

/* ------------------------------ domain ------------------------------ */

export const MEASUREMENT_RESULT_LABEL: Record<Measurement['result'], string> = {
  pass: 'Within specification',
  fail: 'Out of specification',
  inconclusive: 'Unverified',
}

export function isPublished<T extends { status: string }>(record: T): boolean {
  return record.status === 'published'
}

export function projectVehicleLine(project: Project | DiagnosticCase): string {
  return vehicleLabel(project) || 'Vehicle details to be added'
}

export function searchProjectText(project: Project): string {
  return [
    project.title,
    project.description,
    project.vehicle_make,
    project.vehicle_model,
    project.vehicle_year,
    project.engine,
    project.vehicle_system,
    project.category,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function normaliseCategory(value: string): ProjectCategory {
  const match = PROJECT_CATEGORIES.find((category) => category.toLowerCase() === value.toLowerCase())
  return match ?? 'General Automotive Workshop Projects'
}

export function countVerification(checks: VerificationCheck[]): { pass: number; total: number } {
  return { pass: checks.filter((c) => c.status === 'pass').length, total: checks.length }
}

/**
 * The public API never leaks private vehicle identification. This helper is the
 * single place that projects a raw record into its public shape.
 */
export function toPublicCase<T extends DiagnosticCase>(record: T): T {
  return { ...record, vehicle_identification: null }
}

/* ------------------------------- misc ------------------------------- */

export function uid(prefix = 'id'): string {
  const random = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  return `${prefix}-${random}`
}

export function fileSizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function measureCountLabel(count: number): string {
  return `${count} measurement${count === 1 ? '' : 's'}`
}
