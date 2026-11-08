import { useMemo, useState } from 'react'
import { Activity, Search, Stethoscope } from 'lucide-react'
import { Seo, breadcrumbJsonLd } from '@/components/seo/Seo'
import { EmptyState, PageHeader, Section, SkeletonGrid, Tag } from '@/components/ui'
import { DiagnosticCard } from '@/components/diagnostics/DiagnosticCard'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useSiteData } from '@/hooks/useSiteData'
import { getRepository } from '@/services'
import { EMPTY_STATES } from '@/lib/defaults'
import { cn } from '@/lib/utils'

export default function Diagnostics() {
  const { profile } = useSiteData()
  const repository = getRepository()
  const [query, setQuery] = useState('')
  const [system, setSystem] = useState('All')

  const cases = useAsyncData(() => repository.diagnosticCases.list(), [])

  const systems = useMemo(() => {
    const set = new Set<string>()
    for (const item of cases.data ?? []) {
      if (item.vehicle_system) set.add(item.vehicle_system)
    }
    return Array.from(set).sort()
  }, [cases.data])

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()
    return (cases.data ?? []).filter((item) => {
      const matchesSystem = system === 'All' || item.vehicle_system === system
      if (!matchesSystem) return false
      if (!search) return true
      const haystack = [
        item.title,
        item.customer_complaint,
        item.confirmed_fault,
        item.vehicle_system,
        item.vehicle_make,
        item.vehicle_model,
        item.scan_tool,
        ...item.dtc_codes.map((dtc) => `${dtc.code} ${dtc.description}`),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(search)
    })
  }, [cases.data, query, system])

  return (
    <>
      <Seo
        title="Diagnostic Case Studies — Vehicle Fault Diagnosis | Medekuku Mawuli Kofi"
        description="Automotive diagnostic case studies by Medekuku Mawuli Kofi: customer complaint, diagnostic trouble codes, live data, electrical measurements, confirmed fault, repair and verification."
        path="/diagnostics"
        keywords="automotive diagnostic case studies, vehicle fault diagnosis Accra, DTC analysis, ECU diagnostics Ghana"
        jsonLd={[
          breadcrumbJsonLd([
            { label: 'Home', path: '/' },
            { label: 'Diagnostics', path: '/diagnostics' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Automotive Diagnostic Case Studies',
            description:
              'Structured automotive diagnostic reports documenting complaint, DTC analysis, test procedure, confirmed fault and verification.',
          },
        ]}
      />

      <PageHeader
        eyebrow="Diagnostic case studies"
        title="Systematic diagnosis, documented step by step"
        description="Each case study is a technical report: the complaint as presented, the codes stored, the tests performed, the confirmed root cause and the post-repair verification."
        aside={
          <Tag tone="signal">
            <Activity className="h-3 w-3" aria-hidden="true" />
            {cases.data?.length ?? 0} published
          </Tag>
        }
      >
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-500">
          <li>Complaint</li>
          <li aria-hidden="true">→</li>
          <li>DTC / live data</li>
          <li aria-hidden="true">→</li>
          <li>Test plan</li>
          <li aria-hidden="true">→</li>
          <li>Confirmed fault</li>
          <li aria-hidden="true">→</li>
          <li>Verification</li>
        </ul>
      </PageHeader>

      <Section>
        <div className="container-page">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:max-w-xs sm:flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-600"
                aria-hidden="true"
              />
              <label htmlFor="case-search" className="sr-only">
                Search diagnostic cases
              </label>
              <input
                id="case-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search DTC, symptom or system…"
                className="field pl-9"
              />
            </div>
            {systems.length > 1 ? (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by vehicle system">
                {['All', ...systems].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSystem(option)}
                    aria-pressed={system === option}
                    className={cn(
                      'rounded-full border px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.08em] transition-colors',
                      system === option
                        ? 'border-signal-400/60 bg-signal-400/12 text-signal-200'
                        : 'border-line text-silver-400 hover:border-silver-600 hover:text-silver-200',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {cases.error ? (
            <div className="panel border-danger-400/30 p-5 text-sm">
              <p className="font-semibold text-danger-400">Case studies could not be loaded</p>
              <p className="mt-1 text-silver-400">{cases.error}</p>
              <button type="button" onClick={cases.reload} className="btn btn-ghost btn-sm mt-3">
                Try again
              </button>
            </div>
          ) : cases.loading ? (
            <SkeletonGrid count={4} />
          ) : filtered.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((caseStudy, index) => (
                <DiagnosticCard key={caseStudy.id} caseStudy={caseStudy} priority={index < 3} />
              ))}
            </div>
          ) : (cases.data ?? []).length ? (
            <EmptyState
              title="No case studies match that search"
              body="Try another DTC code, symptom or clear the system filter."
              icon={Search}
              action={
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setQuery('')
                    setSystem('All')
                  }}
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <EmptyState {...EMPTY_STATES.diagnostics} adminHint icon={Stethoscope} />
          )}

          <div className="mt-10 grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
            {[
              {
                title: 'No blind part swapping',
                body: 'Every case documents the test that confirmed the fault before a component was replaced.',
              },
              {
                title: 'Measurements recorded',
                body: `${profile.full_name} records voltage, resistance and signal results against specification where measured.`,
              },
              {
                title: 'Honest verification',
                body: 'Post-repair checks are marked pass, fail or pending — nothing is presented as verified until it is.',
              },
            ].map((item) => (
              <div key={item.title}>
                <h2 className="font-display text-sm font-semibold uppercase tracking-[0.1em] text-white">
                  {item.title}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-silver-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </>
  )
}
