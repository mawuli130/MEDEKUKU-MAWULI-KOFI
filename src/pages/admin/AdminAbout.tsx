import { useEffect, useState } from 'react'
import { GraduationCap, Plus, Trash2 } from 'lucide-react'
import { PageTitle } from '@/components/admin/AdminTable'
import { FormField, SelectInput, TextArea, TextInput } from '@/components/admin/form'
import { Callout } from '@/components/ui'
import { useSiteData } from '@/hooks/useSiteData'
import { useToast } from '@/hooks/useToast'
import { getRepository } from '@/services'
import { uid } from '@/lib/utils'
import type { TimelineEntry } from '@/types'

const KINDS: TimelineEntry['kind'][] = ['education', 'workshop', 'training', 'project', 'achievement']

export default function AdminAbout() {
  const repository = getRepository()
  const { profile, refresh } = useSiteData()
  const toast = useToast()
  const [entries, setEntries] = useState<TimelineEntry[]>(profile.timeline)
  const [careerGoals, setCareerGoals] = useState(profile.career_goals ?? '')
  const [interests, setInterests] = useState(profile.automotive_interests.join('\n'))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setEntries(profile.timeline)
    setCareerGoals(profile.career_goals ?? '')
    setInterests(profile.automotive_interests.join('\n'))
  }, [profile])

  function updateEntry(id: string, patch: Partial<TimelineEntry>) {
    setEntries((current) => current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)))
  }

  async function save() {
    setSaving(true)
    try {
      await repository.profile.update({
        timeline: entries.filter((entry) => entry.title.trim()),
        career_goals: careerGoals || null,
        automotive_interests: interests
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      })
      refresh()
      toast.success('About page updated')
    } catch (error) {
      toast.error('Save failed', error instanceof Error ? error.message : undefined)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle
        title="About me"
        description="Professional timeline, career goals and automotive interests. Only add entries you can confirm — no invented dates or employers."
      />

      <div className="space-y-4">
        <div className="rounded border border-line bg-ink-925 p-4 sm:p-5">
          <h2 className="mb-1 font-display text-sm font-semibold uppercase tracking-[0.1em] text-white">
            Professional timeline
          </h2>
          <p className="mb-4 text-[0.6875rem] text-silver-600">
            Technical education, workshop experience, practical attachment, projects, training and achievements.
          </p>

          <div className="space-y-3">
            {entries.map((entry, index) => (
              <div key={entry.id} className="relative rounded border border-line bg-ink-950/60 p-3 pr-9">
                <span className="absolute right-2 top-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-600">
                  #{index + 1}
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  <FormField label="Title">
                    <TextInput
                      value={entry.title}
                      onChange={(v) => updateEntry(entry.id, { title: v })}
                      placeholder="Automotive engineering studies"
                    />
                  </FormField>
                  <FormField label="Organisation">
                    <TextInput
                      value={entry.organisation}
                      onChange={(v) => updateEntry(entry.id, { organisation: v })}
                      placeholder="Institution or workshop"
                    />
                  </FormField>
                  <FormField label="Period">
                    <TextInput
                      value={entry.period}
                      onChange={(v) => updateEntry(entry.id, { period: v })}
                      placeholder="2023 — 2025"
                    />
                  </FormField>
                  <FormField label="Type">
                    <SelectInput
                      value={entry.kind}
                      onChange={(v) => updateEntry(entry.id, { kind: v })}
                      options={KINDS.map((kind) => ({
                        value: kind,
                        label: kind.charAt(0).toUpperCase() + kind.slice(1),
                      }))}
                    />
                  </FormField>
                </div>
                <div className="mt-2">
                  <FormField label="Description">
                    <TextArea
                      value={entry.description}
                      onChange={(v) => updateEntry(entry.id, { description: v })}
                      rows={2}
                    />
                  </FormField>
                </div>
                <button
                  type="button"
                  onClick={() => setEntries((current) => current.filter((item) => item.id !== entry.id))}
                  className="absolute right-1.5 bottom-1.5 grid h-6 w-6 place-items-center rounded text-silver-500 hover:bg-danger-400/10 hover:text-danger-400"
                  aria-label="Remove timeline entry"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setEntries((current) => [
                ...current,
                {
                  id: uid('timeline'),
                  period: '',
                  title: '',
                  organisation: '',
                  description: '',
                  kind: 'education',
                },
              ])
            }
            className="btn btn-ghost btn-sm mt-3"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add timeline entry
          </button>
        </div>

        <div className="rounded border border-line bg-ink-925 p-4 sm:p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.1em] text-white">
            <GraduationCap className="h-4 w-4 text-signal-400" aria-hidden="true" />
            Career goals &amp; interests
          </h2>

          <FormField label="Career goals" htmlFor="about-goals" hint="Displayed on the about page and CV.">
            <TextArea id="about-goals" value={careerGoals} onChange={setCareerGoals} rows={3} />
          </FormField>

          <div className="mt-3">
            <FormField
              label="Automotive interests"
              htmlFor="about-interests"
              hint="One interest per line. Order is preserved on the public page."
            >
              <TextArea id="about-interests" value={interests} onChange={setInterests} rows={6} />
            </FormField>
          </div>
        </div>

        <Callout title="Accuracy">
          Do not add employment history, qualifications or dates that cannot be evidenced. Unconfirmed entries should
          be left out until they can be documented.
        </Callout>

        <div className="flex justify-end">
          <button type="button" onClick={() => void save()} className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save about page'}
          </button>
        </div>
      </div>
    </div>
  )
}
