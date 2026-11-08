import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, ExternalLink, Plus, Trash2 } from 'lucide-react'
import { AddButton, ConfirmDialog, DataTable, PageTitle, StatusPill } from '@/components/admin/AdminTable'
import { Drawer } from '@/components/admin/Drawer'
import {
  FormActions,
  FormField,
  ImageUploader,
  RepeaterRow,
  RepeaterSection,
  SelectInput,
  TextArea,
  TextInput,
  Toggle,
} from '@/components/admin/form'
import { EmptyState, Tag } from '@/components/ui'
import { useCollectionManager } from '@/hooks/useCollectionManager'
import { getRepository, type Draft } from '@/services'
import { projectSchema, projectStatusOptions } from '@/lib/validation'
import {
  PROJECT_CATEGORIES,
  type Measurement,
  type Project,
  type ProjectCategory,
} from '@/types'
import { formatDate, slugify, vehicleLabel } from '@/lib/utils'

interface ProjectForm {
  title: string
  slug: string
  category: ProjectCategory
  description: string
  vehicle_make: string
  vehicle_model: string
  vehicle_year: string
  engine: string
  transmission: string
  vehicle_system: string
  problem_statement: string
  diagnostic_procedure: string
  tools_used: string[]
  measurements: Measurement[]
  repair_procedure: string
  final_result: string
  cover_image: string | null
  gallery: string[]
  youtube_url: string | null
  featured: boolean
  status: 'draft' | 'published'
  seo_title: string | null
  seo_description: string | null
}

const EMPTY: ProjectForm = {
  title: '',
  slug: '',
  category: 'Automotive Electrical Diagnostics',
  description: '',
  vehicle_make: '',
  vehicle_model: '',
  vehicle_year: '',
  engine: '',
  transmission: '',
  vehicle_system: '',
  problem_statement: '',
  diagnostic_procedure: '',
  tools_used: [],
  measurements: [],
  repair_procedure: '',
  final_result: '',
  cover_image: null,
  gallery: [],
  youtube_url: null,
  featured: false,
  status: 'draft',
  seo_title: null,
  seo_description: null,
}

