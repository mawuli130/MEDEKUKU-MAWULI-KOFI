/**
 * Domain types for the Mawuli Engineering & Diagnostic Services portfolio.
 * These mirror the PostgreSQL schema in /supabase/migrations.
 */

export type PublishStatus = 'draft' | 'published'

export type SkillLevel = 'practical' | 'developing' | 'interest'

/** Project categories — fixed so filtering and SEO stay consistent. */
export const PROJECT_CATEGORIES = [
  'Automotive Electrical Diagnostics',
  'ECU and TCU Systems',
  'Engine Management Systems',
  'Sensor and Actuator Testing',
  'Wiring and Circuit Troubleshooting',
  'ABS and Brake Systems',
  'Hybrid Vehicle Systems',
  'Mechanical Servicing and Repairs',
  'Automotive Accessories and Electronics',
  'General Automotive Workshop Projects',
] as const
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]

export const GALLERY_CATEGORIES = [
  'Automotive Diagnostics',
  'Workshop Activities',
  'Electrical Repairs',
  'ECU and TCU Systems',
  'Engine Repairs',
  'Sensor Testing',
  'Automotive Tools',
  'Engineering Projects',
  'Certificates and Achievements',
] as const
export type GalleryCategory = (typeof GALLERY_CATEGORIES)[number]

export const SKILL_CATEGORIES = [
  'Automotive Electrical Systems',
  'Automotive Electronics',
  'Vehicle Diagnostics',
  'Mechanical Skills',
  'Advanced Technical Interests',
] as const
export type SkillCategory = (typeof SKILL_CATEGORIES)[number]

export const VIDEO_CATEGORIES = [
  'Vehicle Diagnostics',
  'Automotive Electrical Repairs',
  'Sensor Testing',
  'ECU and TCU Systems',
  'Engine Management',
  'Mechanical Repairs',
  'Workshop Demonstrations',
  'Automotive Technical Learning',
  'Engineering Projects',
] as const
export type VideoCategory = (typeof VIDEO_CATEGORIES)[number]

export const SOCIAL_PLATFORMS = [
  'youtube',
  'linkedin',
  'whatsapp',
  'facebook',
  'x',
  'email',
  'phone',
] as const
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]

/* ------------------------------------------------------------------ *
 * Shared row shape
 * ------------------------------------------------------------------ */
export interface Timestamped {
  created_at: string
  updated_at?: string
}

export interface Identified {
  id: string
}

export interface Slugged {
  slug: string
}

/* ------------------------------------------------------------------ *
 * Profile (single row, singleton)
 * ------------------------------------------------------------------ */
export interface Profile extends Timestamped {
  id: string
  full_name: string
  headline: string
  biography: string
  hero_intro: string
  location: string
  profile_image: string | null
  email: string | null
  phone: string | null
  cv_url: string | null
  career_goals: string | null
  automotive_interests: string[]
  /** Editable professional timeline (education, workshop experience, training). */
  timeline: TimelineEntry[]
  updated_at?: string
}

export interface TimelineEntry {
  /** Stable client-side key. */
  id: string
  period: string
  title: string
  organisation: string
  description: string
  kind: 'education' | 'workshop' | 'training' | 'project' | 'achievement'
}

/* ------------------------------------------------------------------ *
 * Projects
 * ------------------------------------------------------------------ */
export interface Project extends Timestamped, Identified, Slugged {
  title: string
  category: ProjectCategory
  description: string
  vehicle_make: string
  vehicle_model: string
  vehicle_year: number | null
  engine: string
  transmission: string
  vehicle_system: string
  problem_statement: string
  diagnostic_procedure: string
  tools_used: string[]
  measurements: Measurement[]
  repair_procedure: string
  final_result: string
  cover_image: string | null
  gallery: string[]
  youtube_url: string | null
  featured: boolean
  status: PublishStatus
  seo_title: string | null
  seo_description: string | null
  published_at: string | null
}

export interface Measurement {
  label: string
  value: string
  unit: string
  specification: string
  result: 'pass' | 'fail' | 'inconclusive'
}

/* ------------------------------------------------------------------ *
 * Diagnostic case studies
 * ------------------------------------------------------------------ */
export interface DiagnosticCase extends Timestamped, Identified, Slugged {
  project_id: string | null
  title: string
  vehicle_make: string
  vehicle_model: string
  vehicle_year: number | null
  engine: string
  transmission: string
  vehicle_system: string
  /** Optional vehicle identification (VIN/plate). Never rendered publicly. */
  vehicle_identification: string | null
  customer_complaint: string
  dtc_codes: DtcEntry[]
  scan_tool: string
  freeze_frame: string
  live_data: string
  diagnostic_procedure: DiagnosticStep[]
  measurements: Measurement[]
  confirmed_fault: string
  repair_procedure: string
  verification: VerificationCheck[]
  media: DiagnosticMedia[]
  youtube_url: string | null
  featured: boolean
  status: PublishStatus
  seo_title: string | null
  seo_description: string | null
  published_at: string | null
}

export interface DtcEntry {
  code: string
  description: string
  module: string
}

export interface DiagnosticStep {
  step: string
  finding: string
}

export interface VerificationCheck {
  check: string
  result: string
  status: 'pass' | 'fail' | 'pending'
}

export interface DiagnosticMedia {
  url: string
  caption: string
  kind: 'scan' | 'waveform' | 'wiring' | 'photo' | 'video'
}

/* ------------------------------------------------------------------ *
 * YouTube
 * ------------------------------------------------------------------ */
export interface YoutubeVideo extends Timestamped, Identified {
  title: string
  description: string
  youtube_url: string
  youtube_video_id: string
  thumbnail_url: string | null
  category: VideoCategory
  vehicle_make: string
  vehicle_model: string
  featured: boolean
  status: PublishStatus
  published_at: string | null
}

/* ------------------------------------------------------------------ *
 * Gallery / skills / certificates
 * ------------------------------------------------------------------ */
export interface GalleryImage extends Timestamped, Identified {
  title: string
  description: string
  image_url: string
  alt_text: string
  category: GalleryCategory
  featured: boolean
  display_order: number
}

export interface Skill extends Timestamped, Identified {
  name: string
  category: SkillCategory
  description: string
  skill_level: SkillLevel
  display_order: number
}

export interface Certificate extends Timestamped, Identified, Slugged {
  title: string
  institution: string
  issue_date: string | null
  description: string
  certificate_url: string | null
  verification_url: string | null
  featured: boolean
  display_order: number
}

/* ------------------------------------------------------------------ *
 * Contact / social / settings
 * ------------------------------------------------------------------ */
export type MessageStatus = 'new' | 'read' | 'archived'

export interface ContactMessage extends Identified {
  name: string
  email: string
  subject: string
  message: string
  status: MessageStatus
  created_at: string
}

export interface SocialLink extends Identified {
  platform: SocialPlatform
  url: string
  handle: string | null
  display_order: number
  created_at: string
}

export interface SiteSetting {
  setting_key: string
  setting_value: string
  updated_at: string
}

export type SiteSettingsMap = Record<string, string>

/* ------------------------------------------------------------------ *
 * Admin
 * ------------------------------------------------------------------ */
export interface AdminUser {
  id: string
  email: string
  full_name: string | null
}

export interface DashboardCounts {
  projects: number
  diagnosticCases: number
  videos: number
  galleryImages: number
  certificates: number
  contactMessages: number
  newMessages: number
}

export type CollectionKey =
  | 'projects'
  | 'diagnostic_cases'
  | 'youtube_videos'
  | 'gallery_images'
  | 'skills'
  | 'certificates'
  | 'social_links'
