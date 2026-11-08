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

/** Row-to-insert shape: everything except server-generated identity fields. */
export type Draft<T> = Omit<T, 'id' | 'created_at' | 'updated_at'>

export interface ListOptions {
  /** Administrators request drafts; the public site never does. */
  includeDrafts?: boolean
}

export interface CollectionRepo<T> {
  list(options?: ListOptions): Promise<T[]>
  getById(id: string): Promise<T | null>
  getBySlug?(slug: string): Promise<T | null>
  create(input: Draft<T>): Promise<T>
  update(id: string, patch: Partial<T>): Promise<T>
  remove(id: string): Promise<void>
}

export interface ContactRepo {
  submit(input: { name: string; email: string; subject: string; message: string; token: string }): Promise<void>
  list(): Promise<ContactMessage[]>
  updateStatus(id: string, status: ContactMessage['status']): Promise<void>
  remove(id: string): Promise<void>
}

export interface SettingsRepo {
  getAll(): Promise<SiteSettingsMap>
  setAll(values: SiteSettingsMap): Promise<SiteSettingsMap>
}

export interface ProfileRepo {
  get(): Promise<Profile>
  update(patch: Partial<Profile>): Promise<Profile>
}

export interface Repository {
  source: 'supabase' | 'local'
  profile: ProfileRepo
  projects: CollectionRepo<Project> & Required<Pick<CollectionRepo<Project>, 'getBySlug'>>
  diagnosticCases: CollectionRepo<DiagnosticCase> & Required<Pick<CollectionRepo<DiagnosticCase>, 'getBySlug'>>
  videos: CollectionRepo<YoutubeVideo>
  gallery: CollectionRepo<GalleryImage>
  skills: CollectionRepo<Skill>
  certificates: CollectionRepo<Certificate> & Required<Pick<CollectionRepo<Certificate>, 'getBySlug'>>
  socialLinks: CollectionRepo<SocialLink>
  messages: ContactRepo
  settings: SettingsRepo
}

export class RepositoryError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message)
    this.name = 'RepositoryError'
  }
}

export interface AuthSession {
  user: { id: string; email: string } | null
}

export interface AuthService {
  mode: 'supabase' | 'local'
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
  getCurrentUser(): Promise<AuthSession['user']>
  requestPasswordReset(email: string): Promise<void>
  onChange(callback: (email: string | null) => void): () => void
}
