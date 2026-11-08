import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Gauge,
  Play,
  Wrench,
  Zap,
} from 'lucide-react'
import { Seo, articleJsonLd, breadcrumbJsonLd } from '@/components/seo/Seo'
import { Breadcrumbs, Callout, EmptyState, Section, Tag } from '@/components/ui'
import { MediaImage } from '@/components/ui/MediaImage'
import { VideoEmbed } from '@/components/youtube/VideoCard'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useSiteData } from '@/hooks/useSiteData'
import { getRepository } from '@/services'
import { formatDate, extractYoutubeId, MEASUREMENT_RESULT_LABEL, vehicleLabel } from '@/lib/utils'
import type { Measurement } from '@/types'

export default function ProjectDetails() {
  const { slug = '' } = useParams()
  const { profile } = useSiteData()
  const repository = getRepository()
  const [videoActive, setVideoActive] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)

  const project = useAsyncData(() => repository.projects.getBySlug(slug), [slug])
  const related = useAsyncData(
    async () => {
      const all = await repository.projects.list()
      return all.filter((item) => item.slug !== slug).slice(0, 3)
    },
    [slug],
  )

  const data = project.data
  const videoId = useMemo(() => (data?.youtube_url ? extractYoutubeId(data.youtube_url) : null), [data?.youtube_url])

  if (project.loading) {
    return (
      <div className="container-page py-16" aria-busy="true">
        <div className="skeleton mb-4 h-4 w-40" />
        <div className="skeleton mb-3 h-10 w-2/3" />
        <div className="skeleton mb-8 h-4 w-1/3" />
        <div className="skeleton aspect-[16/9] w-full" />
      </div>
    )
  }

  if (!data) {
    return (
      <>
        <Seo
          title="Project not found — Medekuku Mawuli Kofi"
          description="This automotive project could not be found. Browse all published automotive projects."
          path={`/projects/${slug}`}
          noindex
        />
        <Section>
          <div className="container-page max-w-2xl">
            <EmptyState
              title="Project not found"
              body="This project may be unpublished, renamed, or the link may be incorrect."
              icon={Wrench}
              action={
                <Link to="/projects" className="btn btn-primary">
                  Browse all projects
                </Link>
              }
            />
          </div>
        </Section>
      </>
    )
  }

  const vehicle = vehicleLabel(data)
  const publishedPath = `/projects/${data.slug}`
  const description = data.seo_description || data.description.slice(0, 158)

  return (
    <>
      <Seo
        title={data.seo_title || `${data.title} — Automotive Project | Medekuku Mawuli Kofi`}
        description={description}
        path={publishedPath}
        type="article"
        image={data.cover_image}
        publishedTime={data.published_at}
        jsonLd={[
          articleJsonLd({
            headline: data.title,
            description,
            path: publishedPath,
            datePublished: data.published_at,
            image: data.cover_image,
            authorName: profile.full_name,
          }),
          breadcrumbJsonLd([
            { label: 'Home', path: '/' },
            { label: 'Automotive Projects', path: '/projects' },
            { label: data.title, path: publishedPath },
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
                { label: 'Projects', path: '/projects' },
                { label: data.title },
              ]}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Tag tone="signal">{data.category}</Tag>
              {data.featured ? <Tag>Featured</Tag> : null}
              {data.published_at ? (
                <span className="inline-flex items-center gap-1 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-500">
                  <Calendar className="h-3 w-3" aria-hidden="true" />
                  {formatDate(data.published_at)}
                </span>
              ) : null}
            </div>
            <h1 className="mt-3 max-w-4xl text-[1.875rem] leading-[1.1] font-semibold tracking-tight sm:text-[2.5rem] lg:text-[2.875rem]">
              {data.title}
            </h1>
            {vehicle ? (
              <p className="mt-3 text-sm text-silver-400 sm:text-base">
                {vehicle}
                {data.engine ? ` · ${data.engine}` : ''}
              </p>
            ) : null}
            <p className="mt-4 max-w-3xl text-[0.9375rem] leading-relaxed text-silver-300">{data.description}</p>
          </div>
        </header>

        <Section>
          <div className="container-page grid gap-9 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-11">
            <div className="min-w-0 space-y-9">
              <MediaImage
                src={data.cover_image}
                alt={`${data.title}${vehicle ? ` — ${vehicle}` : ''} automotive project photograph`}
                ratio="16/9"
                priority
                placeholderLabel="Project photograph pending upload"
                className="rounded-lg border border-line"
              />

              {data.problem_statement ? (
                <Block title="Customer complaint / observed problem" icon={ClipboardList}>
                  <p className="prose-tech text-sm sm:text-[0.9375rem]">{data.problem_statement}</p>
                </Block>
              ) : null}

              {data.diagnostic_procedure ? (
                <Block title="Diagnostic procedure" icon={Gauge}>
                  <p className="prose-tech whitespace-pre-line text-sm sm:text-[0.9375rem]">
                    {data.diagnostic_procedure}
                  </p>
                </Block>
              ) : null}

              {data.measurements.length ? (
                <Block title="Electrical measurements" icon={Zap}>
                  <MeasurementTable measurements={data.measurements} />
                </Block>
              ) : null}

              {data.repair_procedure ? (
                <Block title="Repair procedure" icon={Wrench}>
                  <p className="prose-tech whitespace-pre-line text-sm sm:text-[0.9375rem]">{data.repair_procedure}</p>
                </Block>
              ) : null}

              {data.final_result ? (
                <Block title="Final outcome" icon={CheckCircle2}>
                  <p className="prose-tech whitespace-pre-line text-sm sm:text-[0.9375rem]">{data.final_result}</p>
                </Block>
              ) : null}

              {videoId ? (
                <Block title="Video demonstration" icon={Play}>
                  <VideoEmbed
                    videoId={videoId}
                    title={`${data.title} — video demonstration`}
                    active={videoActive}
                    onActivate={() => setVideoActive(true)}
                  />
                  <a
                    href={data.youtube_url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-signal-300 hover:text-signal-200"
                  >
                    Open on YouTube
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </Block>
              ) : null}

              {data.gallery.length ? (
                <Block title="Project photographs" icon={Play}>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {data.gallery.map((url, index) => (
                      <button
                        key={`${url}-${index}`}
                        type="button"
                        onClick={() => setLightbox(url)}
                        className="group overflow-hidden rounded border border-line"
                        aria-label={`Enlarge project photograph ${index + 1}`}
                      >
                        <MediaImage
                          src={url}
                          alt={`${data.title} — project photograph ${index + 1}`}
                          ratio="4/3"
                        />
                      </button>
                    ))}
                  </div>
                </Block>
              ) : null}

              <div className="flex flex-wrap items-center gap-2.5 border-t border-line pt-6">
                <Link to="/projects" className="btn btn-ghost btn-sm">
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  All projects
                </Link>
                <Link to="/diagnostics" className="btn btn-secondary btn-sm">
                  Diagnostic case studies
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </div>
            </div>

            {/* Spec sidebar */}
            <aside className="space-y-4">
              <div className="panel p-4 lg:sticky lg:top-24">
                <h2 className="label-tech mb-3">Vehicle &amp; system</h2>
                <dl className="space-y-0">
                  <SpecRow label="Make" value={data.vehicle_make} />
                  <SpecRow label="Model" value={data.vehicle_model} />
                  <SpecRow label="Year" value={data.vehicle_year ? String(data.vehicle_year) : ''} />
                  <SpecRow label="Engine" value={data.engine} />
                  <SpecRow label="Transmission" value={data.transmission} />
                  <SpecRow label="System" value={data.vehicle_system} />
                  <SpecRow label="Category" value={data.category} />
                </dl>

                {data.tools_used.length ? (
                  <div className="mt-4 border-t border-line pt-4">
                    <h2 className="label-tech mb-2">Tools used</h2>
                    <ul className="flex flex-wrap gap-1.5">
                      {data.tools_used.map((tool) => (
                        <li key={tool}>
                          <Tag>{tool}</Tag>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-4 border-t border-line pt-4">
                  <Link to="/contact" className="btn btn-primary btn-sm w-full justify-center">
                    Discuss similar work
                  </Link>
                </div>
              </div>

              <Callout title="Documentation standard">
                Every published project records the complaint, the diagnostic path and the outcome. Where a result is
                not yet confirmed, it is stated as unverified rather than assumed.
              </Callout>
            </aside>
          </div>
        </Section>

        {(related.data ?? []).length ? (
          <Section tone="raised">
            <div className="container-page">
              <h2 className="mb-6 text-xl font-semibold sm:text-2xl">More automotive projects</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(related.data ?? []).map((item) => (
                  <Link
                    key={item.id}
                    to={`/projects/${item.slug}`}
                    className="panel panel-interactive group flex gap-3 p-3"
                  >
                    <div className="w-20 shrink-0 overflow-hidden rounded border border-line">
                      <MediaImage src={item.cover_image} alt={item.title} ratio="1/1" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-signal-300/80">
                        {item.category}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-sm font-medium text-white group-hover:text-signal-200">
                        {item.title}
                      </p>
                      <p className="mt-1 truncate text-xs text-silver-500">{vehicleLabel(item)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Section>
        ) : null}
      </article>

      {lightbox ? (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-ink-950/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Project photograph"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Enlarged project photograph" className="max-h-full max-w-full rounded" />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="btn btn-secondary absolute right-4 top-4"
            autoFocus
          >
            Close
          </button>
        </div>
      ) : null}
    </>
  )
}

function Block({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof Gauge
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold sm:text-[1.375rem]">
        <Icon className="h-4 w-4 text-signal-400" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  )
}

function SpecRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-line/60 py-1.5 last:border-0">
      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-600">{label}</dt>
      <dd className="text-right text-xs text-silver-200">{value || '—'}</dd>
    </div>
  )
}

const RESULT_STYLE: Record<Measurement['result'], string> = {
  pass: 'text-ok-400',
  fail: 'text-danger-400',
  inconclusive: 'text-warn-400',
}

export function MeasurementTable({ measurements }: { measurements: Measurement[] }) {
  return (
    <div className="overflow-x-auto rounded border border-line">
      <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
        <caption className="sr-only">Electrical measurements recorded during this project</caption>
        <thead>
          <tr className="bg-ink-850 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-500">
            <th scope="col" className="px-3 py-2 font-medium">Test point</th>
            <th scope="col" className="px-3 py-2 font-medium">Measured</th>
            <th scope="col" className="px-3 py-2 font-medium">Specification</th>
            <th scope="col" className="px-3 py-2 font-medium">Result</th>
          </tr>
        </thead>
        <tbody>
          {measurements.map((measurement, index) => (
            <tr key={index} className="border-t border-line/70">
              <td className="px-3 py-2 text-silver-200">{measurement.label}</td>
              <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-white">
                {measurement.value}
                {measurement.unit ? <span className="text-silver-500"> {measurement.unit}</span> : null}
              </td>
              <td className="px-3 py-2 font-mono text-xs text-silver-400">{measurement.specification || '—'}</td>
              <td className={`px-3 py-2 font-mono text-[0.625rem] uppercase ${RESULT_STYLE[measurement.result]}`}>
                {MEASUREMENT_RESULT_LABEL[measurement.result]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
