import { Link } from 'react-router-dom'
import { Activity, ArrowUpRight, CheckCircle2, ClipboardList } from 'lucide-react'
import { MediaImage } from '@/components/ui/MediaImage'
import { Tag } from '@/components/ui'
import { countVerification, truncate, vehicleLabel } from '@/lib/utils'
import type { DiagnosticCase } from '@/types'

export function DiagnosticCard({ caseStudy, priority = false }: { caseStudy: DiagnosticCase; priority?: boolean }) {
  const vehicle = vehicleLabel(caseStudy)
  const { pass, total } = countVerification(caseStudy.verification)
  const primaryDtc = caseStudy.dtc_codes[0]?.code
  const cover = caseStudy.media.find((item) => item.kind === 'scan' || item.kind === 'photo')?.url ?? null

  return (
    <article className="panel panel-interactive group flex h-full flex-col overflow-hidden">
      <Link
        to={`/diagnostics/${caseStudy.slug}`}
        className="relative block"
        aria-label={`Read diagnostic case study: ${caseStudy.title}`}
        tabIndex={-1}
      >
        <MediaImage
          src={cover}
          alt={`${caseStudy.title} diagnostic case study${vehicle ? ` — ${vehicle}` : ''}`}
          ratio="16/10"
          priority={priority}
          placeholderKind="scan"
          placeholderLabel="Scan data / photograph pending"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Tag tone="signal">
            <Activity className="h-3 w-3" aria-hidden="true" />
            Case study
          </Tag>
          {caseStudy.featured ? <Tag>Featured</Tag> : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.13em] text-signal-300/90">
            {caseStudy.vehicle_system || 'Vehicle system not specified'}
          </p>
          {primaryDtc ? (
            <span className="rounded border border-line bg-ink-950 px-1.5 py-0.5 font-mono text-[0.625rem] text-silver-300">
              {primaryDtc}
              {caseStudy.dtc_codes.length > 1 ? ` +${caseStudy.dtc_codes.length - 1}` : ''}
            </span>
          ) : null}
        </div>

        <h3 className="font-display text-[1.1875rem] font-semibold leading-snug text-white">
          <Link to={`/diagnostics/${caseStudy.slug}`} className="transition-colors hover:text-signal-200">
            {caseStudy.title}
          </Link>
        </h3>

        {vehicle ? <p className="mt-1.5 text-xs text-silver-400">{vehicle}</p> : null}

        <div className="mt-3 rounded border border-line/70 bg-ink-950/60 p-2.5">
          <p className="mb-1 flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.13em] text-silver-600">
            <ClipboardList className="h-3 w-3" aria-hidden="true" />
            Complaint
          </p>
          <p className="text-[0.8125rem] leading-relaxed text-silver-300">
            {truncate(caseStudy.customer_complaint, 110)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4">
          {total > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[0.6875rem] text-silver-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-ok-400" aria-hidden="true" />
              {pass}/{total} verification checks
            </span>
          ) : (
            <span className="text-[0.6875rem] text-silver-600">Verification pending</span>
          )}
          <Link
            to={`/diagnostics/${caseStudy.slug}`}
            className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.09em] text-signal-300 transition-colors hover:text-signal-200"
          >
            Read
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  )
}
