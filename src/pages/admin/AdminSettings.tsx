import { useEffect, useState } from 'react'
import { Settings } from 'lucide-react'
import { PageTitle } from '@/components/admin/AdminTable'
import { FormField, SelectInput, TextArea, TextInput } from '@/components/admin/form'
import { Callout } from '@/components/ui'
import { useSiteData } from '@/hooks/useSiteData'
import { useToast } from '@/hooks/useToast'
import { getRepository } from '@/services'
import { fieldErrors, settingsSchema } from '@/lib/validation'
import { DATA_SOURCE } from '@/lib/config'

export default function AdminSettings() {
  const repository = getRepository()
  const { settings, refresh } = useSiteData()
  const toast = useToast()

  const [values, setValues] = useState({
    site_name: settings.site_name ?? '',
    site_tagline: settings.site_tagline ?? '',
    contact_intro: settings.contact_intro ?? '',
    allow_contact_form: settings.allow_contact_form ?? 'true',
    footer_note: settings.footer_note ?? '',
    ga_measurement_id: settings.ga_measurement_id ?? '',
    contact_notification_email: settings.contact_notification_email ?? '',
    meta_title: settings.meta_title ?? '',
    meta_description: settings.meta_description ?? '',
    canonical_name: settings.canonical_name ?? '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setValues({
      site_name: settings.site_name ?? '',
      site_tagline: settings.site_tagline ?? '',
      contact_intro: settings.contact_intro ?? '',
      allow_contact_form: settings.allow_contact_form ?? 'true',
      footer_note: settings.footer_note ?? '',
      ga_measurement_id: settings.ga_measurement_id ?? '',
      contact_notification_email: settings.contact_notification_email ?? '',
      meta_title: settings.meta_title ?? '',
      meta_description: settings.meta_description ?? '',
      canonical_name: settings.canonical_name ?? '',
    })
  }, [settings])

  async function save() {
    const parsed = settingsSchema.safeParse({ ...settings, ...values })
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      toast.error('Please fix the highlighted fields')
      return
    }
    setSaving(true)
    try {
      await repository.settings.setAll({ ...settings, ...values })
      refresh()
      toast.success('Website settings saved')
    } catch (error) {
      toast.error('Save failed', error instanceof Error ? error.message : undefined)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle
        title="Website settings"
        description="Site identity, contact behaviour and footer content."
      />

      <div className="space-y-4">
        <div className="rounded border border-line bg-ink-925 p-4 sm:p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.1em] text-white">
            <Settings className="h-4 w-4 text-signal-400" aria-hidden="true" />
            Site identity
          </h2>
          <div className="space-y-4">
            <FormField label="Site name" htmlFor="st-name" required error={errors.site_name}>
              <TextInput id="st-name" value={values.site_name} onChange={(v) => setValues((s) => ({ ...s, site_name: v }))} />
            </FormField>
            <FormField label="Tagline" htmlFor="st-tag" error={errors.site_tagline}>
              <TextInput id="st-tag" value={values.site_tagline} onChange={(v) => setValues((s) => ({ ...s, site_tagline: v }))} />
            </FormField>
            <FormField label="Footer note" htmlFor="st-footer" error={errors.footer_note} hint="Appears beside the copyright line.">
              <TextInput id="st-footer" value={values.footer_note} onChange={(v) => setValues((s) => ({ ...s, footer_note: v }))} />
            </FormField>
          </div>
        </div>

        <div className="rounded border border-line bg-ink-925 p-4 sm:p-5">
          <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.1em] text-white">
            Contact behaviour
          </h2>
          <div className="space-y-4">
            <FormField label="Contact page introduction" htmlFor="st-intro" error={errors.contact_intro}>
              <TextArea
                id="st-intro"
                value={values.contact_intro}
                onChange={(v) => setValues((s) => ({ ...s, contact_intro: v }))}
                rows={3}
              />
            </FormField>
            <FormField label="Contact form availability" htmlFor="st-form">
              <SelectInput
                id="st-form"
                value={values.allow_contact_form}
                onChange={(v) => setValues((s) => ({ ...s, allow_contact_form: v }))}
                options={[
                  { value: 'true', label: 'Accepting messages' },
                  { value: 'false', label: 'Closed — show notice instead' },
                ]}
              />
            </FormField>
            <FormField
              label="Notification email (optional)"
              htmlFor="st-notify"
              hint="Where you would like to be alerted about new enquiries. Stored only; sending requires an email provider."
            >
              <TextInput
                id="st-notify"
                value={values.contact_notification_email}
                onChange={(v) => setValues((s) => ({ ...s, contact_notification_email: v }))}
              />
            </FormField>
          </div>
        </div>

        <div className="rounded border border-line bg-ink-925 p-4 sm:p-5">
          <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.1em] text-white">
            Analytics
          </h2>
          <FormField
            label="Google Analytics measurement ID (optional)"
            htmlFor="st-ga"
            hint="Stored for reference. No third-party analytics script is injected by default, to avoid unexpected tracking."
          >
            <TextInput
              id="st-ga"
              value={values.ga_measurement_id}
              onChange={(v) => setValues((s) => ({ ...s, ga_measurement_id: v }))}
              placeholder="G-XXXXXXXXXX"
            />
          </FormField>
        </div>

        <Callout title="Environment">
          Content source: <strong>{DATA_SOURCE === 'supabase' ? 'Supabase (PostgreSQL)' : 'Local browser storage'}</strong>.
          {DATA_SOURCE === 'local'
            ? ' Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to persist content across devices.'
            : ' Row Level Security restricts writes to authorised administrators.'}
        </Callout>

        <div className="flex justify-end">
          <button type="button" onClick={() => void save()} className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
