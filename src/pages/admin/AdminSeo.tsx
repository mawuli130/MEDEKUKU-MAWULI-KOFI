import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Globe, Search } from 'lucide-react'
import { PageTitle } from '@/components/admin/AdminTable'
import { FormField, ImageUploader, TextArea, TextInput } from '@/components/admin/form'
import { Callout } from '@/components/ui'
import { useSiteData } from '@/hooks/useSiteData'
import { useToast } from '@/hooks/useToast'
import { getRepository } from '@/services'
import { SITE_URL } from '@/lib/config'
import { fieldErrors, settingsSchema } from '@/lib/validation'

const SEO_FIELDS = ['meta_title', 'meta_description', 'keywords', 'og_image', 'canonical_name'] as const

export default function AdminSeo() {
  const repository = getRepository()
  const { settings, profile, refresh } = useSiteData()
  const toast = useToast()

  const [values, setValues] = useState({
    meta_title: settings.meta_title ?? '',
    meta_description: settings.meta_description ?? '',
    keywords: settings.keywords ?? '',
    og_image: settings.og_image ?? '',
    canonical_name: settings.canonical_name ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setValues({
      meta_title: settings.meta_title ?? '',
      meta_description: settings.meta_description ?? '',
      keywords: settings.keywords ?? '',
      og_image: settings.og_image ?? '',
      canonical_name: settings.canonical_name ?? '',
    })
  }, [settings])

  async function save() {
    // Validate the SEO subset only: other settings are edited elsewhere and must
    // not block this save.
    const parsed = settingsSchema.safeParse({ ...settings, ...values })
    if (!parsed.success) {
      const all = fieldErrors(parsed.error)
      const relevant = Object.fromEntries(
        Object.entries(all).filter(([key]) => (SEO_FIELDS as readonly string[]).includes(key)),
      )
      if (Object.keys(relevant).length > 0) {
        setErrors(relevant)
        toast.error('Please fix the highlighted SEO fields')
        return
      }
    }
    await persist()
  }

  async function persist() {
    setSaving(true)
    try {
      await repository.settings.setAll({ ...settings, ...values })
      refresh()
      toast.success('SEO settings saved', 'Public pages now use the updated metadata.')
    } catch (error) {
      toast.error('Save failed', error instanceof Error ? error.message : undefined)
    } finally {
      setSaving(false)
    }
  }

  const titleLength = values.meta_title.length
  const descriptionLength = values.meta_description.length

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle
        title="SEO settings"
        description="Global metadata for the homepage, Open Graph previews and search engines. Individual projects and case studies can override these."
      />

      <div className="space-y-4">
        <div className="rounded border border-line bg-ink-925 p-4 sm:p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.1em] text-white">
            <Search className="h-4 w-4 text-signal-400" aria-hidden="true" />
            Global metadata
          </h2>

          <div className="space-y-4">
            <FormField
              label="Homepage meta title"
              htmlFor="seo-title"
              required
              error={errors.meta_title}
              hint={`${titleLength}/70 characters — aim for 50–60.`}
            >
              <TextInput id="seo-title" value={values.meta_title} onChange={(v) => setValues((s) => ({ ...s, meta_title: v }))} />
            </FormField>

            <FormField
              label="Meta description"
              htmlFor="seo-desc"
              required
              error={errors.meta_description}
              hint={`${descriptionLength}/170 characters — aim for 140–160.`}
            >
              <TextArea
                id="seo-desc"
                value={values.meta_description}
                onChange={(v) => setValues((s) => ({ ...s, meta_description: v }))}
                rows={3}
              />
            </FormField>

            <FormField
              label="Canonical name"
              htmlFor="seo-name"
              error={errors.canonical_name}
              hint="Used in structured data and the footer copyright."
            >
              <TextInput
                id="seo-name"
                value={values.canonical_name}
                onChange={(v) => setValues((s) => ({ ...s, canonical_name: v }))}
              />
            </FormField>

            <FormField
              label="Keywords"
              htmlFor="seo-keywords"
              error={errors.keywords}
              hint="Comma-separated. Low ranking weight — keep it accurate, not stuffed."
            >
              <TextArea
                id="seo-keywords"
                value={values.keywords}
                onChange={(v) => setValues((s) => ({ ...s, keywords: v }))}
                rows={3}
              />
            </FormField>

            <ImageUploader
              label="Social sharing image (Open Graph)"
              bucket="profile"
              folder="og"
              value={values.og_image || null}
              onChange={(url) => setValues((s) => ({ ...s, og_image: url ?? '' }))}
              aspect="aspect-[1200/630]"
              hint="Recommended 1200×630. Used by WhatsApp, LinkedIn and X previews."
            />
          </div>
        </div>

        {/* Search preview */}
        <div className="rounded border border-line bg-ink-925 p-4">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.1em] text-white">
            Search result preview
          </h2>
          <div className="rounded border border-line bg-white p-4">
            <p className="truncate text-[0.75rem] text-[#3c4043]">{SITE_URL.replace(/^https?:\/\//, '')}</p>
            <p className="mt-0.5 line-clamp-2 text-[1.05rem] leading-snug text-[#1a0dab]">{values.meta_title}</p>
            <p className="mt-1 line-clamp-3 text-[0.8125rem] leading-snug text-[#4d5156]">{values.meta_description}</p>
          </div>
        </div>

        <Callout title="Structured data">
          Person JSON-LD is generated automatically from the profile (name, job title, Accra, Ghana) plus the YouTube
          and LinkedIn links configured under Social Links. Only real URLs are emitted.
        </Callout>

        <div className="rounded border border-line bg-ink-925 p-4">
          <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.1em] text-white">
            <Globe className="h-4 w-4 text-signal-400" aria-hidden="true" />
            Indexing files
          </h2>
          <p className="text-[0.6875rem] leading-relaxed text-silver-400">
            <code className="font-mono text-silver-200">robots.txt</code> is static and allows public pages while
            disallowing <code className="font-mono">/admin</code>.{' '}
            <code className="font-mono text-silver-200">sitemap.xml</code> is regenerated at build time from published
            projects, case studies, videos and certificates.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/robots.txt" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              robots.txt
            </a>
            <a href="/sitemap.xml" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              sitemap.xml
            </a>
            <Link to="/" target="_blank" className="btn btn-ghost btn-sm">
              View homepage
            </Link>
          </div>
        </div>

        <p className="text-[0.6875rem] text-silver-600">
          Canonical base URL: <span className="font-mono text-silver-400">{SITE_URL}</span> (set via{' '}
          <code className="font-mono">VITE_SITE_URL</code>) · Profile name: {profile.full_name}
        </p>

        <div className="flex justify-end">
          <button type="button" onClick={() => void save()} className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save SEO settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
