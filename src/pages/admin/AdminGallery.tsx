import { Camera } from 'lucide-react'
import { AddButton, ConfirmDialog, DataTable, PageTitle } from '@/components/admin/AdminTable'
import { Drawer } from '@/components/admin/Drawer'
import { FormActions, FormField, ImageUploader, SelectInput, TextArea, TextInput, Toggle } from '@/components/admin/form'
import { EmptyState, Tag } from '@/components/ui'
import { useCollectionManager } from '@/hooks/useCollectionManager'
import { getRepository, type Draft } from '@/services'
import { gallerySchema } from '@/lib/validation'
import { GALLERY_CATEGORIES, type GalleryCategory, type GalleryImage } from '@/types'
import { formatDate } from '@/lib/utils'

interface GalleryForm {
  title: string
  description: string
  image_url: string
  alt_text: string
  category: GalleryCategory
  featured: boolean
  display_order: number
}

const EMPTY: GalleryForm = {
  title: '',
  description: '',
  image_url: '',
  alt_text: '',
  category: 'Automotive Diagnostics',
  featured: false,
  display_order: 0,
}

export default function AdminGallery() {
  const repository = getRepository()

  const manager = useCollectionManager<GalleryImage, GalleryForm, Draft<GalleryImage>>({
    label: 'Gallery image',
    schema: gallerySchema,
    emptyValues: EMPTY,
    load: () => repository.gallery.list(),
    create: (input) => repository.gallery.create(input),
    update: (id, input) => repository.gallery.update(id, input),
    remove: (id) => repository.gallery.remove(id),
    toForm: (image) => ({
      title: image.title,
      description: image.description,
      image_url: image.image_url,
      alt_text: image.alt_text,
      category: image.category,
      featured: image.featured,
      display_order: image.display_order,
    }),
    toPayload: (parsed) => parsed as GalleryForm,
  })

  const values = manager.values

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Workshop gallery"
        description="Upload genuine workshop photographs. Images are compressed in the browser before upload, and alt text is required for accessibility and image search."
        count={manager.rows.length}
        action={<AddButton onClick={manager.openCreate} label="Upload image" />}
      />

      <DataTable
        caption="Workshop gallery images"
        rows={manager.rows}
        loading={manager.loading}
        error={manager.error}
        onRetry={manager.reload}
        onEdit={manager.openEdit}
        onDelete={manager.requestDelete}
        onPreview={() => window.open('/gallery', '_blank', 'noopener')}
        columns={[
          {
            header: 'Image',
            cell: (row) => (
              <div className="flex min-w-0 items-center gap-2.5">
                <img src={row.image_url} alt="" className="h-10 w-14 shrink-0 rounded object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{row.title}</p>
                  <p className="truncate text-[0.6875rem] text-silver-500">{row.alt_text}</p>
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
            header: 'Order',
            cell: (row) => (
              <span className="font-mono text-[0.625rem] text-silver-400">{row.display_order}</span>
            ),
            hideOnMobile: true,
          },
          {
            header: 'Flags',
            cell: (row) => (row.featured ? <Tag tone="signal">Featured</Tag> : <span className="text-silver-600">—</span>),
          },
        ]}
        empty={
          <EmptyState
            title="Upload Your Workshop Photograph"
            body="Photographs of diagnostics, electrical repairs, ECU work, tools and certificates will appear in the public gallery."
            icon={Camera}
            adminHint
            action={<AddButton onClick={manager.openCreate} label="Upload image" />}
          />
        }
      />

      <Drawer
        open={manager.editorOpen}
        title={manager.editing ? 'Edit gallery image' : 'Upload gallery image'}
        onClose={manager.closeEditor}
        footer={
          <FormActions
            saving={manager.saving}
            onSubmit={() => void manager.save()}
            onCancel={manager.closeEditor}
            submitLabel={manager.editing ? 'Save changes' : 'Add image'}
          />
        }
      >
        <div className="space-y-4">
          {manager.errors.form ? (
            <p className="rounded border border-danger-400/40 bg-danger-400/[0.08] p-2.5 text-xs text-danger-400">
              {manager.errors.form}
            </p>
          ) : null}

          <ImageUploader
            label="Photograph"
            bucket="gallery"
            folder="workshop"
            value={values.image_url || null}
            onChange={(url) => manager.setValue('image_url', url ?? '')}
            error={manager.errors.image_url}
            aspect="aspect-[4/3]"
            hint="Compressed to a maximum of 1800px and converted to WebP where supported."
          />

          <FormField label="Title" htmlFor="g-title" required error={manager.errors.title}>
            <TextInput id="g-title" value={values.title} onChange={(v) => manager.setValue('title', v)} />
          </FormField>

          <FormField
            label="Alt text"
            htmlFor="g-alt"
            required
            error={manager.errors.alt_text}
            hint="Describe what the photograph actually shows, e.g. “Scan tool connected to a vehicle reading live engine data”."
          >
            <TextInput id="g-alt" value={values.alt_text} onChange={(v) => manager.setValue('alt_text', v)} />
          </FormField>

          <FormField label="Description" htmlFor="g-desc">
            <TextArea id="g-desc" value={values.description} onChange={(v) => manager.setValue('description', v)} rows={2} />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Category" htmlFor="g-cat">
              <SelectInput
                id="g-cat"
                value={values.category}
                onChange={(v) => manager.setValue('category', v)}
                options={GALLERY_CATEGORIES}
              />
            </FormField>
            <FormField label="Display order" htmlFor="g-order" hint="Lower numbers appear first.">
              <TextInput
                id="g-order"
                type="number"
                value={String(values.display_order)}
                onChange={(v) => manager.setValue('display_order', Number(v) || 0)}
              />
            </FormField>
          </div>

          <Toggle
            checked={values.featured}
            onChange={(v) => manager.setValue('featured', v)}
            label="Featured image"
            description="Featured images are prioritised on the homepage gallery preview."
          />

          {manager.editing ? (
            <p className="border-t border-line pt-3 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-600">
              Added {formatDate(manager.editing.created_at)}
            </p>
          ) : null}
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(manager.deleting)}
        title="Delete this image?"
        body="The record will be removed from the gallery. The stored file in Supabase Storage can be deleted separately if required."
        onConfirm={() => void manager.confirmDelete()}
        onCancel={() => manager.requestDelete(null)}
        busy={manager.deletingBusy}
      />
    </div>
  )
}
