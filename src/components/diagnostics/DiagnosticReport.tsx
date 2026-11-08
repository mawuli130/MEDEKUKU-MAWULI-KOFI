import type { ReactNode } from 'react'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  ClipboardList,
  FileSearch,
  Gauge,
  HelpCircle,
  Stethoscope,
  Wrench,
  XCircle,
} from 'lucide-react'
import { Tag } from '@/components/ui'
import { DiagnosticRule } from '@/components/brand/AutomotiveBackdrop'
import { formatDate, MEASUREMENT_RESULT_LABEL, vehicleLabel } from '@/lib/utils'
import type { DiagnosticCase } from '@/types'

function ReportSection({
  index,
  title,
  icon: Icon,
  children,
  note,
}: {
  index: string
  title: string
  icon: typeof Activity
  children: ReactNode
  note?: string
}) {
  return (
    <section className="border-t border-line pt-7 first:border-t-0 first:pt-0" aria-labelledby={`report-${index}`}>
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded border border-line bg-ink-850 text-signal-400">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-silver-600">Section {index}</p>
          <h2 id={`report-${index}`} className="font-display text-lg font-semibold text-white sm:text-xl">
            {title}
          </h2>
        </div>
      </div>
      <div className="space-y-4 pl-0 sm:pl-11">{children}</div>
      {note ? (
        <p className="mt-3 pl-0 font-mono text-[0.625rem] uppercase leading-relaxed tracking-[0.1em] text-silver-600 sm:pl-11">
          {note}
        </p>
      ) : null}
    </section>
  )
}

const RESULT_META = {
  pass: { icon: CheckCircle2, className: 'text-ok-400', label: 'PASS' },
  fail: { icon: XCircle, className: 'text-danger-400', label: 'FAIL' },
  pending: { icon: CircleDot, className: 'text-warn-400', label: 'PENDING' },
  inconclusive: { icon: HelpCircle, className: 'text-warn-400', label: 'UNVERIFIED' },
} as const

/**
 * Technical report presentation for a diagnostic case study.
 *
 * Sections render only when data exists, and every measurement carries an
 * explicit pass/fail/unverified status — nothing is implied.
 */
