import { describe, expect, it } from 'vitest'
import {
  extractYoutubeId,
  measureCountLabel,
  slugify,
  truncate,
  vehicleLabel,
  youtubeEmbedUrl,
} from '@/lib/utils'
import { contactFormSchema, fieldErrors, projectSchema } from '@/lib/validation'
import { toPublicCase } from '@/lib/utils'
import type { DiagnosticCase } from '@/types'

describe('extractYoutubeId', () => {
  const id = 'dQw4w9WgXcQ'

  it('parses youtube.com/watch URLs', () => {
    expect(extractYoutubeId(`https://www.youtube.com/watch?v=${id}`)).toBe(id)
    expect(extractYoutubeId(`https://youtube.com/watch?v=${id}&t=42s`)).toBe(id)
    expect(extractYoutubeId(`http://m.youtube.com/watch?app=desktop&v=${id}`)).toBe(id)
  })

  it('parses youtu.be short URLs', () => {
    expect(extractYoutubeId(`https://youtu.be/${id}`)).toBe(id)
    expect(extractYoutubeId(`https://youtu.be/${id}?si=abc123`)).toBe(id)
  })

  it('parses shorts, embed and live URLs', () => {
    expect(extractYoutubeId(`https://www.youtube.com/shorts/${id}`)).toBe(id)
    expect(extractYoutubeId(`https://www.youtube.com/embed/${id}`)).toBe(id)
    expect(extractYoutubeId(`https://www.youtube.com/live/${id}`)).toBe(id)
  })

  it('accepts a bare video id and tolerates missing protocol', () => {
    expect(extractYoutubeId(id)).toBe(id)
    expect(extractYoutubeId(`youtube.com/watch?v=${id}`)).toBe(id)
  })

  it('rejects non-YouTube and malformed input', () => {
    expect(extractYoutubeId('https://vimeo.com/123456')).toBeNull()
    expect(extractYoutubeId('https://www.youtube.com/watch?v=short')).toBeNull()
    expect(extractYoutubeId('')).toBeNull()
    expect(extractYoutubeId('not a url at all')).toBeNull()
  })

  it('builds a privacy-enhanced embed without autoplay', () => {
    const embed = youtubeEmbedUrl(id)
    expect(embed.startsWith('https://www.youtube-nocookie.com/embed/')).toBe(true)
    expect(embed).toContain('autoplay=0')
    expect(embed).toContain('rel=0')
  })
})

describe('slugify', () => {
  it('creates URL-safe slugs', () => {
    expect(slugify('ABS Warning Light — Intermittent!')).toBe('abs-warning-light-intermittent')
    expect(slugify('  ECU/TCU   fault  ')).toBe('ecutcu-fault')
    expect(slugify('Café Électrique')).toBe('cafe-electrique')
  })

  it('never leaves leading or trailing hyphens', () => {
    expect(slugify('---test---')).toBe('test')
  })
})

describe('vehicleLabel / truncate', () => {
  it('joins available vehicle fields only', () => {
    expect(vehicleLabel({ vehicle_make: 'Toyota', vehicle_model: 'Corolla', vehicle_year: 2014 })).toBe(
      'Toyota Corolla 2014',
    )
    expect(vehicleLabel({ vehicle_make: 'Toyota', vehicle_model: '', vehicle_year: null })).toBe('Toyota')
    expect(vehicleLabel({})).toBe('')
  })

  it('truncates with an ellipsis', () => {
    expect(truncate('abcdef', 4)).toBe('abc…')
    expect(truncate('abc', 10)).toBe('abc')
  })

  it('formats measurement counts for tables', () => {
    expect(measureCountLabel(0)).toBe('0 measurements')
    expect(measureCountLabel(1)).toBe('1 measurement')
    expect(measureCountLabel(4)).toBe('4 measurements')
  })
})

describe('toPublicCase', () => {
  it('strips vehicle identification from the public projection', () => {
    const record = {
      id: '1',
      vehicle_identification: 'VIN-SECRET-123',
    } as unknown as DiagnosticCase
    expect(toPublicCase(record).vehicle_identification).toBeNull()
  })
})

describe('contactFormSchema', () => {
  const valid = {
    name: 'Ama Mensah',
    email: 'ama@example.com',
    subject: 'Workshop role enquiry',
    message: 'I would like to discuss a diagnostic technician position at our workshop in Accra.',
    company: '',
    consent: true as const,
  }

  it('accepts a complete submission', () => {
    expect(contactFormSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects an invalid email, short message and missing consent', () => {
    const result = contactFormSchema.safeParse({
      ...valid,
      email: 'not-an-email',
      message: 'too short',
      consent: false,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = fieldErrors(result.error)
      expect(errors.email).toBeTruthy()
      expect(errors.message).toBeTruthy()
      expect(errors.consent).toBeTruthy()
    }
  })

  it('rejects a filled honeypot', () => {
    const result = contactFormSchema.safeParse({ ...valid, company: 'spam-bot' })
    expect(result.success).toBe(false)
  })
})

describe('projectSchema', () => {
  it('coerces a string year and rejects an implausible one', () => {
    const base = {
      title: 'ABS fault diagnosis',
      category: 'ABS and Brake Systems',
      description: 'A sufficiently long description of the project work performed.',
      vehicle_year: '2015',
    }
    const ok = projectSchema.safeParse(base)
    expect(ok.success).toBe(true)
    if (ok.success) expect(ok.data.vehicle_year).toBe(2015)

    const bad = projectSchema.safeParse({ ...base, vehicle_year: '1492' })
    expect(bad.success).toBe(false)
  })

  it('defaults status to draft and featured to false', () => {
    const parsed = projectSchema.parse({
      title: 'Sensor signal testing',
      category: 'Sensor and Actuator Testing',
      description: 'Testing a MAP sensor signal with a multimeter and scan tool live data.',
    })
    expect(parsed.status).toBe('draft')
    expect(parsed.featured).toBe(false)
  })
})
