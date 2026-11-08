import { useState } from 'react'
import { Download, ExternalLink, FileText, Trash2, Upload } from 'lucide-react'
import { PageTitle } from '@/components/admin/AdminTable'
import { Callout } from '@/components/ui'
import { useSiteData } from '@/hooks/useSiteData'
import { useToast } from '@/hooks/useToast'
import { getRepository } from '@/services'
import { uploadDocument } from '@/services/storage'
import { assertPdfFile } from '@/lib/image'
import { fileSizeLabel } from '@/lib/utils'
import { DATA_SOURCE } from '@/lib/config'

export default function AdminCV() {
  const repository = getRepository()
  const { profile, settings, refresh } = useSiteData()
  const toast = useToast()

  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [headline, setHeadline] = useState(settings.cv_headline ?? '')
  const [savingHeadline, setSavingHeadline] = useState(false)

  async function handleUpload(file: File | undefined) {
    if (!file) return
    try {
      assertPdfFile(file)
    } catch (error) {
      toast.error('Invalid file', error instanceof Error ? error.message : undefined)
      return
    }
    setUploading(true)
    setProgress(0)
    try {
      const result = await uploadDocument(file, { bucket: 'cv', folder: 'curriculum-vitae', onProgress: setProgress })
      await repository.profile.update({ cv_url: result.url })
      refresh()
      toast.success('CV uploaded', 'The download button is now live across the public site.')
    } catch (error) {
      toast.error('Upload failed', error instanceof Error ? error.message : undefined)
    } finally {
      setUploading(false)
      setProgress(null)
    }
  }

  async function removeCV() {
    try {
      await repository.profile.update({ cv_url: null })
      refresh()
      toast.success('CV removed')
    } catch (error) {
      toast.error('Could not remove the CV', error instanceof Error ? error.message : undefined)
    }
  }

  async function saveHeadline() {
    setSavingHeadline(true)
    try {
      await repository.settings.setAll({ ...settings, cv_headline: headline })
      refresh()
      toast.success('CV heading saved')
    } catch (error) {
      toast.error('Save failed', error instanceof Error ? error.message : undefined)
    } finally {
      setSavingHeadline(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle
        title="CV management"
        description="Upload the PDF curriculum vitae. It is publicly downloadable without any login, as required for recruiters."
      />

      <div className="space-y-4">
        <div className="rounded border border-line bg-ink-925 p-4 sm:p-5">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.1em] text-white">
            Current document
          </h2>

          {profile.cv_url ? (
            <div className="rounded border border-line bg-ink-950/60 p-3">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-signal-400" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">Curriculum vitae (PDF)</p>
                  <p className="truncate font-mono text-[0.625rem] text-silver-500">
                    {profile.cv_url.startsWith('data:')
                      ? `Inline PDF · ${fileSizeLabel(profile.cv_url.length)}`
                      : profile.cv_url}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  Open
                </a>
                <a href={profile.cv_url} download className="btn btn-ghost btn-sm">
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Download
                </a>
                <button type="button" onClick={() => void removeCV()} className="btn btn-danger btn-sm">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <p className="rounded border border-dashed border-line p-4 text-center text-xs text-silver-500">
              No CV uploaded yet. Visitors see a polite placeholder and can request it by message.
            </p>
          )}

          <div className="mt-4">
            <label
              htmlFor="cv-file"
              className={`btn btn-primary btn-sm cursor-pointer ${uploading ? 'pointer-events-none opacity-60' : ''}`}
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              {uploading ? 'Uploading…' : profile.cv_url ? 'Replace CV PDF' : 'Upload CV PDF'}
            </label>
            <input
              id="cv-file"
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(event) => {
                void handleUpload(event.target.files?.[0])
                event.target.value = ''
              }}
              disabled={uploading}
            />
            <p className="mt-2 text-[0.6875rem] text-silver-600">
              PDF only, up to 16 MB. {DATA_SOURCE === 'supabase' ? 'Stored in the Supabase "cv" bucket.' : 'Stored in this browser during local preview.'}
            </p>
            {progress !== null ? (
              <div className="mt-2">
                <div className="h-1 w-full overflow-hidden rounded-full bg-ink-700">
                  <div className="h-full rounded-full bg-signal-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-500">
                  Uploading · {progress}%
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded border border-line bg-ink-925 p-4 sm:p-5">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.1em] text-white">
            CV page heading
          </h2>
          <label htmlFor="cv-headline" className="sr-only">
            CV page heading
          </label>
          <input
            id="cv-headline"
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            className="field"
            placeholder="Automotive Electronics & Diagnostic Technician — Curriculum Vitae"
          />
          <button
            type="button"
            onClick={() => void saveHeadline()}
            className="btn btn-secondary btn-sm mt-3"
            disabled={savingHeadline}
          >
            {savingHeadline ? 'Saving…' : 'Save heading'}
          </button>
        </div>

        <Callout title="What the CV page contains">
          The public CV page is generated from the profile, skills, certificates, timeline and projects stored in the
          database, so it updates automatically. The uploaded PDF is the authoritative document.
        </Callout>
      </div>
    </div>
  )
}
