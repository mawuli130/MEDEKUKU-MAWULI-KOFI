import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Building2,
  Calendar,
  Download,
  GraduationCap,
  MapPin,
  Target,
  Wrench,
} from 'lucide-react'
import { Seo, breadcrumbJsonLd, personJsonLd } from '@/components/seo/Seo'
import { PageHeader, EmptyState, Section, SectionHeader, Tag, ActionLink } from '@/components/ui'
import { PortraitImage } from '@/components/ui/MediaImage'
import { useSiteData } from '@/hooks/useSiteData'
import { socialHref } from '@/components/layout/SocialLinks'
import { EMPTY_STATES } from '@/lib/defaults'
import type { TimelineEntry } from '@/types'

const KIND_META: Record<TimelineEntry['kind'], { label: string; icon: typeof GraduationCap }> = {
  education: { label: 'Technical education', icon: GraduationCap },
  workshop: { label: 'Workshop experience', icon: Wrench },
  training: { label: 'Automotive training', icon: BookOpen },
  project: { label: 'Engineering project', icon: Building2 },
  achievement: { label: 'Professional achievement', icon: Target },
}

export default function About() {
  const { profile, settings, socialLinks } = useSiteData()
  const sameAs = socialLinks
    .filter((link) => ['youtube', 'linkedin', 'facebook', 'x'].includes(link.platform))
    .map((link) => socialHref(link))

  const timeline = [...profile.timeline]

  return (
    <>
      <Seo
        title={`About ${profile.full_name} — Automotive Diagnostics Technician`}
        description={`Professional profile of ${profile.full_name}, ${profile.headline} in ${profile.location}. Technical education, workshop experience, automotive interests and career direction.`}
        path="/about"
        type="profile"
        image={profile.profile_image}
        jsonLd={[
          personJsonLd({
            name: profile.full_name,
            jobTitle: profile.headline,
            city: 'Accra',
            country: 'Ghana',
            image: profile.profile_image,
            sameAs,
          }),
          breadcrumbJsonLd([
            { label: 'Home', path: '/' },
            { label: 'About Me', path: '/about' },
          ]),
        ]}
      />

      <PageHeader
        eyebrow="About me"
        title="Automotive electronics, diagnostics and workshop practice"
        description={profile.biography}
        aside={
          profile.cv_url ? (
            <a href={profile.cv_url} download className="btn btn-secondary">
              <Download className="h-4 w-4" aria-hidden="true" />
              Download CV
            </a>
          ) : (
            <ActionLink to="/cv" variant="ghost">
              <Download className="h-4 w-4" aria-hidden="true" />
              CV page
            </ActionLink>
          )
        }
      />

      <Section>
        <div className="container-page grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-14">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <PortraitImage
              src={profile.profile_image}
              alt={`${profile.full_name} — ${profile.headline}`}
              name={profile.full_name}
              className="aspect-[4/5] w-full max-w-sm"
              priority
            />
            <dl className="mt-5 space-y-2.5">
              <div className="flex items-center gap-2.5 text-sm text-silver-300">
                <MapPin className="h-4 w-4 shrink-0 text-signal-500" aria-hidden="true" />
                <dd>{profile.location || 'Accra, Ghana'}</dd>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-silver-300">
                <Wrench className="h-4 w-4 shrink-0 text-signal-500" aria-hidden="true" />
                <dd>{profile.headline}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-10">
            <div>
              <h2 className="text-2xl font-semibold sm:text-[1.75rem]">Professional profile</h2>
              <p className="prose-tech mt-4 text-sm sm:text-[0.9375rem]">
                {profile.hero_intro ||
                  'I specialize in automotive electrical and electronic systems, vehicle diagnostics, ECU-related troubleshooting, and practical workshop repairs.'}
              </p>
              <p className="prose-tech mt-4 text-sm sm:text-[0.9375rem]">{profile.biography}</p>
            </div>

            <div className="panel p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Target className="h-4 w-4 text-signal-400" aria-hidden="true" />
                Career goals
              </h2>
              <p className="prose-tech mt-3 text-sm">
                {profile.career_goals ||
                  'Career objectives have not been published yet. They are added from the administrator dashboard.'}
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold sm:text-[1.75rem]">Automotive interests</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {profile.automotive_interests.length ? (
                  profile.automotive_interests.map((interest) => (
                    <li
                      key={interest}
                      className="flex items-center gap-2.5 rounded border border-line bg-ink-900 px-3 py-2.5 text-sm text-silver-200"
                    >
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal-400" aria-hidden="true" />
                      {interest}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-silver-500">No interests listed yet.</li>
                )}
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-semibold sm:text-[1.75rem]">Professional development</h2>
              <p className="prose-tech mt-3 text-sm">
                Technical learning is documented through the projects and diagnostic case studies published on this
                site. Skills are marked as practical, developing or a technical interest on the{' '}
                <Link to="/skills" className="text-signal-300 underline underline-offset-2">
                  skills page
                </Link>{' '}
                so that the current level is always clear.
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="raised" id="timeline">
        <div className="container-page">
          <SectionHeader
            eyebrow="Professional timeline"
            title="Education, workshop experience and training"
            description="Only confirmed entries are listed. Dates and organisations are added directly by the technician."
          />

          {timeline.length ? (
            <ol className="relative space-y-5 border-l border-line pl-5 sm:pl-7">
              {timeline.map((entry) => {
                const meta = KIND_META[entry.kind] ?? KIND_META.project
                const Icon = meta.icon
                return (
                  <li key={entry.id} className="relative">
                    <span
                      className="absolute -left-[2.05rem] top-1.5 grid h-6 w-6 place-items-center rounded-full border border-line bg-ink-900 text-signal-400 sm:-left-[2.55rem]"
                      aria-hidden="true"
                    >
                      <Icon className="h-3 w-3" />
                    </span>
                    <div className="panel p-4 sm:p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag tone="signal">{meta.label}</Tag>
                        {entry.period ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-500">
                            <Calendar className="h-3 w-3" aria-hidden="true" />
                            {entry.period}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-2 font-display text-base font-semibold text-white">{entry.title}</h3>
                      {entry.organisation ? (
                        <p className="mt-0.5 text-sm text-silver-400">{entry.organisation}</p>
                      ) : null}
                      {entry.description ? (
                        <p className="mt-2 text-[0.8125rem] leading-relaxed text-silver-400">{entry.description}</p>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>
          ) : (
            <EmptyState {...EMPTY_STATES.timeline} adminHint />
          )}

          <div className="mt-8 flex flex-wrap gap-2.5">
            <ActionLink to="/projects" variant="secondary" size="sm" iconRight={ArrowRight}>
              Explore automotive projects
            </ActionLink>
            <ActionLink to="/certificates" variant="ghost" size="sm">
              Certificates & achievements
            </ActionLink>
            <ActionLink to="/contact" variant="ghost" size="sm">
              Contact
            </ActionLink>
          </div>
        </div>
      </Section>

      {settings.footer_note ? (
        <Section tone="flush">
          <div className="container-page py-8">
            <p className="text-center text-xs text-silver-600">{settings.footer_note}</p>
          </div>
        </Section>
      ) : null}
    </>
  )
}
