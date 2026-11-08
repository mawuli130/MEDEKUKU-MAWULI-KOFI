import { Award } from 'lucide-react'
import { AddButton, ConfirmDialog, DataTable, PageTitle } from '@/components/admin/AdminTable'
import { Drawer } from '@/components/admin/Drawer'
import { FormActions, FormField, ImageUploader, TextArea, TextInput, Toggle } from '@/components/admin/form'
import { EmptyState, Tag } from '@/components/ui'
import { useCollectionManager } from '@/hooks/useCollectionManager'
import { getRepository, type Draft } from '@/services'
import { certificateSchema } from '@/lib/validation'
import type { Certificate } from '@/types'
import { formatDate, slugify } from '@/lib/utils'

interface CertificateForm {
  title: string
  slug: string
  institution: string
  issue_date: string
  description: string
  certificate_url: string | null
  verification_url: string | null
  featured: boolean
  display_order: number
}

const EMPTY: CertificateForm = {
  title: '',
  slug: '',
  institution: '',
  issue_date: '',
  description: '',
  certificate_url: null,
  verification_url: null,
  featured: false,
  display_order: 0,
}

export default function AdminCertificates() {
  const repository = getRepository()

  const manager = useCollectionManager<Certificate, CertificateForm, Draft<Certificate>>({
    label: 'Certificate',
    schema: certificateSchema,
    emptyValues: EMPTY,
    load: () => repository.certificates.list(),
    create: (input) => repository.certificates.create(input),
    update: (id, input) => repository.certificates.update(id, input),
    remove: (id) => repository.certificates.remove(id),
    toForm: (certificate) => ({
      title: certificate.title,
      slug: certificate.slug,
      institution: certificate.institution,
      issue_date: certificate.issue_date ?? '',
      description: certificate.description,
      certificate_url: certificate.certificate_url,
      verification_url: certificate.verification_url,
      featured: certificate.featured,
      display_order: certificate.display_order,
    }),
    toPayload: (parsed) => {
      const values = parsed as CertificateForm
      return {
        title: values.title,
        slug: values.slug?.trim() ? slugify(values.slug) : slugify(values.title),
        institution: values.institution,
        issue_date: values.issue_date || null,
        description: values.description,
        certificate_url: values.certificate_url,
        verification_url: values.verification_url,
        featured: values.featured,
        display_order: values.display_order,
      }
    },
  })

  const values = manager.values

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Certificates & achievements"
        description="Only upload certificates and achievements you can evidence. Each record receives its own public detail page."
        count={manager.rows.length}
        action={<AddButton onClick={manager.openCreate} label="Add certificate" />}
      />

      <DataTable
        caption="Certificates and achievements"
        rows={manager.rows}
        loading={manager.loading}
        error={manager.error}
        onRetry={manager.reload}
        onEdit={manager.openEdit}
        onDelete={manager.requestDelete}
        onPreview={(row) => window.open(`/certificates/${row.slug}`, '_blank', 'noopener')}
        columns={[
          {
            header: 'Certificate',
            cell: (row) => (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{row.title}</p>
                <p className="truncate text-[0.6875rem] text-silver-500">{row.institution}</p>
              </div>
            ),
          },
          {
            header: 'Issued',
            cell: (row) => (
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-500">
                {row.issue_date ? formatDate(row.issue_date) : 'Not recorded'}
              </span>
            ),
            hideOnMobile: true,
          },
          {
            header: 'Files',
            cell: (row) => (
              <div className="flex flex-wrap gap-1">
                {row.certificate_url ? <Tag tone="signal">Image/PDF</Tag> : <Tag>No file</Tag>}
                {row.verification_url ? <Tag>Verifiable</Tag> : null}
              </div>
            ),
          },
        ]}
        empty={
          <EmptyState
            title="Upload Your Certificate"
            body="Technical education, automotive training, workshop training and project achievements can be recorded here."
            icon={Award}
            adminHint
            action={<AddButton onClick={manager.openCreate} label="Add certificate" />}
          />
        }
      />

      <Drawer
        open={manager.editorOpen}
        title={manager.editing ? 'Edit certificate' : 'Add certificate'}
        onClose={manager.closeEditor}
        footer={
          <FormActions
            saving={manager.saving}
            onSubmit={() => void manager.save()}
            onCancel={manager.closeEditor}
            submitLabel={manager.editing ? 'Save changes' : 'Add certificate'}
          />
        }
      >
        <div className="space-y-4">
          {manager.errors.form ? (
            <p className="rounded border border-danger-400/40 bg-danger-400/[0.08] p-2.5 text-xs text-danger-400">
              {manager.errors.form}
            </p>
          ) : null}

          <FormField label="Certificate title" htmlFor="ce-title" required error={manager.errors.title}>
            <TextInput id="ce-title" value={values.title} onChange={(v) => manager.setValue('title', v)} />
          </FormField>

          <FormField label="Institution" htmlFor="ce-inst" required error={manager.errors.institution}>
            <TextInput id="ce-inst" value={values.institution} onChange={(v) => manager.setValue('institution', v)} />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Issue date" htmlFor="ce-date">
              <TextInput
                id="ce-date"
                type="date"
                value={values.issue_date}
                onChange={(v) => manager.setValue('issue_date', v)}
              />
            </FormField>
            <FormField label="Display order" htmlFor="ce-order">
              <TextInput
                id="ce-order"
                type="number"
                value={String(values.display_order)}
                onChange={(v) => manager.setValue('display_order', Number(v) || 0)}
              />
            </FormField>
          </div>

          <FormField label="Description" htmlFor="ce-desc">
            <TextArea id="ce-desc" value={values.description} onChange={(v) => manager.setValue('description', v)} rows={3} />
          </FormField>

          <ImageUploader
            label="Certificate image"
            bucket="certificates"
            folder="images"
            value={values.certificate_url}
            onChange={(url) => manager.setValue('certificate_url', url)}
            hint="Upload a clear scan or photograph of the certificate."
            aspect="aspect-[4/3]"
          />

          <FormField
            label="External verification URL"
            htmlFor="ce-verify"
            hint="Optional issuer verification link. Leave blank if the certificate cannot be verified online."
          >
            <TextInput
              id="ce-verify"
              value={values.verification_url ?? ''}
              onChange={(v) => manager.setValue('verification_url', v || null)}
              placeholder="https://…"
            />
          </FormField>

          <Toggle
            checked={values.featured}
            onChange={(v) => manager.setValue('featured', v)}
            label="Feature this certificate"
          />
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(manager.deleting)}
        title="Delete this certificate?"
        body={`"${manager.deleting?.title ?? ''}" and its public detail page will be removed.`}
        onConfirm={() => void manager.confirmDelete()}
        onCancel={() => manager.requestDelete(null)}
        busy={manager.deletingBusy}
      />
    </div>
  )
}
