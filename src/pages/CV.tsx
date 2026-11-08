import { Link } from 'react-router-dom'
import {
  Award,
  Briefcase,
  Download,
  FileText,
  GraduationCap,
  MapPin,
  Printer,
  Wrench,
} from 'lucide-react'
import { Seo, breadcrumbJsonLd, personJsonLd } from '@/components/seo/Seo'
import { ActionLink, Callout, EmptyState, PageHeader, Section, Tag } from '@/components/ui'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useSiteData } from '@/hooks/useSiteData'
import { getRepository } from '@/services'
import { EMPTY_STATES } from '@/lib/defaults'
import { formatDate } from '@/lib/utils'
import type { TimelineEntry } from '@/types'

const KIND_LABEL: Record<TimelineEntry['kind'], string> = {
  education: 'Education',
  workshop: 'Workshop experience',
  training: 'Training',
  project: 'Project',
  achievement: 'Achievement',
}

export default function CV() {
  const { profile, settings, socialLinks } = useSiteData()
  const repository = getRepository()

  const skills = useAsyncData(() => repository.skills.list(), [])
  const certificates = useAsyncData(() => repository.certificates.list(), [])
  const projects = useAsyncData(() => repository.projects.list(), [])

  const sameAs = socialLinks
    .filter((link) => ['youtube', 'linkedin', 'facebook', 'x'].includes(link.platform))
    .map((link) => link.url)

  return (
    <>
      <Seo
        title={`CV — ${profile.full_name}, ${profile.headline}`}
        description={`Curriculum vitae of ${profile.full_name}, ${profile.headline} in Accra, Ghana: automotive electrical diagnostics, ECU and engine management, workshop experience, technical education and certificates.`}
        path="/cv"
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
            { label: 'CV', path: '/cv' },
          ]),
        ]}
      />

      <PageHeader
        eyebrow="Curriculum vitae"
        title={settings.cv_headline || 'Automotive Electronics & Diagnostic Technician'}
        description={`${profile.full_name} · ${profile.location}`}
        aside={
          profile.cv_url ? (
            <a href={profile.cv_url} download className="btn btn-primary">
              <Download className="h-4 w-4" aria-hidden="true" />
              Download CV (PDF)
            </a>
          ) : (
            <span className="chip">PDF not uploaded</span>
          )
        }
      />

      <Section>
        <div className="container-page">
          {!profile.cv_url ? (
            <div className="mb-8">
              <EmptyState
                {...EMPTY_STATES.cv}
                compact
                adminHint
                icon={FileText}
                action={
                  <Link to="/contact" className="btn btn-ghost btn-sm">
                    Request CV by message
                  </Link>
                }
              />
            </div>
          ) : null}

          <article className="panel overflow-hidden">
            {/* CV header */}
            <header className="border-b border-line bg-ink-900 p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="font-display text-2xl font-semibold leading-tight text-white sm:text-3xl">
                    {profile.full_name}
                  </h1>
                  <p className="mt-1 text-sm text-signal-300">{profile.headline}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-silver-400">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {profile.location || 'Accra, Ghana'}
                  </p>
                  <p className="mt-1 text-xs text-silver-400">
                    {[profile.email, profile.phone].filter(Boolean).join(' · ') || 'Contact details on the contact page'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {profile.cv_url ? (
                    <a href={profile.cv_url} download className="btn btn-secondary btn-sm">
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      PDF
                    </a>
                  ) : null}
                  <button type="button" onClick={() => window.print()} className="btn btn-ghost btn-sm">
                    <Printer className="h-3.5 w-3.5" aria-hidden="true" />
                    Print
                  </button>
                </div>
              </div>
            </header>

            <div className="space-y-8 p-5 sm:p-7">
              <CvBlock title="Professional profile" icon={Briefcase}>
                <p className="prose-tech text-sm">{profile.biography}</p>
                {profile.career_goals ? (
                  <p className="prose-tech mt-3 text-sm">
                    <strong>Career objective — </strong>
                    {profile.career_goals}
                  </p>
                ) : null}
              </CvBlock>

              <CvBlock title="Automotive skills" icon={Wrench}>
                {skills.loading ? (
                  <div className="skeleton h-16 w-full" />
                ) : (skills.data ?? []).length ? (
                  <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                    {(skills.data ?? []).slice(0, 14).map((skill) => (
                      <li key={skill.id} className="flex items-baseline justify-between gap-2 border-b border-dashed border-line/60 py-1">
                        <span className="text-sm text-silver-200">{skill.name}</span>
                        <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-600">
                          {skill.skill_level}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-silver-500">Skills are published on the skills page.</p>
                )}
              </CvBlock>

              <CvBlock title="Education, experience and training" icon={GraduationCap}>
                {profile.timeline.length ? (
                  <ul className="space-y-3">
                    {profile.timeline.map((entry) => (
                      <li key={entry.id}>
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold text-white">{entry.title}</p>
                          {entry.period ? (
                            <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-500">
                              {entry.period}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-silver-400">
                          {[entry.organisation, KIND_LABEL[entry.kind]].filter(Boolean).join(' · ')}
                        </p>
                        {entry.description ? (
                          <p className="mt-1 text-xs leading-relaxed text-silver-500">{entry.description}</p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-silver-500">
                    Timeline entries are added from the dashboard and will appear here once confirmed.
                  </p>
                )}
              </CvBlock>

              <CvBlock title="Certificates and training" icon={Award}>
                {certificates.loading ? (
                  <div className="skeleton h-16 w-full" />
                ) : (certificates.data ?? []).length ? (
                  <ul className="space-y-2">
                    {(certificates.data ?? []).map((certificate) => (
                      <li key={certificate.id} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-line/60 pb-2">
                        <div>
                          <p className="text-sm text-silver-100">{certificate.title}</p>
                          <p className="text-xs text-silver-500">{certificate.institution}</p>
                        </div>
                        <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-600">
                          {certificate.issue_date ? formatDate(certificate.issue_date) : '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-silver-500">No certificates uploaded yet.</p>
                )}
              </CvBlock>

              <CvBlock title="Selected automotive projects" icon={Briefcase}>
                {projects.loading ? (
                  <div className="skeleton h-16 w-full" />
                ) : (projects.data ?? []).length ? (
                  <ul className="space-y-2">
                    {(projects.data ?? []).slice(0, 6).map((project) => (
                      <li key={project.id} className="border-b border-dashed border-line/60 pb-2">
                        <Link to={`/projects/${project.slug}`} className="text-sm text-silver-100 hover:text-signal-300">
                          {project.title}
                        </Link>
                        <p className="text-xs text-silver-500">{project.category}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-silver-500">Projects will be listed here once published.</p>
                )}
              </CvBlock>

              <div className="border-t border-line pt-5">
                <p className="text-xs leading-relaxed text-silver-600">
                  This CV is also available as a downloadable PDF. All statements reflect confirmed experience and
                  training only.
                </p>
              </div>
            </div>
          </article>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Callout title="Printing">
              Use <strong>Print / Save as PDF</strong> in your browser to produce a copy of this page. The uploaded PDF
              version, when present, is the authoritative document.
            </Callout>
            <div className="panel flex flex-col justify-between p-5">
              <p className="text-sm leading-relaxed text-silver-300">
                For employment enquiries, attach the PDF CV or use the contact form.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ActionLink to="/contact" size="sm">
                  Contact
                </ActionLink>
                <ActionLink to="/certificates" variant="ghost" size="sm">
                  Certificates
                </ActionLink>
              </div>
            </div>
          </div>

          <p className="mt-6 flex flex-wrap items-center gap-2 text-xs text-silver-600">
            <Tag>Public download</Tag>
            The CV PDF is publicly downloadable without an administrator login.
          </p>
        </div>
      </Section>
    </>
  )
}

function CvBlock({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: typeof Award
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 border-b border-line pb-2 font-display text-sm font-semibold uppercase tracking-[0.12em] text-white">
        <Icon className="h-4 w-4 text-signal-400" aria-hidden="true" />
        {title}
      </h2>
      {children}
    </section>
  )
}
