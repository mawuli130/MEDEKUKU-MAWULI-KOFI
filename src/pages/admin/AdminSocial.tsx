import { Share2 } from 'lucide-react'
import { AddButton, ConfirmDialog, DataTable, PageTitle } from '@/components/admin/AdminTable'
import { Drawer } from '@/components/admin/Drawer'
import { FormActions, FormField, SelectInput, TextInput } from '@/components/admin/form'
import { Callout, EmptyState } from '@/components/ui'
import { useCollectionManager } from '@/hooks/useCollectionManager'
import { useSiteData } from '@/hooks/useSiteData'
import { getRepository, type Draft } from '@/services'
import { socialLinkSchema } from '@/lib/validation'
import { SOCIAL_PLATFORMS, type SocialLink, type SocialPlatform } from '@/types'
import { PLATFORM_META, socialHref } from '@/components/layout/SocialLinks'

interface SocialForm {
  platform: SocialPlatform
  url: string
  handle: string | null
  display_order: number
}

const EMPTY: SocialForm = { platform: 'youtube', url: '', handle: null, display_order: 0 }

export default function AdminSocial() {
  const repository = getRepository()
  const { refresh } = useSiteData()

  const manager = useCollectionManager<SocialLink, SocialForm, Draft<SocialLink>>({
    label: 'Social link',
    schema: socialLinkSchema,
    emptyValues: EMPTY,
    load: () => repository.socialLinks.list(),
    create: (input) => repository.socialLinks.create(input),
    update: (id, input) => repository.socialLinks.update(id, input),
    remove: (id) => repository.socialLinks.remove(id),
    toForm: (link) => ({
      platform: link.platform,
      url: link.url,
      handle: link.handle,
      display_order: link.display_order,
    }),
    toPayload: (parsed) => parsed as SocialForm,
  })

  const values = manager.values

  async function afterSave(result: boolean) {
    if (result) refresh()
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageTitle
        title="Social links"
        description="Only links you add here are displayed — in the header, footer and contact page. GitHub is intentionally not supported."
        count={manager.rows.length}
        action={<AddButton onClick={manager.openCreate} label="Add link" />}
      />

      <DataTable
        caption="Social links"
        rows={manager.rows}
        loading={manager.loading}
        error={manager.error}
        onRetry={manager.reload}
        onEdit={manager.openEdit}
        onDelete={manager.requestDelete}
        columns={[
          {
            header: 'Platform',
            cell: (row) => (
              <span className="text-sm font-medium text-white">
                {PLATFORM_META[row.platform]?.label ?? row.platform}
              </span>
            ),
          },
          {
            header: 'URL',
            cell: (row) => (
              <a
                href={socialHref(row)}
                target="_blank"
                rel="noopener noreferrer"
                className="block max-w-[18rem] truncate font-mono text-[0.625rem] text-signal-300 hover:underline"
              >
                {row.url}
              </a>
            ),
          },
          {
            header: 'Order',
            cell: (row) => <span className="font-mono text-[0.625rem] text-silver-400">{row.display_order}</span>,
            hideOnMobile: true,
          },
        ]}
        empty={
          <EmptyState
            title="No social links configured"
            body="Add your YouTube channel, LinkedIn profile or WhatsApp number so recruiters can reach you."
            icon={Share2}
            action={<AddButton onClick={manager.openCreate} label="Add link" />}
          />
        }
      />

      <Drawer
        open={manager.editorOpen}
        title={manager.editing ? 'Edit social link' : 'Add social link'}
        onClose={manager.closeEditor}
        footer={
          <FormActions
            saving={manager.saving}
            onSubmit={() => void manager.save().then(afterSave)}
            onCancel={manager.closeEditor}
            submitLabel={manager.editing ? 'Save changes' : 'Add link'}
          />
        }
      >
        <div className="space-y-4">
          {manager.errors.form ? (
            <p className="rounded border border-danger-400/40 bg-danger-400/[0.08] p-2.5 text-xs text-danger-400">
              {manager.errors.form}
            </p>
          ) : null}

          <FormField label="Platform" htmlFor="so-platform">
            <SelectInput
              id="so-platform"
              value={values.platform}
              onChange={(v) => manager.setValue('platform', v)}
              options={SOCIAL_PLATFORMS.map((platform) => ({
                value: platform,
                label: PLATFORM_META[platform].label,
              }))}
            />
          </FormField>

          <FormField
            label="Profile URL or value"
            htmlFor="so-url"
            required
            error={manager.errors.url}
            hint={
              values.platform === 'email'
                ? 'Email address, e.g. name@example.com'
                : values.platform === 'phone'
                  ? 'Phone number, e.g. +233201234567'
                  : values.platform === 'whatsapp'
                    ? 'Full wa.me link or the number with country code'
                    : 'Full profile URL'
            }
          >
            <TextInput id="so-url" value={values.url} onChange={(v) => manager.setValue('url', v)} />
          </FormField>

          <FormField label="Handle (optional)" htmlFor="so-handle" hint="Shown in the contact page label.">
            <TextInput
              id="so-handle"
              value={values.handle ?? ''}
              onChange={(v) => manager.setValue('handle', v || null)}
              placeholder="@mawulidiagnostics"
            />
          </FormField>

          <FormField label="Display order" htmlFor="so-order" hint="Lower numbers appear first.">
            <TextInput
              id="so-order"
              type="number"
              value={String(values.display_order)}
              onChange={(v) => manager.setValue('display_order', Number(v) || 0)}
            />
          </FormField>

          <Callout title="Display rules">
            Platforms with no record are omitted entirely — no broken or placeholder icons are ever rendered. The
            YouTube and LinkedIn URLs you add are also included in the Person structured data.
          </Callout>
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(manager.deleting)}
        title="Remove this link?"
        body="The platform icon will no longer be displayed anywhere on the public website."
        confirmLabel="Remove"
        onConfirm={() => void manager.confirmDelete().then(() => refresh())}
        onCancel={() => manager.requestDelete(null)}
        busy={manager.deletingBusy}
      />
    </div>
  )
}
