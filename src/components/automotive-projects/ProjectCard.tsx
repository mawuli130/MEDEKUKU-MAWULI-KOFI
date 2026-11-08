import { Link } from 'react-router-dom'
import { ArrowUpRight, Wrench, Zap } from 'lucide-react'
import { MediaImage } from '@/components/ui/MediaImage'
import { Tag } from '@/components/ui'
import { truncate, vehicleLabel } from '@/lib/utils'
import type { Project } from '@/types'

export function ProjectCard({ project, priority = false }: { project: Project; priority?: boolean }) {
  const vehicle = vehicleLabel(project)

  return (
    <article className="panel panel-interactive group flex h-full flex-col overflow-hidden">
      <Link
        to={`/projects/${project.slug}`}
        className="relative block focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-signal-400"
        aria-label={`View project: ${project.title}`}
      >
        <MediaImage
          src={project.cover_image}
          alt={`${project.title}${vehicle ? ` — ${vehicle}` : ''} automotive project`}
          ratio="16/10"
          priority={priority}
          placeholderKind="generic"
          placeholderLabel="Project photograph pending"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {project.featured ? <Tag tone="signal">Featured</Tag> : null}
        </div>
        <span
          className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-ink-950/80 text-silver-200 opacity-0 backdrop-blur transition-all duration-200 group-hover:opacity-100"
          aria-hidden="true"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="mb-2 font-mono text-[0.625rem] uppercase tracking-[0.13em] text-signal-300/90">
          {project.category}
        </p>
        <h3 className="font-display text-[1.1875rem] font-semibold leading-snug text-white">
          <Link to={`/projects/${project.slug}`} className="transition-colors hover:text-signal-200">
            {project.title}
          </Link>
        </h3>

        {vehicle ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-silver-400">
            <Wrench className="h-3 w-3 shrink-0 text-silver-600" aria-hidden="true" />
            {vehicle}
          </p>
        ) : null}
        {project.vehicle_system ? (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-silver-500">
            <Zap className="h-3 w-3 shrink-0 text-silver-600" aria-hidden="true" />
            {project.vehicle_system}
          </p>
        ) : null}

        <p className="mt-3 flex-1 text-[0.8125rem] leading-relaxed text-silver-400">
          {truncate(project.description, 150)}
        </p>

        <Link
          to={`/projects/${project.slug}`}
          className="mt-4 inline-flex items-center gap-1.5 self-start text-xs font-semibold uppercase tracking-[0.09em] text-signal-300 transition-colors hover:text-signal-200"
        >
          View project
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
