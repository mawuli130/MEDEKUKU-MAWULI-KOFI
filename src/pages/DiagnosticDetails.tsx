import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Download, Image as ImageIcon, Play, Stethoscope } from 'lucide-react'
import { Seo, articleJsonLd, breadcrumbJsonLd } from '@/components/seo/Seo'
import { Breadcrumbs, Callout, EmptyState, Section, Tag } from '@/components/ui'
import { MediaImage } from '@/components/ui/MediaImage'
import { DiagnosticReport } from '@/components/diagnostics/DiagnosticReport'
import { VideoEmbed } from '@/components/youtube/VideoCard'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useSiteData } from '@/hooks/useSiteData'
import { getRepository } from '@/services'
import { extractYoutubeId, vehicleLabel } from '@/lib/utils'
import type { DiagnosticMedia } from '@/types'

const MEDIA_LABEL: Record<DiagnosticMedia['kind'], string> = {
  scan: 'Scan tool data',
  waveform: 'Oscilloscope waveform',
  wiring: 'Wiring diagram',
  photo: 'Diagnostic photograph',
  video: 'Video',
}

export default function DiagnosticDetails() {
  const { slug = '' } = useParams()
  const { profile } = useSiteData()
  const repository = getRepository()
  const [videoActive, setVideoActive] = useState(false)
  const [lightbox, setLightbox] = useState<DiagnosticMedia | null>(null)

  const record = useAsyncData(() => repository.diagnosticCases.getBySlug(slug), [slug])
  const related = useAsyncData(
    async () => {
      const all = await repository.diagnosticCases.list()
      return all.filter((item) => item.slug !== slug).slice(0, 3)
    },
    [slug],
  )

  const data = record.data
  const videoId = useMemo(() => (data?.youtube_url ? extractYoutubeId(data.youtube_url) : null), [data?.youtube_url])

  if (record.loading) {
    return (
      <div className="container-page py-16" aria-busy="true">
        <div className="skeleton mb-4 h-4 w-40" />
        <div className="skeleton mb-3 h-10 w-3/5" />
        <div className="skeleton mb-8 h-24 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    )
  }

  if (!data) {
    return (
      <>
        <Seo
          title="Diagnostic case study not found — Medekuku Mawuli Kofi"
          description="This diagnostic case study could not be found."
          path={`/diagnostics/${slug}`}
          noindex
        />
        <Section>
          <div className="container-page max-w-2xl">
            <EmptyState
              title="Case study not found"
              body="This report may have been unpublished or moved."
              icon={Stethoscope}
              action={
                <Link to="/diagnostics" className="btn btn-primary">
                  Browse diagnostic case studies
                </Link>
              }
            />
          </div>
        </Section>
      </>
    )
  }

  const path = `/diagnostics/${data.slug}`
  const description =
    data.seo_description ||
    `Diagnostic case study: ${data.customer_complaint.slice(0, 120)} — ${vehicleLabel(data)}.`
  const imageMedia = data.media.filter((item) => item.kind !== 'video')

  return (
    <>
      <Seo
        title={data.seo_title || `${data.title} — Diagnostic Case Study | Medekuku Mawuli Kofi`}
        description={description}
        path={path}
        type="article"
        image={imageMedia[0]?.url ?? null}
        publishedTime={data.published_at}
        keywords={
          data.dtc_codes.length
            ? `${data.dtc_codes.map((dtc) => dtc.code).join(', ')}, automotive diagnostics, ${data.vehicle_system}`
            : undefined
        }
        jsonLd={[
          articleJsonLd({
            headline: data.title,
            description,
            path,
            datePublished: data.published_at,
            image: imageMedia[0]?.url ?? null,
            authorName: profile.full_name,
          }),
          breadcrumbJsonLd([
            { label: 'Home', path: '/' },
            { label: 'Diagnostics', path: '/diagnostics' },
            { label: data.title, path },
          ]),
        ]}
      />

      <article>
        <header className="relative overflow-hidden border-b border-line bg-ink-900">
          <div className="grid-overlay pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
          <div className="blueprint-glow pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="container-page relative py-10 md:py-14">
            <Breadcrumbs
              crumbs={[
                { label: 'Home', path: '/' },
                { label: 'Diagnostics', path: '/diagnostics' },
                { label: data.title },
              ]}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="signal">{data.vehicle_system || 'Vehicle system'}</Tag>
              {data.featured ? <Tag>Featured</Tag> : null}
              <Tag>{data.status === 'published' ? 'Published report' : 'Draft'}</Tag>
            </div>
            <h1 className="mt-3 max-w-4xl text-[1.875rem] leading-[1.1] font-semibold tracking-tight sm:text-[2.5rem] lg:text-[2.875rem]">
              {data.title}
            </h1>
            <p className="mt-3 text-sm text-silver-400 sm:text-base">{vehicleLabel(data) || 'Vehicle details pending'}</p>
          </div>
        </header>

        <Section>
          <div className="container-page grid gap-9 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-11">
            <div className="min-w-0">
              <DiagnosticReport caseStudy={data} />

              {imageMedia.length ? (
                <section className="mt-9">
                  <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                    <ImageIcon className="h-4 w-4 text-signal-400" aria-hidden="true" />
                    Diagnostic media
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {imageMedia.map((item, index) => (
                      <figure key={`${item.url}-${index}`} className="panel overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setLightbox(item)}
                          className="block w-full"
                          aria-label={`Enlarge ${MEDIA_LABEL[item.kind]}${item.caption ? `: ${item.caption}` : ''}`}
                        >
                          <MediaImage
                            src={item.url}
                            alt={item.caption || `${MEDIA_LABEL[item.kind]} from diagnostic case ${data.title}`}
                            ratio="4/3"
                            placeholderKind="scan"
                            placeholderLabel={MEDIA_LABEL[item.kind]}
                          />
                        </button>
                        <figcaption className="border-t border-line px-3 py-2">
                          <span className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-signal-300/80">
                            {MEDIA_LABEL[item.kind]}
                          </span>
                          {item.caption ? (
                            <p className="mt-0.5 text-xs text-silver-400">{item.caption}</p>
                          ) : null}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              ) : null}

              {videoId ? (
                <section className="mt-9">
                  <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold">
                    <Play className="h-4 w-4 text-signal-400" aria-hidden="true" />
                    Video demonstration
                  </h2>
                  <VideoEmbed
                    videoId={videoId}
                    title={`${data.title} — diagnostic demonstration`}
                    active={videoActive}
                    onActivate={() => setVideoActive(true)}
                  />
                </section>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-2.5 border-t border-line pt-6">
                <Link to="/diagnostics" className="btn btn-ghost btn-sm">
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  All case studies
                </Link>
                <Link to="/projects" className="btn btn-secondary btn-sm">
                  Automotive projects
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-ghost btn-sm"
                  aria-label="Print or save this diagnostic report as PDF"
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Print / save report
                </button>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="panel p-4 lg:sticky lg:top-24">
                <h2 className="label-tech mb-3">Report summary</h2>
                <dl className="space-y-2 text-xs">
                  <SummaryRow label="DTCs recorded" value={String(data.dtc_codes.length)} />
                  <SummaryRow label="Test steps" value={String(data.diagnostic_procedure.length)} />
                  <SummaryRow label="Measurements" value={String(data.measurements.length)} />
                  <SummaryRow
                    label="Verification"
                    value={`${data.verification.filter((check) => check.status === 'pass').length}/${data.verification.length} passed`}
                  />
                  <SummaryRow label="Scan tool" value={data.scan_tool || '—'} />
                </dl>
                <div className="mt-4 border-t border-line pt-4">
                  <Link to="/contact" className="btn btn-primary btn-sm w-full justify-center">
                    Request diagnostic support
                  </Link>
                </div>
              </div>

              <Callout title="Privacy">
                Vehicle identification numbers, registration plates and customer details are never included in a
                published report.
              </Callout>

              <Callout title="Accuracy note" tone="warn">
                Measurements are recorded as taken at the time of diagnosis. Unverified findings are labelled
                &ldquo;unverified&rdquo; rather than presented as confirmed.
              </Callout>
            </aside>
          </div>
        </Section>

        {(related.data ?? []).length ? (
          <Section tone="raised">
            <div className="container-page">
              <h2 className="mb-6 text-xl font-semibold sm:text-2xl">More diagnostic case studies</h2>
              <ul className="grid gap-3 sm:grid-cols-3">
                {(related.data ?? []).map((item) => (
                  <li key={item.id}>
                    <Link to={`/diagnostics/${item.slug}`} className="panel panel-interactive block p-4">
                      <p className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-signal-300/80">
                        {item.vehicle_system || 'Diagnostics'}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm font-medium text-white">{item.title}</p>
                      <p className="mt-1 truncate text-xs text-silver-500">{vehicleLabel(item)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        ) : null}
      </article>

      {lightbox ? (
        <div
          className="fixed inset-0 z-[110] flex flex-col items-center justify-center gap-3 bg-ink-950/96 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.caption || MEDIA_LABEL[lightbox.kind]}
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox.url}
            alt={lightbox.caption || MEDIA_LABEL[lightbox.kind]}
            className="max-h-[80vh] max-w-full rounded border border-line"
          />
          {lightbox.caption ? <p className="text-sm text-silver-300">{lightbox.caption}</p> : null}
          <button type="button" className="btn btn-secondary btn-sm" autoFocus>
            Close
          </button>
        </div>
      ) : null}
    </>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-line/60 py-1.5 last:border-0">
      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-600">{label}</dt>
      <dd className="text-right font-medium text-silver-200">{value}</dd>
    </div>
  )
}