export function DiagnosticReport({ caseStudy }: { caseStudy: DiagnosticCase }) {
  const vehicle = vehicleLabel(caseStudy)
  const hasSpecs = Boolean(
    caseStudy.engine || caseStudy.transmission || caseStudy.vehicle_make || caseStudy.vehicle_model,
  )

  return (
    <div className="space-y-8">
      {/* Report header block */}
      <div className="panel overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-signal-300">
              Automotive Diagnostic Report
            </p>
            <h2 className="mt-1.5 font-display text-xl font-semibold text-white sm:text-2xl">{caseStudy.title}</h2>
            <p className="mt-1 text-sm text-silver-400">{vehicle || 'Vehicle details pending'}</p>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:justify-end">
            <Tag tone="signal">{caseStudy.vehicle_system || 'System not specified'}</Tag>
            {caseStudy.published_at ? <Tag>Issued {formatDate(caseStudy.published_at)}</Tag> : null}
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <DiagnosticRule className="mb-5" />
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
            <Spec label="Make" value={caseStudy.vehicle_make} />
            <Spec label="Model" value={caseStudy.vehicle_model} />
            <Spec label="Year" value={caseStudy.vehicle_year ? String(caseStudy.vehicle_year) : null} />
            <Spec label="Engine" value={caseStudy.engine} />
            <Spec label="Transmission" value={caseStudy.transmission} />
            <Spec label="Scan tool" value={caseStudy.scan_tool} />
            <Spec label="Vehicle system" value={caseStudy.vehicle_system} />
            <Spec label="Records" value={caseStudy.dtc_codes.length ? `${caseStudy.dtc_codes.length} DTC(s)` : null} />
          </dl>
          {!hasSpecs ? (
            <p className="mt-4 rounded border border-line bg-ink-950/70 px-3 py-2 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-600">
              Vehicle specification not recorded for this case
            </p>
          ) : null}
          <p className="mt-4 border-t border-line pt-3 font-mono text-[0.625rem] uppercase leading-relaxed tracking-[0.12em] text-silver-600">
            Vehicle identification data is withheld from public reports. Test results are recorded as performed;
            unverified findings are labelled.
          </p>
        </div>
      </div>

      <div className="panel space-y-7 p-5 sm:p-6">
        <ReportSection index="01" title="Customer complaint" icon={ClipboardList}>
          <p className="prose-tech text-sm sm:text-[0.9375rem]">{caseStudy.customer_complaint}</p>
        </ReportSection>

        <ReportSection
          index="02"
          title="Diagnostic trouble codes"
          icon={FileSearch}
          note={caseStudy.scan_tool ? `Read with ${caseStudy.scan_tool}` : undefined}
        >
          {caseStudy.dtc_codes.length ? (
            <div className="overflow-hidden rounded border border-line">
              <table className="w-full border-collapse text-left text-sm">
                <caption className="sr-only">Diagnostic trouble codes stored in the vehicle</caption>
                <thead>
                  <tr className="bg-ink-850 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-500">
                    <th scope="col" className="px-3 py-2 font-medium">Code</th>
                    <th scope="col" className="px-3 py-2 font-medium">Description</th>
                    <th scope="col" className="hidden px-3 py-2 font-medium sm:table-cell">Control module</th>
                  </tr>
                </thead>
                <tbody>
                  {caseStudy.dtc_codes.map((dtc, index) => (
                    <tr key={`${dtc.code}-${index}`} className="border-t border-line/70">
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs font-semibold text-signal-300">
                        {dtc.code}
                      </td>
                      <td className="px-3 py-2 text-silver-300">
                        {dtc.description || <span className="text-silver-600">Description not recorded</span>}
                      </td>
                      <td className="hidden px-3 py-2 text-silver-400 sm:table-cell">{dtc.module || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-silver-500">No diagnostic trouble codes were recorded for this case.</p>
          )}

          {caseStudy.freeze_frame ? (
            <div className="rounded border border-line bg-ink-950/60 p-3">
              <p className="mb-1.5 font-mono text-[0.625rem] uppercase tracking-[0.13em] text-silver-600">
                Freeze-frame data
              </p>
              <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-silver-300">
                {caseStudy.freeze_frame}
              </pre>
            </div>
          ) : null}

          {caseStudy.live_data ? (
            <div className="rounded border border-line bg-ink-950/60 p-3">
              <p className="mb-1.5 font-mono text-[0.625rem] uppercase tracking-[0.13em] text-silver-600">
                Relevant live data
              </p>
              <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-silver-300">
                {caseStudy.live_data}
              </pre>
            </div>
          ) : null}
        </ReportSection>

        <ReportSection index="03" title="Diagnostic procedure" icon={Stethoscope}>
          {caseStudy.diagnostic_procedure.length ? (
            <ol className="space-y-3">
              {caseStudy.diagnostic_procedure.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line bg-ink-850 font-mono text-[0.625rem] text-signal-300">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-silver-100">{step.step}</p>
                    {step.finding ? (
                      <p className="mt-0.5 text-[0.8125rem] leading-relaxed text-silver-400">
                        <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-600">
                          Finding ·{' '}
                        </span>
                        {step.finding}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-silver-500">Procedure details have not been published for this case.</p>
          )}
        </ReportSection>

        <ReportSection index="04" title="Electrical measurements" icon={Gauge}>
          {caseStudy.measurements.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                <caption className="sr-only">Measurements taken during diagnosis</caption>
                <thead>
                  <tr className="bg-ink-850 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-500">
                    <th scope="col" className="px-3 py-2 font-medium">Test point</th>
                    <th scope="col" className="px-3 py-2 font-medium">Measured</th>
                    <th scope="col" className="px-3 py-2 font-medium">Specification</th>
                    <th scope="col" className="px-3 py-2 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {caseStudy.measurements.map((measurement, index) => {
                    const meta = RESULT_META[measurement.result]
                    const Icon = meta.icon
                    return (
                      <tr key={index} className="border-t border-line/70">
                        <td className="px-3 py-2 text-silver-200">{measurement.label}</td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-white">
                          {measurement.value}
                          {measurement.unit ? <span className="text-silver-500"> {measurement.unit}</span> : null}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-silver-400">
                          {measurement.specification || '—'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <span className={`inline-flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.08em] ${meta.className}`}>
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                            {meta.label}
                          </span>
                          <span className="sr-only">{MEASUREMENT_RESULT_LABEL[measurement.result]}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-silver-500">No electrical measurements recorded for this case.</p>
          )}
        </ReportSection>

        <ReportSection index="05" title="Confirmed fault" icon={AlertTriangle}>
          {caseStudy.confirmed_fault ? (
            <div className="rounded border-l-2 border-signal-400 bg-signal-400/[0.06] px-4 py-3">
              <p className="prose-tech text-sm sm:text-[0.9375rem]">{caseStudy.confirmed_fault}</p>
            </div>
          ) : (
            <p className="flex items-start gap-2 rounded border border-warn-400/30 bg-warn-400/[0.06] px-3 py-2 text-sm text-warn-400">
              <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Root cause not yet confirmed — recorded honestly rather than assumed.
            </p>
          )}
        </ReportSection>

        <ReportSection index="06" title="Repair procedure" icon={Wrench}>
          {caseStudy.repair_procedure ? (
            <p className="prose-tech text-sm sm:text-[0.9375rem]">{caseStudy.repair_procedure}</p>
          ) : (
            <p className="text-sm text-silver-500">Repair details have not been published for this case.</p>
          )}
        </ReportSection>

        <ReportSection index="07" title="Verification" icon={ClipboardCheck}>
          {caseStudy.verification.length ? (
            <ul className="space-y-2">
              {caseStudy.verification.map((check, index) => {
                const meta = RESULT_META[check.status]
                const Icon = meta.icon
                return (
                  <li
                    key={index}
                    className="flex items-start justify-between gap-3 rounded border border-line bg-ink-950/50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-silver-200">{check.check}</p>
                      {check.result ? <p className="mt-0.5 text-xs text-silver-500">{check.result}</p> : null}
                    </div>
                    <span className={`inline-flex shrink-0 items-center gap-1 font-mono text-[0.625rem] uppercase tracking-[0.08em] ${meta.className}`}>
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {meta.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-silver-500">Post-repair verification has not been recorded yet.</p>
          )}
        </ReportSection>
      </div>
    </div>
  )
}

function Spec({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.13em] text-silver-600">{label}</dt>
      <dd className="mt-0.5 text-sm text-silver-200">{value || <span className="text-silver-600">—</span>}</dd>
    </div>
  )
}
