/**
 * Local persistence adapter.
 *
 * Implements the exact same Repository contract as the Supabase adapter against
 * namespaced localStorage, so every public page and every admin CRUD flow can be
 * exercised without a backend. It is not a security boundary — it only ever runs
 * in the visitor's own browser and is used for local development, previews and
 * automated tests. Production traffic uses the Supabase adapter with RLS.
 */
import type {
  Certificate,
  ContactMessage,
  DiagnosticCase,
  GalleryImage,
  Project,
  SiteSetting,
  SiteSettingsMap,
  Skill,
  SocialLink,
  YoutubeVideo,
} from '@/types'
import type {
  CollectionRepo,
  ListOptions,
  ProfileRepo,
  Repository,
  SettingsRepo,
  ContactRepo,
} from '@/services/types'
import { RepositoryError } from '@/services/types'
import { defaultProfile, defaultSettings } from '@/lib/defaults'
import { slugify } from '@/lib/utils'
import { mutateDatabase, newId, nowIso, readDatabase } from '@/services/localStore'

type TableName =
  | 'projects'
  | 'diagnostic_cases'
  | 'youtube_videos'
  | 'gallery_images'
  | 'skills'
  | 'certificates'
  | 'social_links'

interface HasStatus {
  status?: string
}
interface HasDate {
  created_at: string
}

function sortNewest<T extends Partial<HasDate>>(rows: T[]): T[] {
  return [...rows].sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
}

function makeCollectionRepo<T extends { id: string } & HasStatus & Partial<HasDate>>(
  table: TableName,
  options: {
    order?: (rows: T[]) => T[]
    hasDraftState?: boolean
    slugged?: boolean
    uniqueSlug?: boolean
  } = {},
): CollectionRepo<T> & { getBySlug?: (slug: string) => Promise<T | null> } {
  const order = options.order ?? ((rows: T[]) => sortNewest(rows))

  function all(): T[] {
    const database = readDatabase()
    return (database[table] as unknown as T[]) ?? []
  }

  function visible(rows: T[], listOptions?: ListOptions): T[] {
    if (!options.hasDraftState || listOptions?.includeDrafts) return order(rows)
    return order(rows.filter((row) => row.status === 'published'))
  }

  const repo: CollectionRepo<T> & { getBySlug?: (slug: string) => Promise<T | null> } = {
    async list(listOptions) {
      return visible(all(), listOptions)
    },

    async getById(id) {
      return all().find((row) => row.id === id) ?? null
    },

    async create(input) {
      const record = {
        ...input,
        id: newId(table),
        created_at: nowIso(),
        updated_at: nowIso(),
      } as unknown as T

      mutateDatabase((database) => {
        const rows = database[table] as unknown as T[]
        if (options.uniqueSlug) {
          const candidate = record as unknown as { slug?: string; title?: string }
          const base = slugify(candidate.slug || candidate.title || 'item') || 'item'
          let slug = base
          let counter = 2
          while (rows.some((row) => (row as unknown as { slug?: string }).slug === slug)) {
            slug = `${base}-${counter++}`
          }
          ;(record as unknown as { slug: string }).slug = slug
        }
        rows.unshift(record)
      })
      return record
    },

    async update(id, patch) {
      let updated: T | null = null
      mutateDatabase((database) => {
        const rows = database[table] as unknown as T[]
        const index = rows.findIndex((row) => row.id === id)
        if (index < 0) throw new RepositoryError('That record no longer exists.')
        const next = { ...rows[index], ...patch, updated_at: nowIso() } as T
        rows[index] = next
        updated = next
      })
      if (!updated) throw new RepositoryError('Update failed.')
      return updated
    },

    async remove(id) {
      mutateDatabase((database) => {
        const rows = database[table] as unknown as T[]
        const index = rows.findIndex((row) => row.id === id)
        if (index >= 0) rows.splice(index, 1)
      })
    },
  }

  if (options.slugged) {
    repo.getBySlug = async (slug: string) => all().find((row) => (row as unknown as { slug?: string }).slug === slug) ?? null
  }

  return repo
}

