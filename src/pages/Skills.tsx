import { ArrowRight, CircuitBoard, Cog, Cpu, Gauge, Radio } from 'lucide-react'
import { Seo, breadcrumbJsonLd } from '@/components/seo/Seo'
import { ActionLink, Callout, EmptyState, PageHeader, Section, SectionHeader, SkeletonGrid } from '@/components/ui'
import { SkillGroupCards, SkillLevelLegend, groupSkills } from '@/components/skills/SkillGroups'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useSiteData } from '@/hooks/useSiteData'
import { getRepository } from '@/services'
import { EMPTY_STATES, SKILL_LEVEL_COPY } from '@/lib/defaults'
import { SKILL_CATEGORIES, type SkillCategory } from '@/types'

const CATEGORY_META: Record<SkillCategory, { icon: typeof CircuitBoard; blurb: string }> = {
  'Automotive Electrical Systems': {
    icon: CircuitBoard,
    blurb: 'Circuits, supplies, grounds and harness integrity — the foundation of every electrical fault.',
  },
  'Automotive Electronics': {
    icon: Cpu,
    blurb: 'Control modules, engine management, sensors and actuators, and the signals between them.',
  },
  'Vehicle Diagnostics': {
    icon: Gauge,
    blurb: 'Scan tool work, code interpretation, live data and a structured test plan.',
  },
  'Mechanical Skills': {
    icon: Cog,
    blurb: 'Servicing, inspection and workshop repair procedure alongside electronic diagnosis.',
  },
  'Advanced Technical Interests': {
    icon: Radio,
    blurb: 'Areas of active study: hybrid systems, vehicle networks, oscilloscope work and coding.',
  },
}

export default function Skills() {
  const { profile } = useSiteData()
  const repository = getRepository()
  const skills = useAsyncData(() => repository.skills.list(), [])
  const groups = groupSkills(skills.data ?? [])

  return (
    <>
      <Seo
        title="Automotive Skills — Electrical, ECU & Diagnostic Capability | Medekuku Mawuli Kofi"
        description={`Automotive skills of ${profile.full_name}: electrical circuit troubleshooting, ECU and engine management systems, OBD-II diagnostics, sensor and actuator testing, and workshop repair procedure.`}
        path="/skills"
        keywords="automotive electrical skills, ECU diagnostic skills Ghana, OBD-II diagnostics, automotive technician skills"
        jsonLd={[
          breadcrumbJsonLd([
            { label: 'Home', path: '/' },
            { label: 'Skills', path: '/skills' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Automotive Skills',
            about: {
              '@type': 'Person',
              name: profile.full_name,
              jobTitle: profile.headline,
              knowsAbout: (skills.data ?? []).map((skill) => skill.name),
            },
          },
        ]}
      />

      <PageHeader
        eyebrow="Automotive skills"
        title="Capability across electrical, electronic and mechanical systems"
        description="Skills are grouped by vehicle system and marked practical, developing, or technical interest. There are no invented percentage scores — the level states what has actually been done."
      />

      <Section>
        <div className="container-page">
          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            {(Object.keys(SKILL_LEVEL_COPY) as Array<keyof typeof SKILL_LEVEL_COPY>).map((level) => {
              const meta = SKILL_LEVEL_COPY[level]
              return (
                <div key={level} className="panel p-4">
                  <p className="flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-signal-300">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        level === 'practical' ? 'bg-signal-400' : level === 'developing' ? 'bg-electric-500' : 'bg-silver-600'
                      }`}
                      aria-hidden="true"
                    />
                    {meta.label}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-silver-400">{meta.description}</p>
                </div>
              )
            })}
          </div>

          {skills.error ? (
            <div className="panel border-danger-400/30 p-5 text-sm">
              <p className="font-semibold text-danger-400">Skills could not be loaded</p>
              <p className="mt-1 text-silver-400">{skills.error}</p>
              <button type="button" onClick={skills.reload} className="btn btn-ghost btn-sm mt-3">
                Try again
              </button>
            </div>
          ) : skills.loading ? (
            <SkeletonGrid count={6} />
          ) : groups.length ? (
            <SkillGroupCards skills={skills.data ?? []} />
          ) : (
            <EmptyState {...EMPTY_STATES.skills} adminHint />
          )}
        </div>
      </Section>

      <Section tone="raised">
        <div className="container-page">
          <SectionHeader
            eyebrow="By discipline"
            title="What each category covers in practice"
            description="The categories below match the systems worked on in the workshop and documented in the projects and diagnostic case studies."
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {SKILL_CATEGORIES.map((category) => {
              const meta = CATEGORY_META[category]
              const Icon = meta.icon
              const count = (skills.data ?? []).filter((skill) => skill.category === category).length
              return (
                <div key={category} className="panel p-5">
                  <span className="mb-3 inline-grid h-9 w-9 place-items-center rounded border border-line bg-ink-850 text-signal-400">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h2 className="font-display text-base font-semibold text-white">{category}</h2>
                  <p className="mt-1.5 text-xs leading-relaxed text-silver-400">{meta.blurb}</p>
                  <p className="mt-3 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-600">
                    {count} {count === 1 ? 'entry' : 'entries'}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <Callout title="How levels are assigned">
              <p>
                &ldquo;Practical&rdquo; means the task has been performed repeatedly on vehicles. &ldquo;Developing&rdquo;
                means it is being built through supervised practice and study. &ldquo;Technical interest&rdquo; means the
                area is under active study and is not presented as a delivered skill.
              </p>
            </Callout>
            <div className="panel flex flex-col justify-between p-5">
              <p className="text-sm leading-relaxed text-silver-300">
                See these skills applied in documented diagnostic work and vehicle projects.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ActionLink to="/diagnostics" size="sm" iconRight={ArrowRight}>
                  Case studies
                </ActionLink>
                <ActionLink to="/projects" variant="ghost" size="sm">
                  Projects
                </ActionLink>
              </div>
            </div>
          </div>

          <SkillLevelLegend className="mt-6" />
        </div>
      </Section>
    </>
  )
}
