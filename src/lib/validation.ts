/** Zod schemas shared by public forms and dashboard editors. */
import { z } from 'zod'
import {
  GALLERY_CATEGORIES,
  PROJECT_CATEGORIES,
  SKILL_CATEGORIES,
  SOCIAL_PLATFORMS,
  VIDEO_CATEGORIES,
  type Project,
} from '@/types'

const optionalText = z.string().trim().max(4000).optional().default('')
const nullableText = z.string().trim().max(4000).nullish().transform((v) => (v ? v : null))

/**
 * Vehicle year: accepts number, numeric string, null or undefined and normalises
 * to an integer or null. Rejects implausible values when a range is supplied.
 */
function yearField(range?: { min: number; max: number }) {
  const base = z.number().int().nullable()
  const checked = range
    ? base.refine((year) => year === null || (year >= range.min && year <= range.max), {
        message: `Enter a vehicle year between ${range.min} and ${range.max}.`,
      })
    : base
  return z.preprocess((value) => {
    if (value === null || value === undefined || value === '') return null
    const parsed = Number(value)
    return Number.isFinite(parsed) ? Math.trunc(parsed) : null
  }, checked)
}

/* ------------------------------ contact ----------------------------- */
export const contactFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Please enter your full name.')
    .max(120, 'That name is too long.'),
  email: z.string().trim().min(1, 'An email address is required.').email('Enter a valid email address.'),
  subject: z
    .string()
    .trim()
    .min(3, 'Please add a subject.')
    .max(160, 'Please keep the subject under 160 characters.'),
  message: z
    .string()
    .trim()
    .min(20, 'Please describe your enquiry in at least 20 characters.')
    .max(4000, 'Please keep the message under 4000 characters.'),
  /** Honeypot — must stay empty. Bots fill every field they find. */
  company: z.string().max(0, 'Spam detection triggered.').optional().default(''),
  consent: z.literal(true, { message: 'Please confirm you agree to be contacted.' }),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>

/* ------------------------------- login ------------------------------ */
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

export type LoginValues = z.infer<typeof loginSchema>

export const passwordSchema = z
  .object({
    password: z
      .string()
      .min(12, 'Use at least 12 characters.')
      .regex(/[A-Z]/, 'Include an uppercase letter.')
      .regex(/[a-z]/, 'Include a lowercase letter.')
      .regex(/[0-9]/, 'Include a number.'),
    confirm: z.string(),
  })
  .refine((values) => values.password === values.confirm, {
    message: 'Both passwords must match.',
    path: ['confirm'],
  })

/* ------------------------------ projects ---------------------------- */
export const projectSchema = z.object({
  title: z.string().trim().min(3, 'A project title is required.').max(180),
  slug: z.string().trim().max(120).optional().default(''),
  category: z.enum(PROJECT_CATEGORIES),
  description: z.string().trim().min(20, 'Describe the work in at least 20 characters.').max(4000),
  vehicle_make: optionalText,
  vehicle_model: optionalText,
  vehicle_year: yearField({ min: 1900, max: 2100 }),
  engine: optionalText,
  transmission: optionalText,
  vehicle_system: optionalText,
  problem_statement: optionalText,
  diagnostic_procedure: optionalText,
  tools_used: z.array(z.string()).default([]),
  measurements: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        value: z.string().trim(),
        unit: z.string().trim().default(''),
        specification: z.string().trim().default(''),
        result: z.enum(['pass', 'fail', 'inconclusive']),
      }),
    )
    .default([]),
  repair_procedure: optionalText,
  final_result: optionalText,
  cover_image: nullableText,
  gallery: z.array(z.string()).default([]),
  youtube_url: nullableText,
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'),
  seo_title: nullableText,
  seo_description: nullableText,
})

export type ProjectFormValues = z.input<typeof projectSchema>

/* --------------------------- diagnostic case ------------------------ */
export const diagnosticCaseSchema = z.object({
  title: z.string().trim().min(3, 'A case reference title is required.').max(180),
  slug: z.string().trim().max(120).optional().default(''),
  project_id: z.string().uuid().nullable().default(null).or(z.literal('').transform(() => null)),
  vehicle_make: optionalText,
  vehicle_model: optionalText,
  vehicle_year: yearField({ min: 1900, max: 2100 }),
  engine: optionalText,
  transmission: optionalText,
  vehicle_system: z.string().trim().min(2, 'Name the vehicle system investigated.'),
  vehicle_identification: nullableText,
  customer_complaint: z.string().trim().min(10, 'Record the customer complaint.').max(4000),
  dtc_codes: z
    .array(
      z.object({
        code: z.string().trim().min(1, 'DTC code required.'),
        description: z.string().trim().default(''),
        module: z.string().trim().default(''),
      }),
    )
    .default([]),
  scan_tool: optionalText,
  freeze_frame: optionalText,
  live_data: optionalText,
  diagnostic_procedure: z
    .array(z.object({ step: z.string().trim().min(1), finding: z.string().trim().default('') }))
    .default([]),
  measurements: z
    .array(
      z.object({
        label: z.string().trim().min(1),
        value: z.string().trim(),
        unit: z.string().trim().default(''),
        specification: z.string().trim().default(''),
        result: z.enum(['pass', 'fail', 'inconclusive']),
      }),
    )
    .default([]),
  confirmed_fault: optionalText,
  repair_procedure: optionalText,
  verification: z
    .array(
      z.object({
        check: z.string().trim().min(1),
        result: z.string().trim().default(''),
        status: z.enum(['pass', 'fail', 'pending']),
      }),
    )
    .default([]),
  media: z
    .array(
      z.object({
        url: z.string().trim().min(1),
        caption: z.string().trim().default(''),
        kind: z.enum(['scan', 'waveform', 'wiring', 'photo', 'video']),
      }),
    )
    .default([]),
  youtube_url: nullableText,
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'),
  seo_title: nullableText,
  seo_description: nullableText,
})

