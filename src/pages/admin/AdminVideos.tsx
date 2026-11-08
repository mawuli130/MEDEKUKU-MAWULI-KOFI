import { useState } from 'react'
import { CheckCircle2, Video } from 'lucide-react'
import { AddButton, ConfirmDialog, DataTable, PageTitle, StatusPill } from '@/components/admin/AdminTable'
import { Drawer } from '@/components/admin/Drawer'
import {
  FormActions,
  FormField,
  ImageUploader,
  SelectInput,
  TextArea,
  TextInput,
  Toggle,
} from '@/components/admin/form'
import { EmptyState, Tag } from '@/components/ui'
import { useCollectionManager } from '@/hooks/useCollectionManager'
import { getRepository, type Draft } from '@/services'
import { videoSchema } from '@/lib/validation'
import { VIDEO_CATEGORIES, type VideoCategory, type YoutubeVideo } from '@/types'
import { extractYoutubeId, formatDate, youtubeThumbnail } from '@/lib/utils'

interface VideoForm {
  title: string
  description: string
  youtube_url: string
  youtube_video_id: string
  thumbnail_url: string | null
  category: VideoCategory
  vehicle_make: string
  vehicle_model: string
  featured: boolean
  status: 'draft' | 'published'
}

const EMPTY: VideoForm = {
  title: '',
  description: '',
  youtube_url: '',
  youtube_video_id: '',
  thumbnail_url: null,
  category: 'Vehicle Diagnostics',
  vehicle_make: '',
  vehicle_model: '',
  featured: false,
  status: 'draft',
}

