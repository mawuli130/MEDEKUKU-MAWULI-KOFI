import { useState } from 'react'
import { Activity, Plus, Trash2 } from 'lucide-react'
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
import { Callout, EmptyState, Tag } from '@/components/ui'
import { useCollectionManager } from '@/hooks/useCollectionManager'
import { getRepository, type Draft } from '@/services'
import { diagnosticCaseSchema } from '@/lib/validation'
import type {
  DiagnosticCase,
  DiagnosticMedia,
  DiagnosticStep,
  DtcEntry,
  Measurement,
  VerificationCheck,
} from '@/types'
import { formatDate, slugify, vehicleLabel } from '@/lib/utils'

interface CaseForm {
  title: string
  slug: string
  project_id: string
  vehicle_make: string
  vehicle_model: string
  vehicle_year: string
  engine: string
  transmission: string
  vehicle_system: string
  vehicle_identification: string | null
  customer_complaint: string
  dtc_codes: DtcEntry[]
  scan_tool: string
  freeze_frame: string
  live_data: string
  diagnostic_procedure: DiagnosticStep[]
  measurements: Measurement[]
  confirmed_fault: string
  repair_procedure: string
  verification: VerificationCheck[]
  media: DiagnosticMedia[]
  youtube_url: string | null
  featured: boolean
  status: 'draft' | 'published'
  seo_title: string | null
  seo_description: string | null
}

const EMPTY: CaseForm = {
  title: '',
  slug: '',
  project_id: '',
  vehicle_make: '',
  vehicle_model: '',
  vehicle_year: '',
  engine: '',
  transmission: '',
  vehicle_system: '',
  vehicle_identification: null,
  customer_complaint: '',
  dtc_codes: [],
  scan_tool: '',
  freeze_frame: '',
  live_data: '',
  diagnostic_procedure: [],
  measurements: [],
  confirmed_fault: '',
  repair_procedure: '',
  verification: [],
  media: [],
  youtube_url: null,
  featured: false,
  status: 'draft',
  seo_title: null,
  seo_description: null,
}

