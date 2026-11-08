import { useMemo } from 'react'
import { SKILL_CATEGORIES, type Skill, type SkillCategory } from '@/types'
import { SKILL_LEVEL_COPY } from '@/lib/defaults'
import { cn } from '@/lib/utils'
import { Tag } from '@/components/ui'

const CATEGORY_ICONS: Record<SkillCategory, string> = {
  'Automotive Electrical Systems': '12V systems',
  'Automotive Electronics': 'Control modules',
  'Vehicle Diagnostics': 'Fault finding',
  'Mechanical Skills': 'Workshop',
  'Advanced Technical Interests': 'Development',
}

export function groupSkills(skills: Skill[]): Array<{ category: SkillCategory; items: Skill[] }> {
  return SKILL_CATEGORIES.map((category) => ({
    category,
    items: skills
      .filter((skill) => skill.category === category)
      .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name)),
  })).filter((group) => group.items.length > 0)
}

export function SkillLevelLegend({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {(Object.keys(SKILL_LEVEL_COPY) as Array<keyof typeof SKILL_LEVEL_COPY>).map((level) => {
        const meta = SKILL_LEVEL_COPY[level]
        return (
          <Tag key={level} tone={level === 'practical' ? 'signal' : 'neutral'}>
            {meta.label}
          </Tag>
        )
      })}
    </div>
  )
}

export function SkillGroupCards({ skills, compact = false }: { skills: Skill[]; compact?: boolean }) {
  const groups = useMemo(() => groupSkills(skills), [skills])

  return (
    <div className={cn('grid gap-5', compact ? 'sm:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3')}>
      {groups.map((group) => (
        <section key={group.category} className="panel p-5" aria-labelledby={`skill-${group.category}`}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-signal-300/80">
                {CATEGORY_ICONS[group.category]}
              </p>
              <h3 id={`skill-${group.category}`} className="mt-1 font-display text-base font-semibold text-white">
                {group.category}
              </h3>
            </div>
            <span className="font-mono text-[0.625rem] text-silver-600">{group.items.length}</span>
          </div>
          <ul className="space-y-2.5">
            {group.items.map((skill) => {
              const meta = SKILL_LEVEL_COPY[skill.skill_level]
              return (
                <li key={skill.id} className="group/skill">
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                        skill.skill_level === 'practical'
                          ? 'bg-signal-400'
                          : skill.skill_level === 'developing'
                            ? 'bg-electric-500'
                            : 'bg-silver-600',
                      )}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                        <p className="text-[0.8125rem] font-medium text-silver-100">{skill.name}</p>
                        <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-600">
                          {meta.label}
                        </span>
                      </div>
                      {skill.description && !compact ? (
                        <p className="mt-0.5 text-xs leading-relaxed text-silver-500">{skill.description}</p>
                      ) : null}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
