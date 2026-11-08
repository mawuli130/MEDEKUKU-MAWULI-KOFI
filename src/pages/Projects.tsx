import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LayoutGrid, Search, SlidersHorizontal, X } from 'lucide-react'
import { Seo, breadcrumbJsonLd } from '@/components/seo/Seo'
import { PageHeader, EmptyState, Section, SkeletonGrid, Tag } from '@/components/ui'
import { ProjectCard } from '@/components/automotive-projects/ProjectCard'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useSiteData } from '@/hooks/useSiteData'
import { getRepository } from '@/services'
import { EMPTY_STATES } from '@/lib/defaults'
import { PROJECT_CATEGORIES, type ProjectCategory } from '@/types'
import { searchProjectText } from '@/lib/utils'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 9

export default function Projects() {
  const { profile } = useSiteData()
  const repository = getRepository()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const activeCategory = searchParams.get('category') ?? 'All'
  const projects = useAsyncData(() => repository.projects.list(), [])

  const categories = useMemo(() => {
    const present = new Set((projects.data ?? []).map((project) => project.category))
    return PROJECT_CATEGORIES.filter((category) => present.has(category))
  }, [projects.data])

  const filtered = useMemo(() => {
    const all = projects.data ?? []
    const search = query.trim().toLowerCase()
    return all.filter((project) => {
      const matchesCategory = activeCategory === 'All' || project.category === activeCategory
      const matchesSearch = !search || searchProjectText(project).includes(search)
      return matchesCategory && matchesSearch
    })
  }, [projects.data, activeCategory, query])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [activeCategory, query])

  function setCategory(category: string) {
    const next = new URLSearchParams(searchParams)
    if (category === 'All') next.delete('category')
    else next.set('category', category)
    setSearchParams(next, { replace: true })
  }

  const visible = filtered.slice(0, visibleCount)

  return (
    <>
      <Seo
        title="Automotive Projects — Vehicle Diagnostics & Electrical Repairs | Medekuku Mawuli Kofi"
        description="Documented automotive projects by Medekuku Mawuli Kofi: vehicle electrical diagnostics, ECU and TCU systems, engine management, sensor testing and workshop repairs in Accra, Ghana."
        path="/projects"
        jsonLd={[
          breadcrumbJsonLd([
            { label: 'Home', path: '/' },
            { label: 'Automotive Projects', path: '/projects' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Automotive Projects',
            description:
              'Documented automotive electrical and diagnostic projects performed on real vehicles.',
            about: PROJECT_CATEGORIES.map((category) => ({ '@type': 'Thing', name: category })),
          },
        ]}
      />

      <PageHeader
        eyebrow="Automotive projects"
        title="Projects performed on real vehicles"
        description="Electrical diagnostics, ECU and engine management work, sensor testing and mechanical repairs — recorded with the vehicle, complaint, procedure and result."
        aside={
          <Tag tone="signal">
            <LayoutGrid className="h-3 w-3" aria-hidden="true" />
            {projects.data?.length ?? 0} published
          </Tag>
        }
      />

      <Section>
        <div className="container-page">
          {/* Filters */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative sm:max-w-xs sm:flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-600"
                  aria-hidden="true"
                />
                <label htmlFor="project-search" className="sr-only">
                  Search projects
                </label>
                <input
                  id="project-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search by vehicle, system or fault…"
                  className="field pl-9"
                />
              </div>
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-500">
                {filtered.length} {filtered.length === 1 ? 'project' : 'projects'}
                {activeCategory !== 'All' ? ` · ${activeCategory}` : ''}
              </p>
            </div>

            <div className="flex items-start gap-2">
              <SlidersHorizontal className="mt-2 h-3.5 w-3.5 shrink-0 text-silver-600" aria-hidden="true" />
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter projects by category">
                <FilterChip active={activeCategory === 'All'} onClick={() => setCategory('All')}>
                  All categories
                </FilterChip>
                {(categories.length ? categories : PROJECT_CATEGORIES).map((category) => (
                  <FilterChip
                    key={category}
                    active={activeCategory === category}
                    onClick={() => setCategory(category)}
                  >
                    {category}
                  </FilterChip>
                ))}
                {activeCategory !== 'All' || query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setCategory('All')
                    }}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-silver-500 transition-colors hover:text-danger-400"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                    Clear
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {projects.error ? (
            <div className="panel border-danger-400/30 p-5 text-sm text-silver-300">
              <p className="font-semibold text-danger-400">Projects could not be loaded</p>
              <p className="mt-1 text-silver-400">{projects.error}</p>
              <button type="button" onClick={projects.reload} className="btn btn-ghost btn-sm mt-3">
                Try again
              </button>
            </div>
          ) : projects.loading ? (
            <SkeletonGrid count={6} />
          ) : filtered.length ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((project, index) => (
                  <ProjectCard key={project.id} project={project} priority={index < 3} />
                ))}
              </div>
              {visibleCount < filtered.length ? (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    className="btn btn-secondary"
                  >
                    Load more projects ({filtered.length - visibleCount} remaining)
                  </button>
                </div>
              ) : null}
            </>
          ) : (projects.data ?? []).length ? (
            <EmptyState
              title="No projects match those filters"
              body="Try a different category or clear the search to see all documented work."
              icon={Search}
              action={
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setQuery('')
                    setCategory('All')
                  }}
                >
                  Clear filters
                </button>
              }
            />
          ) : (
            <EmptyState {...EMPTY_STATES.projects} adminHint />
          )}

          <p className="mt-8 border-t border-line pt-4 text-xs leading-relaxed text-silver-600">
            {profile.full_name} documents each project with the vehicle details, observed complaint, diagnostic
            procedure and final outcome. Vehicle identification information is never published.
          </p>
        </div>
      </Section>
    </>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.08em] transition-colors',
        active
          ? 'border-signal-400/60 bg-signal-400/12 text-signal-200'
          : 'border-line bg-white/[0.02] text-silver-400 hover:border-silver-600 hover:text-silver-200',
      )}
    >
      {children}
    </button>
  )
}

export type { ProjectCategory }
