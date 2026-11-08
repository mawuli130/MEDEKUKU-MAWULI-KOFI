import { Sparkles } from 'lucide-react'
import { AddButton, ConfirmDialog, DataTable, PageTitle } from '@/components/admin/AdminTable'
import { Drawer } from '@/components/admin/Drawer'
import { FormActions, FormField, SelectInput, TextArea, TextInput } from '@/components/admin/form'
import { EmptyState, Tag } from '@/components/ui'
import { useCollectionManager } from '@/hooks/useCollectionManager'
import { getRepository, type Draft } from '@/services'
import { skillSchema } from '@/lib/validation'
import { SKILL_CATEGORIES, type Skill, type SkillCategory, type SkillLevel } from '@/types'
import { SKILL_LEVEL_COPY } from '@/lib/defaults'

interface SkillForm {
  name: string
  category: SkillCategory
  description: string
  skill_level: SkillLevel
  display_order: number
}

const EMPTY: SkillForm = {
  name: '',
  category: 'Automotive Electrical Systems',
  description: '',
  skill_level: 'practical',
  display_order: 0,
}

export default function AdminSkills() {
  const repository = getRepository()

  const manager = useCollectionManager<Skill, SkillForm, Draft<Skill>>({
    label: 'Skill',
    schema: skillSchema,
    emptyValues: EMPTY,
    load: () => repository.skills.list(),
    create: (input) => repository.skills.create(input),
    update: (id, input) => repository.skills.update(id, input),
    remove: (id) => repository.skills.remove(id),
    toForm: (skill) => ({
      name: skill.name,
      category: skill.category,
      description: skill.description,
      skill_level: skill.skill_level,
      display_order: skill.display_order,
    }),
    toPayload: (parsed) => parsed as SkillForm,
  })

  const values = manager.values

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Automotive skills"
        description="Skills are published with an honest level: practical, developing, or technical interest. There are no percentage ratings by design."
        count={manager.rows.length}
        action={<AddButton onClick={manager.openCreate} label="Add skill" />}
      />

      <DataTable
        caption="Automotive skills"
        rows={manager.rows}
        loading={manager.loading}
        error={manager.error}
        onRetry={manager.reload}
        onEdit={manager.openEdit}
        onDelete={manager.requestDelete}
        columns={[
          {
            header: 'Skill',
            cell: (row) => (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{row.name}</p>
                <p className="truncate text-[0.6875rem] text-silver-500">{row.description || '—'}</p>
              </div>
            ),
          },
          {
            header: 'Category',
            cell: (row) => <span className="text-[0.6875rem] text-silver-400">{row.category}</span>,
            hideOnMobile: true,
          },
          {
            header: 'Level',
            cell: (row) => (
              <Tag tone={row.skill_level === 'practical' ? 'signal' : 'neutral'}>
                {SKILL_LEVEL_COPY[row.skill_level].label}
              </Tag>
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
            title="No skills configured"
            body="Add the automotive skills you have actually developed, grouped by system."
            icon={Sparkles}
            adminHint
            action={<AddButton onClick={manager.openCreate} label="Add skill" />}
          />
        }
      />

      <Drawer
        open={manager.editorOpen}
        title={manager.editing ? 'Edit skill' : 'Add skill'}
        onClose={manager.closeEditor}
        footer={
          <FormActions
            saving={manager.saving}
            onSubmit={() => void manager.save()}
            onCancel={manager.closeEditor}
            submitLabel={manager.editing ? 'Save changes' : 'Add skill'}
          />
        }
      >
        <div className="space-y-4">
          {manager.errors.form ? (
            <p className="rounded border border-danger-400/40 bg-danger-400/[0.08] p-2.5 text-xs text-danger-400">
              {manager.errors.form}
            </p>
          ) : null}

          <FormField label="Skill name" htmlFor="s-name" required error={manager.errors.name}>
            <TextInput id="s-name" value={values.name} onChange={(v) => manager.setValue('name', v)} />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Category" htmlFor="s-cat">
              <SelectInput
                id="s-cat"
                value={values.category}
                onChange={(v) => manager.setValue('category', v)}
                options={SKILL_CATEGORIES}
              />
            </FormField>
            <FormField label="Level" htmlFor="s-level">
              <SelectInput
                id="s-level"
                value={values.skill_level}
                onChange={(v) => manager.setValue('skill_level', v)}
                options={[
                  { value: 'practical', label: 'Practical — used in workshop' },
                  { value: 'developing', label: 'Developing — building competency' },
                  { value: 'interest', label: 'Technical interest — under study' },
                ]}
              />
            </FormField>
          </div>

          <FormField label="Description" htmlFor="s-desc" hint="One sentence describing what this skill involves in practice.">
            <TextArea id="s-desc" value={values.description} onChange={(v) => manager.setValue('description', v)} rows={3} />
          </FormField>

          <FormField label="Display order" htmlFor="s-order" hint="Lower numbers appear first within the category.">
            <TextInput
              id="s-order"
              type="number"
              value={String(values.display_order)}
              onChange={(v) => manager.setValue('display_order', Number(v) || 0)}
            />
          </FormField>
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(manager.deleting)}
        title="Delete this skill?"
        body={`"${manager.deleting?.name ?? ''}" will be removed from the public skills page.`}
        onConfirm={() => void manager.confirmDelete()}
        onCancel={() => manager.requestDelete(null)}
        busy={manager.deletingBusy}
      />
    </div>
  )
}
