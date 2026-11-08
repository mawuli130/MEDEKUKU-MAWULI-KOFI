import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { PageTitle } from '@/components/admin/AdminTable'
import { FormField, ImageUploader, TextArea, TextInput } from '@/components/admin/form'
import { FormActions } from '@/components/admin/form'
import { useSiteData } from '@/hooks/useSiteData'
import { useToast } from '@/hooks/useToast'
import { getRepository } from '@/services'
import { fieldErrors, profileSchema } from '@/lib/validation'

interface ProfileForm {
  full_name: string
  headline: string
  biography: string
  hero_intro: string
  location: string
  profile_image: string | null
  email: string
  phone: string
  career_goals: string | null
  automotive_interests: string[]
}

export default function AdminProfile() {
  const repository = getRepository()
  const { profile, refresh } = useSiteData()
  const toast = useToast()

  const [values, setValues] = useState<ProfileForm>({
    full_name: profile.full_name,
    headline: profile.headline,
    biography: profile.biography,
    hero_intro: profile.hero_intro,
    location: profile.location,
    profile_image: profile.profile_image,
    email: profile.email ?? '',
    phone: profile.phone ?? '',
    career_goals: profile.career_goals,
    automotive_interests: profile.automotive_interests,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [interestDraft, setInterestDraft] = useState('')

  useEffect(() => {
    setValues({
      full_name: profile.full_name,
      headline: profile.headline,
      biography: profile.biography,
      hero_intro: profile.hero_intro,
      location: profile.location,
      profile_image: profile.profile_image,
      email: profile.email ?? '',
      phone: profile.phone ?? '',
      career_goals: profile.career_goals,
      automotive_interests: profile.automotive_interests,
    })
  }, [profile])

  function set<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[key as string]
      return next
    })
  }

  async function save() {
    const parsed = profileSchema.safeParse({
      ...values,
      email: values.email || null,
      phone: values.phone || null,
    })
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      toast.error('Please fix the highlighted fields')
      return
    }
    setSaving(true)
    try {
      await repository.profile.update({
        ...parsed.data,
        email: values.email || null,
        phone: values.phone || null,
      } as Partial<typeof profile>)
      refresh()
      toast.success('Profile saved', 'Public pages now show the updated details.')
    } catch (error) {
      toast.error('Save failed', error instanceof Error ? error.message : undefined)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle
        title="Profile management"
        description="The name, headline, biography and portrait used across the entire public website."
      />

      <div className="space-y-4">
        <div className="rounded border border-line bg-ink-925 p-4 sm:p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.1em] text-white">
            <User className="h-4 w-4 text-signal-400" aria-hidden="true" />
            Identity
          </h2>

          <div className="space-y-4">
            {errors.form ? (
              <p className="rounded border border-danger-400/40 bg-danger-400/[0.08] p-2.5 text-xs text-danger-400">
                {errors.form}
              </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Full name" htmlFor="pr-name" required error={errors.full_name}>
                <TextInput id="pr-name" value={values.full_name} onChange={(v) => set('full_name', v)} />
              </FormField>
              <FormField label="Professional headline" htmlFor="pr-headline" required error={errors.headline}>
                <TextInput id="pr-headline" value={values.headline} onChange={(v) => set('headline', v)} />
              </FormField>
              <FormField label="Location" htmlFor="pr-location" error={errors.location}>
                <TextInput id="pr-location" value={values.location} onChange={(v) => set('location', v)} />
              </FormField>
              <FormField label="Public email" htmlFor="pr-email" error={errors.email}>
                <TextInput id="pr-email" type="email" value={values.email} onChange={(v) => set('email', v)} />
              </FormField>
              <FormField label="Phone (optional)" htmlFor="pr-phone" error={errors.phone}>
                <TextInput id="pr-phone" value={values.phone} onChange={(v) => set('phone', v)} />
              </FormField>
            </div>

            <ImageUploader
              label="Portrait photograph"
              bucket="profile"
              folder="portrait"
              value={values.profile_image}
              onChange={(url) => set('profile_image', url)}
              aspect="aspect-[4/5]"
              hint="A genuine professional portrait. Until one is uploaded, a monogram placeholder is shown."
            />

            <FormField
              label="Primary biography statement"
              htmlFor="pr-bio"
              required
              error={errors.biography}
              hint="Used in the about page, CV and structured data."
            >
              <TextArea id="pr-bio" value={values.biography} onChange={(v) => set('biography', v)} rows={4} />
            </FormField>

            <FormField
              label="Homepage introduction"
              htmlFor="pr-hero"
              error={errors.hero_intro}
              hint="Displayed in the hero section of the homepage."
            >
              <TextArea id="pr-hero" value={values.hero_intro} onChange={(v) => set('hero_intro', v)} rows={4} />
            </FormField>

            <FormField label="Career goals" htmlFor="pr-goals" error={errors.career_goals}>
              <TextArea
                id="pr-goals"
                value={values.career_goals ?? ''}
                onChange={(v) => set('career_goals', v || null)}
                rows={3}
              />
            </FormField>

            <FormField label="Automotive interests" hint="Press Enter to add each interest.">
              <div className="flex gap-2">
                <TextInput
                  value={interestDraft}
                  onChange={setInterestDraft}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      const next = interestDraft.trim()
                      if (next) {
                        set('automotive_interests', [...values.automotive_interests, next])
                        setInterestDraft('')
                      }
                    }
                  }}
                  placeholder="Hybrid vehicle systems"
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm shrink-0"
                  onClick={() => {
                    const next = interestDraft.trim()
                    if (next) {
                      set('automotive_interests', [...values.automotive_interests, next])
                      setInterestDraft('')
                    }
                  }}
                >
                  Add
                </button>
              </div>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {values.automotive_interests.map((interest, index) => (
                  <li key={`${interest}-${index}`} className="chip">
                    {interest}
                    <button
                      type="button"
                      onClick={() =>
                        set(
                          'automotive_interests',
                          values.automotive_interests.filter((_, position) => position !== index),
                        )
                      }
                      className="ml-1 text-silver-500 hover:text-danger-400"
                      aria-label={`Remove ${interest}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </FormField>
          </div>
        </div>

        <div className="rounded border border-line bg-ink-925 p-4">
          <FormActions
            saving={saving}
            onSubmit={() => void save()}
            submitLabel="Save profile"
          />
        </div>
      </div>
    </div>
  )
}