const profileRepo: ProfileRepo = {
  async get() {
    const database = readDatabase()
    return { ...defaultProfile, ...database.profile }
  },
  async update(patch) {
    const next = mutateDatabase((database) => {
      database.profile = { ...defaultProfile, ...database.profile, ...patch, updated_at: nowIso() }
      return database.profile
    })
    return next
  },
}

const settingsRepo: SettingsRepo = {
  async getAll() {
    const database = readDatabase()
    const map: SiteSettingsMap = { ...defaultSettings }
    for (const row of database.settings ?? []) {
      map[row.setting_key] = row.setting_value
    }
    return map
  },
  async setAll(values) {
    mutateDatabase((database) => {
      const existing = new Map((database.settings ?? []).map((row) => [row.setting_key, row]))
      const next: SiteSetting[] = []
      for (const [key, value] of Object.entries(values)) {
        const previous = existing.get(key)
        next.push({
          setting_key: key,
          setting_value: value,
          updated_at: previous && previous.setting_value === value ? previous.updated_at : nowIso(),
        })
        existing.delete(key)
      }
      for (const leftover of existing.values()) next.push(leftover)
      database.settings = next
    })
    // Drop keys that were removed from the map so defaults can re-apply.
    const stored = await settingsRepo.getAll()
    return { ...defaultSettings, ...stored, ...values }
  },
}

const messagesRepo: ContactRepo = {
  async submit(input) {
    mutateDatabase((database) => {
      const message: ContactMessage = {
        id: newId('message'),
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message,
        status: 'new',
        created_at: nowIso(),
      }
      database.contact_messages = [message, ...(database.contact_messages ?? [])]
    })
  },
  async list() {
    return sortNewest(readDatabase().contact_messages ?? []) as ContactMessage[]
  },
  async updateStatus(id, status) {
    mutateDatabase((database) => {
      const row = (database.contact_messages ?? []).find((message) => message.id === id)
      if (row) row.status = status
    })
  },
  async remove(id) {
    mutateDatabase((database) => {
      database.contact_messages = (database.contact_messages ?? []).filter((message) => message.id !== id)
    })
  },
}

export function createLocalRepository(): Repository {
  const byOrder = <T extends { display_order?: number; created_at?: string }>(rows: T[]) =>
    [...rows].sort((a, b) => {
      const orderDiff = (a.display_order ?? 0) - (b.display_order ?? 0)
      if (orderDiff !== 0) return orderDiff
      return String(b.created_at ?? '').localeCompare(String(a.created_at ?? ''))
    })

  const projects = makeCollectionRepo<Project>('projects', {
    hasDraftState: true,
    slugged: true,
    uniqueSlug: true,
  }) as CollectionRepo<Project> & { getBySlug: (slug: string) => Promise<Project | null> }

  const diagnosticCases = makeCollectionRepo<DiagnosticCase>('diagnostic_cases', {
    hasDraftState: true,
    slugged: true,
    uniqueSlug: true,
  }) as CollectionRepo<DiagnosticCase> & { getBySlug: (slug: string) => Promise<DiagnosticCase | null> }

  return {
    source: 'local',
    profile: profileRepo,
    projects: {
      ...projects,
      getBySlug: projects.getBySlug!,
    },
    diagnosticCases: {
      ...diagnosticCases,
      getBySlug: diagnosticCases.getBySlug!,
    },
    videos: makeCollectionRepo<YoutubeVideo>('youtube_videos', { hasDraftState: true }),
    gallery: makeCollectionRepo<GalleryImage>('gallery_images', { order: byOrder }),
    skills: makeCollectionRepo<Skill>('skills', { order: byOrder }),
    certificates: makeCollectionRepo<Certificate>('certificates', {
      order: byOrder,
      slugged: true,
      uniqueSlug: true,
    }) as Repository['certificates'],
    socialLinks: makeCollectionRepo<SocialLink>('social_links', { order: byOrder }),
    messages: messagesRepo,
    settings: settingsRepo,
  }
}

export const localRepository = createLocalRepository()