export default function AdminVideos() {
  const repository = getRepository()
  const [detected, setDetected] = useState<string | null>(null)

  const manager = useCollectionManager<YoutubeVideo, VideoForm, Draft<YoutubeVideo>>({
    label: 'Video',
    schema: videoSchema,
    emptyValues: EMPTY,
    load: () => repository.videos.list({ includeDrafts: true }),
    create: (input) => repository.videos.create(input),
    update: (id, input) => repository.videos.update(id, input),
    remove: (id) => repository.videos.remove(id),
    toForm: (video) => ({
      title: video.title,
      description: video.description,
      youtube_url: video.youtube_url,
      youtube_video_id: video.youtube_video_id,
      thumbnail_url: video.thumbnail_url,
      category: video.category,
      vehicle_make: video.vehicle_make,
      vehicle_model: video.vehicle_model,
      featured: video.featured,
      status: video.status,
    }),
    toPayload: (parsed) => {
      const values = parsed as VideoForm
      // Always re-derive the id from the saved URL so the two can never diverge.
      const derivedId = extractYoutubeId(values.youtube_url) ?? values.youtube_video_id
      return {
        title: values.title,
        description: values.description,
        youtube_url: values.youtube_url,
        youtube_video_id: derivedId,
        thumbnail_url: values.thumbnail_url,
        category: values.category,
        vehicle_make: values.vehicle_make,
        vehicle_model: values.vehicle_model,
        featured: values.featured,
        status: values.status,
        published_at: values.status === 'published' ? new Date().toISOString() : null,
      }
    },
  })

  const values = manager.values

  function handleUrlChange(url: string) {
    manager.setValue('youtube_url', url)
    const id = extractYoutubeId(url)
    setDetected(id)
    if (id) {
      manager.setValue('youtube_video_id', id)
      if (!values.thumbnail_url) {
        manager.setValue('thumbnail_url', youtubeThumbnail(id))
      }
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="YouTube videos"
        description="Paste a YouTube link — the video ID is extracted automatically. Videos are embedded from YouTube; no files are uploaded to storage."
        count={manager.rows.length}
        action={<AddButton onClick={manager.openCreate} label="Add video" />}
      />

      <DataTable
        caption="YouTube videos"
        rows={manager.rows}
        loading={manager.loading}
        error={manager.error}
        onRetry={manager.reload}
        onEdit={manager.openEdit}
        onDelete={manager.requestDelete}
        onPreview={(row) => window.open(`/videos/${row.youtube_video_id}`, '_blank', 'noopener')}
        columns={[
          {
            header: 'Video',
            cell: (row) => (
              <div className="flex min-w-0 items-center gap-2.5">
                <img
                  src={row.thumbnail_url ?? youtubeThumbnail(row.youtube_video_id)}
                  alt=""
                  className="h-9 w-14 shrink-0 rounded object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{row.title}</p>
                  <p className="truncate font-mono text-[0.625rem] text-silver-500">{row.youtube_video_id}</p>
                </div>
              </div>
            ),
          },
          {
            header: 'Category',
            cell: (row) => <span className="text-[0.6875rem] text-silver-400">{row.category}</span>,
            hideOnMobile: true,
          },
          {
            header: 'Status',
            cell: (row) => (
              <div className="flex flex-wrap gap-1">
                <StatusPill status={row.status} />
                {row.featured ? <Tag tone="signal">Featured</Tag> : null}
              </div>
            ),
          },
          {
            header: 'Added',
            cell: (row) => (
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-600">
                {formatDate(row.created_at)}
              </span>
            ),
            hideOnMobile: true,
          },
        ]}
        empty={
          <EmptyState
            title="Add Your YouTube Video"
            body="Paste the URL of a real automotive video from your channel — diagnostics, electrical repair or a workshop demonstration."
            icon={Video}
            adminHint
            action={<AddButton onClick={manager.openCreate} label="Add video" />}
          />
        }
      />

      <Drawer
        open={manager.editorOpen}
        title={manager.editing ? 'Edit video' : 'Add YouTube video'}
        description="Supported: youtube.com/watch?v=…, youtu.be/…, youtube.com/shorts/…"
        onClose={manager.closeEditor}
        footer={
          <FormActions
            saving={manager.saving}
            onSubmit={() => void manager.save()}
            onCancel={manager.closeEditor}
            submitLabel={manager.editing ? 'Save changes' : 'Add video'}
          />
        }
      >
        <div className="space-y-4">
          {manager.errors.form ? (
            <p className="rounded border border-danger-400/40 bg-danger-400/[0.08] p-2.5 text-xs text-danger-400">
              {manager.errors.form}
            </p>
          ) : null}

          <FormField label="YouTube URL" htmlFor="v-url" required error={manager.errors.youtube_url}>
            <TextInput
              id="v-url"
              value={values.youtube_url}
              onChange={handleUrlChange}
              placeholder="https://www.youtube.com/watch?v=…"
            />
            {values.youtube_video_id && extractYoutubeId(values.youtube_url) === values.youtube_video_id ? (
              <p className="mt-1.5 flex items-center gap-1.5 font-mono text-[0.625rem] text-ok-400">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                Video ID: {values.youtube_video_id}
                {detected ? ' (detected)' : ''}
              </p>
            ) : values.youtube_url ? (
              <p className="mt-1.5 text-xs text-danger-400">
                This is not a recognisable YouTube video URL. Supported formats: youtube.com/watch?v=…, youtu.be/…,
                youtube.com/shorts/…
              </p>
            ) : null}
            {manager.errors.youtube_video_id ? (
              <p className="mt-1.5 text-xs text-danger-400">{manager.errors.youtube_video_id}</p>
            ) : null}
          </FormField>

          {values.youtube_video_id ? (
            <div className="overflow-hidden rounded border border-line">
              <img
                src={values.thumbnail_url ?? youtubeThumbnail(values.youtube_video_id)}
                alt="Video thumbnail preview"
                className="aspect-video w-full object-cover"
              />
            </div>
          ) : null}

          <FormField label="Video title" htmlFor="v-title" required error={manager.errors.title}>
            <TextInput id="v-title" value={values.title} onChange={(v) => manager.setValue('title', v)} />
          </FormField>

          <FormField label="Description" htmlFor="v-desc">
            <TextArea id="v-desc" value={values.description} onChange={(v) => manager.setValue('description', v)} rows={3} />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Category" htmlFor="v-cat">
              <SelectInput
                id="v-cat"
                value={values.category}
                onChange={(v) => manager.setValue('category', v)}
                options={VIDEO_CATEGORIES}
              />
            </FormField>
            <FormField label="Publication status" htmlFor="v-status">
              <SelectInput
                id="v-status"
                value={values.status}
                onChange={(v) => manager.setValue('status', v)}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'published', label: 'Published' },
                ]}
              />
            </FormField>
            <FormField label="Vehicle make" htmlFor="v-make">
              <TextInput id="v-make" value={values.vehicle_make} onChange={(v) => manager.setValue('vehicle_make', v)} />
            </FormField>
            <FormField label="Vehicle model" htmlFor="v-model">
              <TextInput id="v-model" value={values.vehicle_model} onChange={(v) => manager.setValue('vehicle_model', v)} />
            </FormField>
          </div>

          <Toggle
            checked={values.featured}
            onChange={(v) => manager.setValue('featured', v)}
            label="Feature this video"
            description="Featured videos appear first on the homepage."
          />

          <ImageUploader
            label="Custom thumbnail (optional)"
            bucket="videos"
            folder="thumbnails"
            value={values.thumbnail_url}
            onChange={(url) => manager.setValue('thumbnail_url', url)}
            hint="Leave empty to use the YouTube thumbnail automatically."
          />
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(manager.deleting)}
        title="Remove this video?"
        body={`"${manager.deleting?.title ?? ''}" will be removed from the portfolio. The video itself remains on YouTube.`}
        confirmLabel="Remove"
        onConfirm={() => void manager.confirmDelete()}
        onCancel={() => manager.requestDelete(null)}
        busy={manager.deletingBusy}
      />
    </div>
  )
}
