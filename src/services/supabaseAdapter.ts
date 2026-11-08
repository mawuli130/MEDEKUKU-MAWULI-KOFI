/**
 * Supabase adapter — production data source.
 *
 * Every query is issued with the browser anon key, so Row Level Security decides
 * what a visitor may read and what only an authorised administrator may write.
 * No service-role key is ever referenced in this bundle.
 */
import type {
  Certificate,
  ContactMessage,
  DiagnosticCase,
  GalleryImage,
  Profile,
  Project,
  SiteSettingsMap,
  Skill,
  SocialLink,
  YoutubeVideo,
} from '@/types'
import type { CollectionRepo, ContactRepo, Draft, ListOptions, Repository, SettingsRepo } from '@/services/types'
import { RepositoryError } from '@/services/types'
import { requireSupabaseClient } from '@/lib/supabase'
import { defaultProfile, defaultSettings, EMPTY_UUID } from '@/lib/defaults'
import { slugify } from '@/lib/utils'

type Table =
  | 'projects'
  | 'diagnostic_cases'
  | 'youtube_videos'
  | 'gallery_images'
  | 'skills'
  | 'certificates'
  | 'social_links'

function wrapError(context: string, error: { message: string; code?: string; details?: string } | null): never {
  const detail = error ? `${error.message}${error.code ? ` (${error.code})` : ''}` : 'Unknown error'
  throw new RepositoryError(`${context}: ${detail}`, error)
}

interface CollectionOptions<T> {
  table: Table
  hasDrafts?: boolean
  slugged?: boolean
  orderBy?: { column: keyof T & string; ascending: boolean }[]
  /** Transform DB row → domain object (e.g. normalising JSONB columns). */
  parse?: (row: Record<string, unknown>) => T
  /** Transform domain object → DB row for writes. */
  serialise?: (input: Partial<T>) => Record<string, unknown>
}

function makeCollectionRepo<T extends { id: string }>(options: CollectionOptions<T>): CollectionRepo<T> {
  const { table, hasDrafts, slugged, orderBy, parse, serialise } = options
  const toDomain = (row: unknown): T => (parse ? parse(row as Record<string, unknown>) : (row as T))
  const toRow = (input: Partial<T>) => (serialise ? serialise(input) : (input as Record<string, unknown>))

  function applyOrder<Q extends { order: (column: string, opts: { ascending: boolean }) => Q }>(query: Q): Q {
    let q = query
    for (const rule of orderBy ?? [{ column: 'created_at' as keyof T & string, ascending: false }]) {
      q = q.order(rule.column, { ascending: rule.ascending })
    }
    return q
  }

  return {
    async list(listOptions?: ListOptions) {
      const client = requireSupabaseClient()
      let query = client.from(table).select('*')
      if (hasDrafts && !listOptions?.includeDrafts) query = query.eq('status', 'published')
      const { data, error } = await applyOrder(query as never)
      if (error) wrapError(`Could not load ${table}`, error)
      return ((data ?? []) as unknown[]).map(toDomain)
    },

    async getById(id) {
      const client = requireSupabaseClient()
      const { data, error } = await client.from(table).select('*').eq('id', id).maybeSingle()
      if (error) wrapError(`Could not load ${table}`, error)
      return data ? toDomain(data) : null
    },

    ...(slugged
      ? {
          async getBySlug(slug: string) {
            const client = requireSupabaseClient()
            const { data, error } = await client.from(table).select('*').eq('slug', slug).maybeSingle()
            if (error) wrapError(`Could not load ${table}`, error)
            return data ? toDomain(data) : null
          },
        }
      : {}),

    async create(input: Draft<T>) {
      const client = requireSupabaseClient()
      const row = toRow(input as Partial<T>)
      if (slugged) {
        const base = slugify(String(row.slug || row.title || 'entry')) || 'entry'
        row.slug = base
      }
      const { data, error } = await client.from(table).insert(row).select('*').single()
      if (error) {
        // Retry once with a de-duplicated slug when the unique index rejects it.
        if (slugged && (error.code === '23505' || error.message.includes('duplicate key'))) {
          const base = String(row.slug)
          const retry = await client
            .from(table)
            .insert({ ...row, slug: `${base}-${Date.now().toString(36)}` })
            .select('*')
            .single()
          if (retry.error) wrapError(`Could not create ${table}`, retry.error)
          return toDomain(retry.data)
        }
        wrapError(`Could not create ${table}`, error)
      }
      return toDomain(data)
    },

    async update(id, patch) {
      const client = requireSupabaseClient()
      const row = toRow(patch)
      const { data, error } = await client.from(table).update(row).eq('id', id).select('*').single()
      if (error) wrapError(`Could not update ${table}`, error)
      return toDomain(data)
    },

    async remove(id) {
      const client = requireSupabaseClient()
      const { error } = await client.from(table).delete().eq('id', id)
      if (error) wrapError(`Could not delete this record`, error)
    },
  }
}

/* --------------------------- row codecs ---------------------------- */

const asStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const asObjectArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value.filter((item) => item && typeof item === 'object') as T[]) : []

const parseProject = (row: Record<string, unknown>): Project =>
  ({
    ...row,
    tools_used: asStringArray(row.tools_used),
    measurements: asObjectArray(row.measurements),
    gallery: asStringArray(row.gallery),
    featured: Boolean(row.featured),
  }) as unknown as Project