export type DiagnosticFormValues = z.input<typeof diagnosticCaseSchema>

/* ------------------------------- video ------------------------------ */
export const videoSchema = z.object({
  title: z.string().trim().min(3, 'A video title is required.').max(180),
  description: z.string().trim().max(4000).optional().default(''),
  youtube_url: z.string().trim().min(1, 'A YouTube URL is required.'),
  youtube_video_id: z.string().trim().regex(/^[A-Za-z0-9_-]{11}$/, 'Could not read a valid video ID.'),
  thumbnail_url: nullableText,
  category: z.enum(VIDEO_CATEGORIES),
  vehicle_make: optionalText,
  vehicle_model: optionalText,
  featured: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'),
})

export type VideoFormValues = z.input<typeof videoSchema>

/* ------------------------------ gallery ----------------------------- */
export const gallerySchema = z.object({
  title: z.string().trim().min(2, 'Add a title.').max(160),
  description: z.string().trim().max(1000).optional().default(''),
  image_url: z.string().trim().min(1, 'Upload or link an image.'),
  alt_text: z
    .string()
    .trim()
    .min(12, 'Alt text is required — describe what the photograph actually shows.')
    .max(300),
  category: z.enum(GALLERY_CATEGORIES),
  featured: z.boolean().default(false),
  display_order: z.coerce.number().int().min(0).max(999).default(0),
})

export type GalleryFormValues = z.input<typeof gallerySchema>

/* ------------------------------- skill ------------------------------ */
export const skillSchema = z.object({
  name: z.string().trim().min(2, 'Name the skill.').max(120),
  category: z.enum(SKILL_CATEGORIES),
  description: z.string().trim().max(500).optional().default(''),
  skill_level: z.enum(['practical', 'developing', 'interest']),
  display_order: z.coerce.number().int().min(0).max(999).default(0),
})

export type SkillFormValues = z.input<typeof skillSchema>

/* ---------------------------- certificate --------------------------- */
export const certificateSchema = z.object({
  title: z.string().trim().min(3, 'Add the certificate title.').max(180),
  slug: z.string().trim().max(120).optional().default(''),
  institution: z.string().trim().min(2, 'Add the issuing institution.').max(180),
  issue_date: z.string().trim().optional().default(''),
  description: z.string().trim().max(2000).optional().default(''),
  certificate_url: nullableText,
  verification_url: nullableText,
  featured: z.boolean().default(false),
  display_order: z.coerce.number().int().min(0).max(999).default(0),
})

export type CertificateFormValues = z.input<typeof certificateSchema>

/* ------------------------------ profile ----------------------------- */
export const profileSchema = z.object({
  full_name: z.string().trim().min(2, 'Full name is required.').max(120),
  headline: z.string().trim().min(3, 'A professional headline is required.').max(160),
  biography: z.string().trim().min(20, 'Biography must be at least 20 characters.').max(6000),
  hero_intro: z.string().trim().max(2000).optional().default(''),
  location: z.string().trim().max(120).optional().default(''),
  profile_image: nullableText,
  email: z.union([z.string().trim().email('Enter a valid email address.'), z.literal(''), z.null()]).optional(),
  phone: z.union([z.string().trim().max(40), z.literal(''), z.null()]).optional(),
  cv_url: nullableText,
  career_goals: nullableText,
  automotive_interests: z.array(z.string()).default([]),
  timeline: z
    .array(
      z.object({
        id: z.string(),
        period: z.string().trim().max(60),
        title: z.string().trim().max(160),
        organisation: z.string().trim().max(160),
        description: z.string().trim().max(600),
        kind: z.enum(['education', 'workshop', 'training', 'project', 'achievement']),
      }),
    )
    .default([]),
})

export type ProfileFormValues = z.input<typeof profileSchema>

/* ---------------------------- social link --------------------------- */
export const socialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  url: z.string().trim().min(1, 'Add the profile URL.').max(400),
  handle: nullableText,
  display_order: z.coerce.number().int().min(0).max(999).default(0),
})

export type SocialLinkFormValues = z.input<typeof socialLinkSchema>

/* ------------------------------ settings ---------------------------- */
export const settingsSchema = z.object({
  site_name: z.string().trim().min(2).max(160),
  site_tagline: z.string().trim().max(200).optional().default(''),
  meta_title: z.string().trim().min(10, 'Meta title should be at least 10 characters.').max(70),
  meta_description: z.string().trim().min(50, 'Meta description should be at least 50 characters.').max(170),
  og_image: z.string().trim().max(1000).optional().default(''),
  keywords: z.string().trim().max(600).optional().default(''),
  canonical_name: z.string().trim().min(2).max(120),
  contact_intro: z.string().trim().max(1000).optional().default(''),
  cv_headline: z.string().trim().max(200).optional().default(''),
  contact_notification_email: z.string().trim().max(200).optional().default(''),
  allow_contact_form: z.string().optional().default('true'),
  footer_note: z.string().trim().max(300).optional().default(''),
  ga_measurement_id: z.string().trim().max(60).optional().default(''),
})

export type SettingsFormValues = z.input<typeof settingsSchema>

/* --------------------------- form helpers --------------------------- */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const output: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form'
    if (!output[key]) output[key] = issue.message
  }
  return output
}

/** Converts an array of API errors into a single readable message. */
export function summariseIssues(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(' ')
}

export const projectStatusOptions = [
  { value: 'draft', label: 'Draft — not visible to visitors' },
  { value: 'published', label: 'Published — visible to visitors' },
] as const

export type PublicProject = Pick<Project, 'id' | 'title' | 'slug'>