export default function AdminDiagnostics() {
  const repository = getRepository()
  const [mediaDraft, setMediaDraft] = useState<DiagnosticMedia>({ url: '', caption: '', kind: 'scan' })

  const manager = useCollectionManager<DiagnosticCase, CaseForm, Draft<DiagnosticCase>>({
    label: 'Diagnostic case study',
    schema: diagnosticCaseSchema,
    emptyValues: EMPTY,
    load: () => repository.diagnosticCases.list({ includeDrafts: true }),
    create: (input) => repository.diagnosticCases.create(input),
    update: (id, input) => repository.diagnosticCases.update(id, input),
    remove: (id) => repository.diagnosticCases.remove(id),
    toForm: (record) => ({
      title: record.title,
      slug: record.slug,
      project_id: record.project_id ?? '',
      vehicle_make: record.vehicle_make,
      vehicle_model: record.vehicle_model,
      vehicle_year: record.vehicle_year ? String(record.vehicle_year) : '',
      engine: record.engine,
      transmission: record.transmission,
      vehicle_system: record.vehicle_system,
      vehicle_identification: record.vehicle_identification,
      customer_complaint: record.customer_complaint,
      dtc_codes: record.dtc_codes,
      scan_tool: record.scan_tool,
      freeze_frame: record.freeze_frame,
      live_data: record.live_data,
      diagnostic_procedure: record.diagnostic_procedure,
      measurements: record.measurements,
      confirmed_fault: record.confirmed_fault,
      repair_procedure: record.repair_procedure,
      verification: record.verification,
      media: record.media,
      youtube_url: record.youtube_url,
      featured: record.featured,
      status: record.status,
      seo_title: record.seo_title,
      seo_description: record.seo_description,
    }),
    toPayload: (parsed) => {
      const values = parsed as CaseForm & { vehicle_year: number | null; slug?: string }
      return {
        title: values.title,
        slug: values.slug?.trim() ? slugify(values.slug) : slugify(values.title),
        project_id: values.project_id ? values.project_id : null,
        vehicle_make: values.vehicle_make,
        vehicle_model: values.vehicle_model,
        vehicle_year: values.vehicle_year,
        engine: values.engine,
        transmission: values.transmission,
        vehicle_system: values.vehicle_system,
        vehicle_identification: values.vehicle_identification || null,
        customer_complaint: values.customer_complaint,
        dtc_codes: values.dtc_codes,
        scan_tool: values.scan_tool,
        freeze_frame: values.freeze_frame,
        live_data: values.live_data,
        diagnostic_procedure: values.diagnostic_procedure,
        measurements: values.measurements,
        confirmed_fault: values.confirmed_fault,
        repair_procedure: values.repair_procedure,
        verification: values.verification,
        media: values.media,
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

  const updateList = <K extends keyof CaseForm>(key: K, index: number, patch: Record<string, string>) => {
    const list = values[key] as unknown as Array<Record<string, string>>
    const next = list.map((item, position) => (position === index ? { ...item, ...patch } : item))
    manager.setValue(key, next as never)
  }

  const removeFromList = <K extends keyof CaseForm>(key: K, index: number) => {
    const list = values[key] as unknown as unknown[]
    manager.setValue(key, list.filter((_, position) => position !== index) as never)
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Diagnostic case studies"
        description="Technical reports documenting a systematic diagnostic process. Record unknown findings honestly rather than filling gaps."
        count={manager.rows.length}
        action={<AddButton onClick={manager.openCreate} label="New case study" />}
      />

      <DataTable
        caption="Diagnostic case studies"
        rows={manager.rows}
        loading={manager.loading}
        error={manager.error}
        onRetry={manager.reload}
        onEdit={manager.openEdit}
        onDelete={manager.requestDelete}
        onPreview={(row) => window.open(`/diagnostics/${row.slug}`, '_blank', 'noopener')}
        columns={[
          {
            header: 'Case',
            cell: (row) => (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{row.title}</p>
                <p className="truncate text-[0.6875rem] text-silver-500">
                  {vehicleLabel(row) || 'Vehicle details pending'} · {row.dtc_codes.length} DTC
                </p>
              </div>
            ),
          },
          {
            header: 'System',
            cell: (row) => <span className="text-[0.6875rem] text-silver-400">{row.vehicle_system || '—'}</span>,
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
            title="Add Your First Diagnostic Case Study"
            body="Document the complaint, codes, test plan, confirmed fault and verification of a real vehicle fault you diagnosed."
            icon={Activity}
            adminHint
            action={<AddButton onClick={manager.openCreate} label="Create case study" />}
          />
        }
      />

      <Drawer
        open={manager.editorOpen}
        wide
        title={manager.editing ? 'Edit diagnostic case study' : 'New diagnostic case study'}
        description="Reports are rendered as a technical document with numbered sections."
        onClose={manager.closeEditor}
        footer={
          <FormActions
            saving={manager.saving}
            onSubmit={() => void manager.save()}
            onCancel={manager.closeEditor}
            submitLabel={manager.editing ? 'Save changes' : 'Create case study'}
          />
        }
      >
        <div className="space-y-4">
          {manager.errors.form ? (
            <p className="rounded border border-danger-400/40 bg-danger-400/[0.08] p-2.5 text-xs text-danger-400">
              {manager.errors.form}
            </p>
          ) : null}

          <FormField label="Case title" htmlFor="c-title" required error={manager.errors.title}>
            <TextInput
              id="c-title"
              value={values.title}
              onChange={(v) => manager.setValue('title', v)}
              placeholder="Intermittent no-start with P0335 — crankshaft signal loss"
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Vehicle system" htmlFor="c-system" required error={manager.errors.vehicle_system}>
              <TextInput
                id="c-system"
                value={values.vehicle_system}
                onChange={(v) => manager.setValue('vehicle_system', v)}
                placeholder="Engine management"
              />
            </FormField>
            <FormField label="URL slug" htmlFor="c-slug" hint="Generated from the title when blank.">
              <TextInput id="c-slug" value={values.slug} onChange={(v) => manager.setValue('slug', v)} />
            </FormField>
          </div>

          <fieldset className="rounded border border-line bg-ink-925/40 p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-[0.1em] text-silver-300">
              Vehicle details
            </legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <FormField label="Make" htmlFor="c-make">
                <TextInput id="c-make" value={values.vehicle_make} onChange={(v) => manager.setValue('vehicle_make', v)} />
              </FormField>
              <FormField label="Model" htmlFor="c-model">
                <TextInput id="c-model" value={values.vehicle_model} onChange={(v) => manager.setValue('vehicle_model', v)} />
              </FormField>
              <FormField label="Year" htmlFor="c-year">
                <TextInput id="c-year" type="number" value={values.vehicle_year} onChange={(v) => manager.setValue('vehicle_year', v)} />
              </FormField>
              <FormField label="Engine" htmlFor="c-engine">
                <TextInput id="c-engine" value={values.engine} onChange={(v) => manager.setValue('engine', v)} />
              </FormField>
              <FormField label="Transmission" htmlFor="c-trans">
                <TextInput id="c-trans" value={values.transmission} onChange={(v) => manager.setValue('transmission', v)} />
              </FormField>
              <FormField label="Linked project ID (optional)" htmlFor="c-project">
                <TextInput id="c-project" value={values.project_id} onChange={(v) => manager.setValue('project_id', v)} placeholder="UUID" />
              </FormField>
            </div>
            <div className="mt-3">
              <FormField
                label="Vehicle identification (private)"
                htmlFor="c-vin"
                hint="VIN or registration, stored for your records only. Never rendered on the public report."
              >
                <TextInput
                  id="c-vin"
                  value={values.vehicle_identification ?? ''}
                  onChange={(v) => manager.setValue('vehicle_identification', v || null)}
                />
              </FormField>
            </div>
          </fieldset>

          <FormField label="Customer complaint" htmlFor="c-complaint" required error={manager.errors.customer_complaint}>
            <TextArea
              id="c-complaint"
              value={values.customer_complaint}
              onChange={(v) => manager.setValue('customer_complaint', v)}
              rows={3}
              placeholder="As reported by the customer, in their words where possible."
            />
          </FormField>

          <RepeaterSection
            title="Diagnostic trouble codes"
            description="Only record codes actually read from the vehicle."
            addLabel="Add DTC"
            onAdd={() => manager.setValue('dtc_codes', [...values.dtc_codes, { code: '', description: '', module: '' }])}
            emptyMessage="No DTCs recorded. Leave empty if the vehicle had no stored codes."
          >
            {values.dtc_codes.map((dtc, index) => (
              <RepeaterRow key={index} onRemove={() => removeFromList('dtc_codes', index)}>
                <div className="grid gap-2 sm:grid-cols-3">
                  <TextInput
                    value={dtc.code}
                    onChange={(v) => updateList('dtc_codes', index, { code: v.toUpperCase() })}
                    placeholder="P0335"
                    aria-label="DTC code"
                  />
                  <TextInput
                    value={dtc.description}
                    onChange={(v) => updateList('dtc_codes', index, { description: v })}
                    placeholder="Description"
                    aria-label="DTC description"
                  />
                  <TextInput
                    value={dtc.module}
                    onChange={(v) => updateList('dtc_codes', index, { module: v })}
                    placeholder="Control module"
                    aria-label="Control module"
                  />
                </div>
              </RepeaterRow>
            ))}
          </RepeaterSection>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Scan tool used" htmlFor="c-tool">
              <TextInput id="c-tool" value={values.scan_tool} onChange={(v) => manager.setValue('scan_tool', v)} placeholder="Launch X431" />
            </FormField>
            <FormField label="Freeze-frame data" htmlFor="c-freeze">
              <TextArea id="c-freeze" value={values.freeze_frame} onChange={(v) => manager.setValue('freeze_frame', v)} rows={2} />
            </FormField>
          </div>

          <FormField label="Relevant live data" htmlFor="c-live">
            <TextArea
              id="c-live"
              value={values.live_data}
              onChange={(v) => manager.setValue('live_data', v)}
              rows={3}
              placeholder="Parameter, value and operating condition."
            />
          </FormField>

          <RepeaterSection
            title="Diagnostic procedure"
            description="Ordered steps performed — inspection, power/ground, continuity, voltage drop, signal tests, scope analysis."
            addLabel="Add step"
            onAdd={() =>
              manager.setValue('diagnostic_procedure', [...values.diagnostic_procedure, { step: '', finding: '' }])
            }
            emptyMessage="No procedure steps recorded yet."
          >
            {values.diagnostic_procedure.map((step, index) => (
              <RepeaterRow key={index} onRemove={() => removeFromList('diagnostic_procedure', index)}>
                <div className="grid gap-2">
                  <TextInput
                    value={step.step}
                    onChange={(v) => updateList('diagnostic_procedure', index, { step: v })}
                    placeholder={`Step ${index + 1}: test performed`}
                    aria-label="Diagnostic step"
                  />
                  <TextInput
                    value={step.finding}
                    onChange={(v) => updateList('diagnostic_procedure', index, { finding: v })}
                    placeholder="Finding from this step"
                    aria-label="Finding"
                  />
                </div>
              </RepeaterRow>
            ))}
          </RepeaterSection>

          <RepeaterSection
            title="Electrical measurements"
            addLabel="Add measurement"
            onAdd={() =>
              manager.setValue('measurements', [
                ...values.measurements,
                { label: '', value: '', unit: 'V', specification: '', result: 'pass' },
              ])
            }
            emptyMessage="No measurements recorded."
          >
            {values.measurements.map((measurement, index) => (
              <RepeaterRow key={index} onRemove={() => removeFromList('measurements', index)}>
                <div className="grid gap-2 sm:grid-cols-2">
                  <TextInput
                    value={measurement.label}
                    onChange={(v) => updateList('measurements', index, { label: v })}
                    placeholder="Test point"
                    aria-label="Test point"
                  />
                  <div className="flex gap-2">
                    <TextInput
                      value={measurement.value}
                      onChange={(v) => updateList('measurements', index, { value: v })}
                      placeholder="Measured"
                      aria-label="Measured value"
                    />
                    <TextInput
                      value={measurement.unit}
                      onChange={(v) => updateList('measurements', index, { unit: v })}
                      placeholder="Unit"
                      aria-label="Unit"
                    />
                  </div>
                  <TextInput
                    value={measurement.specification}
                    onChange={(v) => updateList('measurements', index, { specification: v })}
                    placeholder="Specification"
                    aria-label="Specification"
                  />
                  <SelectInput
                    value={measurement.result}
                    onChange={(v) => updateList('measurements', index, { result: v })}
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

          <FormField
            label="Confirmed fault"
            htmlFor="c-fault"
            hint="Leave blank if the root cause was not confirmed — the report will state that honestly."
          >
            <TextArea id="c-fault" value={values.confirmed_fault} onChange={(v) => manager.setValue('confirmed_fault', v)} rows={3} />
          </FormField>

          <FormField label="Repair procedure" htmlFor="c-repair">
            <TextArea id="c-repair" value={values.repair_procedure} onChange={(v) => manager.setValue('repair_procedure', v)} rows={3} />
          </FormField>

          <RepeaterSection
            title="Verification"
            description="Post-repair checks: rescan, live data, road test, system operation."
            addLabel="Add verification check"
            onAdd={() => manager.setValue('verification', [...values.verification, { check: '', result: '', status: 'pass' }])}
            emptyMessage="No verification checks recorded."
          >
            {values.verification.map((check, index) => (
              <RepeaterRow key={index} onRemove={() => removeFromList('verification', index)}>
                <div className="grid gap-2 sm:grid-cols-3">
                  <TextInput
                    value={check.check}
                    onChange={(v) => updateList('verification', index, { check: v })}
                    placeholder="Check performed"
                    aria-label="Verification check"
                  />
                  <TextInput
                    value={check.result}
                    onChange={(v) => updateList('verification', index, { result: v })}
                    placeholder="Result"
                    aria-label="Result"
                  />
                  <SelectInput
                    value={check.status}
                    onChange={(v) => updateList('verification', index, { status: v })}
                    options={[
                      { value: 'pass', label: 'Pass' },
                      { value: 'fail', label: 'Fail' },
                      { value: 'pending', label: 'Pending' },
                    ]}
                  />
                </div>
              </RepeaterRow>
            ))}
          </RepeaterSection>

          <fieldset className="rounded border border-line bg-ink-925/40 p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-[0.1em] text-silver-300">
              Diagnostic media
            </legend>
            <p className="mb-3 mt-1 text-[0.6875rem] text-silver-600">
              Upload scan tool screenshots, waveform captures, wiring diagrams or repair photographs, then attach them
              below.
            </p>
            <ImageUploader
              label="Upload media"
              bucket="projects"
              folder="diagnostics"
              value={mediaDraft.url || null}
              onChange={(url) => setMediaDraft((current) => ({ ...current, url: url ?? '' }))}
              hint="Image is compressed before upload."
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <TextInput
                value={mediaDraft.caption}
                onChange={(v) => setMediaDraft((current) => ({ ...current, caption: v }))}
                placeholder="Caption"
                aria-label="Media caption"
              />
              <SelectInput
                value={mediaDraft.kind}
                onChange={(v) => setMediaDraft((current) => ({ ...current, kind: v as DiagnosticMedia['kind'] }))}
                options={[
                  { value: 'scan', label: 'Scan tool data' },
                  { value: 'waveform', label: 'Oscilloscope waveform' },
                  { value: 'wiring', label: 'Wiring diagram' },
                  { value: 'photo', label: 'Diagnostic photograph' },
                  { value: 'video', label: 'Video reference' },
                ]}
              />
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm mt-2"
              onClick={() => {
                if (!mediaDraft.url) return
                manager.setValue('media', [...values.media, mediaDraft])
                setMediaDraft({ url: '', caption: '', kind: 'scan' })
              }}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Attach media to report
            </button>

            {values.media.length ? (
              <ul className="mt-3 space-y-1.5">
                {values.media.map((item, index) => (
                  <li key={index} className="flex items-center gap-2 rounded border border-line bg-ink-950/60 p-2">
                    <img src={item.url} alt="" className="h-9 w-12 rounded object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.6875rem] text-silver-200">{item.caption || 'No caption'}</p>
                      <p className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-600">{item.kind}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromList('media', index)}
                      className="text-silver-500 hover:text-danger-400"
                      aria-label="Remove media"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </fieldset>

          <FormField label="YouTube demonstration URL" htmlFor="c-video">
            <TextInput
              id="c-video"
              value={values.youtube_url ?? ''}
              onChange={(v) => manager.setValue('youtube_url', v || null)}
              placeholder="https://youtu.be/…"
            />
          </FormField>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Publication status" htmlFor="c-status">
              <SelectInput
                id="c-status"
                value={values.status}
                onChange={(v) => manager.setValue('status', v)}
                options={[
                  { value: 'draft', label: 'Draft — not visible to visitors' },
                  { value: 'published', label: 'Published — visible to visitors' },
                ]}
              />
            </FormField>
            <div className="flex items-end">
              <Toggle
                checked={values.featured}
                onChange={(v) => manager.setValue('featured', v)}
                label="Feature on homepage"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="SEO title (optional)" htmlFor="c-seo-title">
              <TextInput
                id="c-seo-title"
                value={values.seo_title ?? ''}
                onChange={(v) => manager.setValue('seo_title', v || null)}
              />
            </FormField>
            <FormField label="SEO description (optional)" htmlFor="c-seo-desc">
              <TextArea
                id="c-seo-desc"
                value={values.seo_description ?? ''}
                onChange={(v) => manager.setValue('seo_description', v || null)}
                rows={2}
              />
            </FormField>
          </div>

          <Callout title="Privacy reminder" tone="warn">
            Vehicle identification numbers, plates and customer names must not be entered into any field that is shown
            on the public report. Use the private identification field only.
          </Callout>
        </div>
      </Drawer>

      <ConfirmDialog
        open={Boolean(manager.deleting)}
        title="Delete this case study?"
        body={`"${manager.deleting?.title ?? ''}" and its published report will be permanently deleted.`}
        onConfirm={() => void manager.confirmDelete()}
        onCancel={() => manager.requestDelete(null)}
        busy={manager.deletingBusy}
      />
    </div>
  )
}