const parseCase = (row: Record<string, unknown>): DiagnosticCase =>
  ({
    ...row,
    dtc_codes: asObjectArray(row.dtc_codes),
    diagnostic_procedure: asObjectArray(row.diagnostic_procedure),
    measurements: asObjectArray(row.measurements),
    verification: asObjectArray(row.verification),
    media: asObjectArray(row.media),
    featured: Boolean(row.featured),
  }) as unknown as DiagnosticCase

const parseProfile = (row: Record<string, unknown>): Profile =>
  ({
    ...defaultProfile,
    ...row,
    automotive_interests: asStringArray(row.automotive_interests),
    timeline: asObjectArray(row.timeline),
  }) as unknown as Profile

/* ------------------------------ repos ------------------------------ */

const profileRepo: Repository['profile'] = {
  async get() {
    const client = requireSupabaseClient()
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (error) wrapError('Could not load the profile', error)
    if (!data) return { ...defaultProfile, id: EMPTY_UUID }
    return parseProfile(data)
  },

  async update(patch) {
    const client = requireSupabaseClient()
    const { data: existing, error: readError } = await client
      .from('profiles')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    if (readError) wrapError('Could not load the profile', readError)

    if (!existing) {
      const { data, error } = await client.from('profiles').insert(patch).select('*').single()
      if (error) wrapError('Could not create the profile', error)
      return parseProfile(data)
    }
    const { data, error } = await client
      .from('profiles')
      .update(patch)
      .eq('id', existing.id)
      .select('*')
      .single()
    if (error) wrapError('Could not save the profile', error)
    return parseProfile(data)
  },
}

const messagesRepo: ContactRepo = {
  async submit(input) {
    const client = requireSupabaseClient()
    // The honeypot token is validated by the server-side RLS insert policy check
    // (see contact_messages insert policy) and by the form before submission.
    const { error } = await client.from('contact_messages').insert({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      subject: input.subject.trim(),
      message: input.message.trim(),
      status: 'new',
    })
    if (error) wrapError('Your message could not be sent', error)
  },

  async list() {
    const client = requireSupabaseClient()
    const { data, error } = await client
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) wrapError('Could not load messages', error)
    return (data ?? []) as ContactMessage[]
  },

  async updateStatus(id, status) {
    const client = requireSupabaseClient()
    const { error } = await client.from('contact_messages').update({ status }).eq('id', id)
    if (error) wrapError('Could not update the message', error)
  },

  async remove(id) {
    const client = requireSupabaseClient()
    const { error } = await client.from('contact_messages').delete().eq('id', id)
    if (error) wrapError('Could not delete the message', error)
  },
}

const settingsRepo: SettingsRepo = {
  async getAll() {
    const client = requireSupabaseClient()
    const { data, error } = await client.from('site_settings').select('setting_key, setting_value')
    if (error) wrapError('Could not load website settings', error)
    const map: SiteSettingsMap = { ...defaultSettings }
    for (const row of data ?? []) {
      map[row.setting_key as string] = row.setting_value as string
    }
    return map
  },

  async setAll(values) {
    const client = requireSupabaseClient()
    const rows = Object.entries(values).map(([setting_key, setting_value]) => ({
      setting_key,
      setting_value,
      updated_at: new Date().toISOString(),
    }))
    const { error } = await client.from('site_settings').upsert(rows, { onConflict: 'setting_key' })
    if (error) wrapError('Could not save website settings', error)
    return values
  },
}

export function createSupabaseRepository(): Repository {
  return {
    source: 'supabase',
    profile: profileRepo,
    projects: makeCollectionRepo<Project>({
      table: 'projects',
      hasDrafts: true,
      slugged: true,
      parse: parseProject,
      orderBy: [
        { column: 'featured', ascending: false },
        { column: 'created_at', ascending: false },
      ],
    }) as Repository['projects'],
    diagnosticCases: makeCollectionRepo<DiagnosticCase>({
      table: 'diagnostic_cases',
      hasDrafts: true,
      slugged: true,
      parse: parseCase,
      orderBy: [
        { column: 'featured', ascending: false },
        { column: 'created_at', ascending: false },
      ],
    }) as Repository['diagnosticCases'],
    videos: makeCollectionRepo<YoutubeVideo>({
      table: 'youtube_videos',
      hasDrafts: true,
      orderBy: [
        { column: 'featured', ascending: false },
        { column: 'created_at', ascending: false },
      ],
    }),
    gallery: makeCollectionRepo<GalleryImage>({
      table: 'gallery_images',
      orderBy: [
        { column: 'display_order', ascending: true },
        { column: 'created_at', ascending: false },
      ],
    }),
    skills: makeCollectionRepo<Skill>({
      table: 'skills',
      orderBy: [
        { column: 'display_order', ascending: true },
        { column: 'name', ascending: true },
      ],
    }),
    certificates: makeCollectionRepo<Certificate>({
      table: 'certificates',
      slugged: true,
      orderBy: [
        { column: 'display_order', ascending: true },
        { column: 'issue_date', ascending: false },
      ],
    }) as Repository['certificates'],
    socialLinks: makeCollectionRepo<SocialLink>({
      table: 'social_links',
      orderBy: [{ column: 'display_order', ascending: true }],
    }),
    messages: messagesRepo,
    settings: settingsRepo,
  }
}