export default function AdminProjects() {
  const repository = getRepository()
  const [toolsDraft, setToolsDraft] = useState('')

  const manager = useCollectionManager<Project, ProjectForm, Draft<Project>>({
    label: 'Project',
    schema: projectSchema,
    emptyValues: EMPTY,
    load: () => repository.projects.list({ includeDrafts: true }),
    create: (input) => repository.projects.create(input),
    update: (id, input) => repository.projects.update(id, input),
    remove: (id) => repository.projects.remove(id),
    toForm: (project) => ({
      title: project.title,
      slug: project.slug,
      category: project.category,
      description: project.description,
      vehicle_make: project.vehicle_make,
      vehicle_model: project.vehicle_model,
      vehicle_year: project.vehicle_year ? String(project.vehicle_year) : '',
      engine: project.engine,
      transmission: project.transmission,
      vehicle_system: project.vehicle_system,
      problem_statement: project.problem_statement,
      diagnostic_procedure: project.diagnostic_procedure,
      tools_used: project.tools_used,
      measurements: project.measurements,
      repair_procedure: project.repair_procedure,
      final_result: project.final_result,
      cover_image: project.cover_image,
      gallery: project.gallery,
      youtube_url: project.youtube_url,
      featured: project.featured,
      status: project.status,
      seo_title: project.seo_title,
      seo_description: project.seo_description,
    }),
    toPayload: (parsed) => {
      const values = parsed as ProjectForm & { vehicle_year: number | null; slug?: string }
      return {
        title: values.title,
        slug: values.slug?.trim() ? slugify(values.slug) : slugify(values.title),
        category: values.category,
        description: values.description,
        vehicle_make: values.vehicle_make,
        vehicle_model: values.vehicle_model,
        vehicle_year: values.vehicle_year,
        engine: values.engine,
        transmission: values.transmission,
        vehicle_system: values.vehicle_system,
        problem_statement: values.problem_statement,
        diagnostic_procedure: values.diagnostic_procedure,
        tools_used: values.tools_used,
        measurements: values.measurements,
        repair_procedure: values.repair_procedure,
        final_result: values.final_result,
        cover_image: values.cover_image,
        gallery: values.gallery,
        youtube_url: values.youtube_url,
        featured: values.featured,
        status: values.status,
        seo_title: values.seo_title,
        seo_description: values.seo_description,
        published_at: values.status === 'published' ? new Date().toISOString() : null,
      }
    },
  })

  const values = manager.values

  function updateMeasure(index: number, patch: Partial<Measurement>) {
    const next = values.measurements.map((measurement, position) =>
      position === index ? { ...measurement, ...patch } : measurement,
    )
    manager.setValue('measurements', next)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Automotive projects"
        description="Document vehicle work: the complaint, diagnostic procedure, measurements, repair and outcome. Drafts stay invisible to visitors."
        count={manager.rows.length}
        action={<AddButton onClick={manager.openCreate} label="New project" />}
      />

      <DataTable
        caption="Automotive projects"
        rows={manager.rows}
        loading={manager.loading}
        error={manager.error}
        onRetry={manager.reload}
        onEdit={manager.openEdit}
        onDelete={manager.requestDelete}
        onPreview={
          manager.rows.length
            ? (row) => {
                window.open(`/projects/${row.slug}`, '_blank', 'noopener')
              }
            : undefined
        }
        columns={[
          {
            header: 'Project',
            cell: (row) => (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{row.title}</p>
                <p className="truncate text-[0.6875rem] text-silver-500">
                  {vehicleLabel(row) || 'Vehicle details pending'}
                </p>
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
            header: 'Updated',
            cell: (row) => (
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-600">
                {formatDate(row.updated_at ?? row.created_at)}
              </span>
            ),
            hideOnMobile: true,
          },
        ]}
        empty={
          <EmptyState
            title="Add Your First Automotive Project"
            body="Document a vehicle you have worked on — electrical diagnostics, ECU work, sensor testing or mechanical repair."
            icon={Briefcase}
            adminHint
            action={<AddButton onClick={manager.openCreate} label="Create project" />}
          />
        }
      />

      <Drawer
        open={manager.editorOpen}
        wide
        title={manager.editing ? 'Edit automotive project' : 'New automotive project'}
        description="Published projects appear in the portfolio immediately and are included in the sitemap."
        onClose={manager.closeEditor}
        footer={
          <FormActions
            saving={manager.saving}
            onSubmit={() => void manager.save()}
            onCancel={manager.closeEditor}
            submitLabel={manager.editing ? 'Save changes' : 'Create project'}
          />
        }
      >
        <div className="space-y-4">
          {manager.errors.form ? (
            <p className="rounded border border-danger-400/40 bg-danger-400/[0.08] p-2.5 text-xs text-danger-400">
              {manager.errors.form}
            </p>
          ) : null}

          <FormField label="Project title" htmlFor="p-title" required error={manager.errors.title}>
            <TextInput
              id="p-title"
              value={values.title}
              onChange={(value) => manager.setValue('title', value)}
              placeholder="ABS warning light — intermittent wheel speed signal loss"
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Category" htmlFor="p-cat" required error={manager.errors.category}>
              <SelectInput
                id="p-cat"
                value={values.category}
                onChange={(value) => manager.setValue('category', value)}
                options={PROJECT_CATEGORIES}
              />
            </FormField>
            <FormField
              label="URL slug"
              htmlFor="p-slug"
              hint="Leave blank to generate from the title. Example: abs-wheel-speed-signal"
            >
              <TextInput
                id="p-slug"
                value={values.slug}
                onChange={(value) => manager.setValue('slug', value)}
                placeholder={slugify(values.title) || 'project-slug'}
              />
            </FormField>
          </div>

          <FormField
            label="Project description"
            htmlFor="p-desc"
            required
            error={manager.errors.description}
            hint="Short summary shown on the project card and used as the meta description fallback."
          >
            <TextArea
              id="p-desc"
              value={values.description}
              onChange={(value) => manager.setValue('description', value)}
              rows={3}
            />
          </FormField>

          <fieldset className="rounded border border-line bg-ink-925/40 p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-[0.1em] text-silver-300">
              Vehicle specification
            </legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <FormField label="Vehicle make" htmlFor="p-make">
                <TextInput id="p-make" value={values.vehicle_make} onChange={(v) => manager.setValue('vehicle_make', v)} />
              </FormField>
              <FormField label="Vehicle model" htmlFor="p-model">
                <TextInput id="p-model" value={values.vehicle_model} onChange={(v) => manager.setValue('vehicle_model', v)} />
              </FormField>
              <FormField label="Vehicle year" htmlFor="p-year" error={manager.errors.vehicle_year}>
                <TextInput
                  id="p-year"
                  type="number"
                  value={values.vehicle_year}
                  onChange={(v) => manager.setValue('vehicle_year', v)}
                  placeholder="2014"
                />
              </FormField>
              <FormField label="Engine" htmlFor="p-engine">
                <TextInput id="p-engine" value={values.engine} onChange={(v) => manager.setValue('engine', v)} placeholder="1.8L petrol" />
              </FormField>
              <FormField label="Transmission" htmlFor="p-trans">
                <TextInput
                  id="p-trans"
                  value={values.transmission}
                  onChange={(v) => manager.setValue('transmission', v)}
                  placeholder="Automatic"
                />
              </FormField>
              <FormField label="Vehicle system" htmlFor="p-system">
                <TextInput
                  id="p-system"
                  value={values.vehicle_system}
                  onChange={(v) => manager.setValue('vehicle_system', v)}
                  placeholder="ABS / wheel speed sensors"
                />
              </FormField>
            </div>
          </fieldset>

          <FormField label="Customer complaint / observed problem" htmlFor="p-problem">
            <TextArea
              id="p-problem"
              value={values.problem_statement}
              onChange={(v) => manager.setValue('problem_statement', v)}
              rows={3}
            />
          </FormField>

          <FormField
            label="Diagnostic procedure"
            htmlFor="p-diag"
            hint="Step by step: what was tested and what each test showed."
          >
            <TextArea
              id="p-diag"
              value={values.diagnostic_procedure}
              onChange={(v) => manager.setValue('diagnostic_procedure', v)}
              rows={5}
            />
          </FormField>

          <FormField label="Tools used" hint="Press Enter or click Add after each tool.">
            <div className="flex gap-2">
              <TextInput
                value={toolsDraft}
                onChange={setToolsDraft}
                placeholder="Digital multimeter"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    const next = toolsDraft.trim()
                    if (next) {
                      manager.setValue('tools_used', [...values.tools_used, next])
                      setToolsDraft('')
                    }
                  }
                }}
              />
              <button
                type="button"
                className="btn btn-ghost btn-sm shrink-0"
                onClick={() => {
                  const next = toolsDraft.trim()
                  if (next) {
                    manager.setValue('tools_used', [...values.tools_used, next])
                    setToolsDraft('')
                  }
                }}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Add
              </button>
            </div>
            {values.tools_used.length ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {values.tools_used.map((tool, index) => (
                  <li key={`${tool}-${index}`} className="chip">
                    {tool}
                    <button
                      type="button"
                      onClick={() =>
                        manager.setValue(
                          'tools_used',
                          values.tools_used.filter((_, position) => position !== index),
                        )
                      }
                      className="ml-1 text-silver-500 hover:text-danger-400"
                      aria-label={`Remove ${tool}`}
                    >
                      <Trash2 className="h-2.5 w-2.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </FormField>

          <RepeaterSection
            title="Electrical measurements"
            description="Record test point, measured value, specification and whether the result was within specification."
            addLabel="Add measurement"
            onAdd={() =>
              manager.setValue('measurements', [
                ...values.measurements,
                { label: '', value: '', unit: 'V', specification: '', result: 'pass' },
              ])
            }
            emptyMessage="No measurements recorded yet."
          >
            {values.measurements.map((measurement, index) => (
              <RepeaterRow
                key={index}
                onRemove={() =>
                  manager.setValue(
                    'measurements',
                    values.measurements.filter((_, position) => position !== index),
                  )
                }
              >
                <div className="grid gap-2 sm:grid-cols-2">
                  <TextInput
                    value={measurement.label}
                    onChange={(v) => updateMeasure(index, { label: v })}
                    placeholder="Test point (e.g. sensor supply)"
                    aria-label="Test point"
                  />
                  <div className="flex gap-2">
                    <TextInput
                      value={measurement.value}
                      onChange={(v) => updateMeasure(index, { value: v })}
                      placeholder="Measured value"
                      aria-label="Measured value"
                    />
                    <TextInput
                      value={measurement.unit}
                      onChange={(v) => updateMeasure(index, { unit: v })}
                      placeholder="Unit"
                      aria-label="Unit"
                      className="field w-20"
                    />
                  </div>
                  <TextInput
                    value={measurement.specification}
                    onChange={(v) => updateMeasure(index, { specification: v })}
                    placeholder="Specification"
                    aria-label="Specification"
                  />
                  <SelectInput
                    value={measurement.result}
                    onChange={(v) => updateMeasure(index, { result: v as Measurement['result'] })}
                    options={[
                      { value: 'pass', label: 'Within specification' },
                      { value: 'fail', label: 'Out of specification' },
                      { value: 'inconclusive', label: 'Unverified' },
                    ]}
                  />
                </div>
              </RepeaterRow>
            ))}
          </RepeaterSection>

          <FormField label="Repair procedure" htmlFor="p-repair">
            <TextArea
              id="p-repair"
              value={values.repair_procedure}
              onChange={(v) => manager.setValue('repair_procedure', v)}
              rows={4}
            />
          </FormField>

          <FormField label="Final outcome" htmlFor="p-result" hint="Include post-repair checks and road test results.">
            <TextArea
              id="p-result"
              value={values.final_result}
              onChange={(v) => manager.setValue('final_result', v)}
              rows={3}
            />
          </FormField>

          <ImageUploader
            label="Cover photograph"
            bucket="projects"
            folder="covers"
            value={values.cover_image}
            onChange={(url) => manager.setValue('cover_image', url)}
            hint="Compressed automatically before upload. Use a genuine photograph of the vehicle or work."
          />

          <ImageUploader
            label="Gallery photograph"
            bucket="projects"
            folder="gallery"
            value={values.gallery[0] ?? null}
            onChange={(url) => manager.setValue('gallery', url ? [url] : [])}
            hint="Optional additional photograph shown on the project page."
          />

          <FormField label="YouTube video URL" htmlFor="p-video" hint="Supports youtube.com/watch, youtu.be and /shorts links.">
            <TextInput
              id="p-video"
              value={values.youtube_url ?? ''}
              onChange={(v) => manager.setValue('youtube_url', v || null)}
              placeholder="https://www.youtube.com/watch?v=…"
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Publication status" htmlFor="p-status">
              <SelectInput
                id="p-status"
                value={values.status}
                onChange={(v) => manager.setValue('status', v)}
                options={projectStatusOptions}
              />
            </FormField>
            <div className="flex items-end">
              <Toggle
                checked={values.featured}
                onChange={(v) => manager.setValue('featured', v)}
                label="Feature on homepage"
                description="Featured projects are prioritised in the homepage grid."
              />
            </div>
          </div>

          <fieldset className="rounded border border-line bg-ink-925/40 p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-[0.1em] text-silver-300">
              SEO overrides (optional)
            </legend>
            <div className="mt-2 space-y-3">
              <FormField label="SEO title" htmlFor="p-seo-title" error={manager.errors.seo_title}>
                <TextInput
                  id="p-seo-title"
                  value={values.seo_title ?? ''}
                  onChange={(v) => manager.setValue('seo_title', v || null)}
                  placeholder="Leave blank to generate automatically"
                />
              </FormField>
              <FormField label="SEO description" htmlFor="p-seo-desc" error={manager.errors.seo_description}>
                <TextArea
                  id="p-seo-desc"
                  value={values.seo_description ?? ''}
                  onChange={(v) => manager.setValue('seo_description', v || null)}
                  rows={2}
                />
              </FormField>
            </div>
          </fieldset>

          {manager.editing ? (
            <p className="flex items-center gap-1.5 border-t border-line pt-3 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-600">
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              <Link to={`/projects/${manager.editing.slug}`} target="_blank" className="hover:text-signal-300">
                /projects/{manager.editing.slug}
              </Link>
            </p>
          ) : null}
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(manager.deleting)}
        title="Delete this project?"
        body={`"${manager.deleting?.title ?? ''}" will be permanently removed, including its published detail page. This cannot be undone.`}
        onConfirm={() => void manager.confirmDelete()}
        onCancel={() => manager.requestDelete(null)}
        busy={manager.deletingBusy}
      />
    </div>
  )
}
