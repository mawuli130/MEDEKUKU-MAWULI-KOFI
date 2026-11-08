/**
 * Persistence primitives for the offline/demo adapter.
 * Everything is namespaced and versioned so a schema change can be discarded
 * safely rather than corrupting stored drafts.
 */
import type {
  Certificate,
  ContactMessage,
  DiagnosticCase,
  GalleryImage,
  Profile,
  Project,
  SiteSetting,
  Skill,
  SocialLink,
  YoutubeVideo,
} from '@/types'
import { defaultProfile, defaultSettings, defaultSkills, EMPTY_UUID } from '@/lib/defaults'

export const LOCAL_KEY = 'mawuli.portfolio.v1'
export const LOCAL_AUTH_KEY = 'mawuli.admin.session.v1'

export interface LocalDatabase {
  version: 1
  profile: Profile
  projects: Project[]
  diagnostic_cases: DiagnosticCase[]
  youtube_videos: YoutubeVideo[]
  gallery_images: GalleryImage[]
  skills: Skill[]
  certificates: Certificate[]
  social_links: SocialLink[]
  settings: SiteSetting[]
  contact_messages: ContactMessage[]
}

const NOW = '2026-01-01T00:00:00.000Z'

export function createSeedDatabase(): LocalDatabase {
  return {
    version: 1,
    profile: { ...defaultProfile },
    projects: [],
    diagnostic_cases: [],
    youtube_videos: [],
    gallery_images: [],
    // The skill catalogue reflects the supplied professional profile. It contains
    // no fabricated evidence — no certificates, projects or repair records.
    skills: defaultSkills.map((skill, index) => ({
      ...skill,
      id: `skill-${index + 1}`,
      created_at: NOW,
      updated_at: NOW,
    })),
    certificates: [],
    social_links: [],
    settings: Object.entries(defaultSettings).map(([key, value]) => ({
      setting_key: key,
      setting_value: value,
      updated_at: NOW,
    })),
    contact_messages: [],
  }
}

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    return window.localStorage
  } catch {
    return null
  }
}

let memoryFallback: LocalDatabase | null = null

export function readDatabase(): LocalDatabase {
  const raw = storage()?.getItem(LOCAL_KEY)
  if (!raw) {
    const seed = memoryFallback ?? createSeedDatabase()
    writeDatabase(seed)
    return seed
  }
  try {
    const parsed = JSON.parse(raw) as LocalDatabase
    if (parsed?.version !== 1) {
      const seed = createSeedDatabase()
      writeDatabase(seed)
      return seed
    }
    return {
      ...createSeedDatabase(),
      ...parsed,
      profile: { ...defaultProfile, ...parsed.profile, id: EMPTY_UUID },
    }
  } catch {
    const seed = createSeedDatabase()
    writeDatabase(seed)
    return seed
  }
}

export function writeDatabase(database: LocalDatabase): void {
  memoryFallback = database
  const target = storage()
  if (!target) return
  try {
    target.setItem(LOCAL_KEY, JSON.stringify(database))
  } catch {
    // Quota exceeded (large data-URL uploads) — keep serving from memory.
  }
}

export function mutateDatabase<T>(mutator: (database: LocalDatabase) => T): T {
  const database = readDatabase()
  const result = mutator(database)
  writeDatabase(database)
  return result
}

export function newId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return uuid
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function resetDatabase(): void {
  memoryFallback = null
  storage()?.removeItem(LOCAL_KEY)
}

/**
 * Clears the demo database and its in-memory cache. Used by the test harness so
 * every test starts from a known state.
 */
export function resetAllLocalState(): void {
  memoryFallback = null
  try {
    storage()?.removeItem(LOCAL_KEY)
    storage()?.removeItem(LOCAL_AUTH_KEY)
  } catch {
    // ignore
  }
}
