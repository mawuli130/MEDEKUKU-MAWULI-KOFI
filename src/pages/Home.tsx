import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Award,
  Camera,
  CircuitBoard,
  Gauge,
  GraduationCap,
  Mail,
  PlayCircle,
  Stethoscope,
  Wrench,
} from 'lucide-react'
import { Seo, breadcrumbJsonLd, personJsonLd, websiteJsonLd } from '@/components/seo/Seo'
import { HomeHero } from '@/components/hero/HomeHero'
import { ProjectCard } from '@/components/automotive-projects/ProjectCard'
import { DiagnosticCard } from '@/components/diagnostics/DiagnosticCard'
import { VideoCard } from '@/components/youtube/VideoCard'
import { SkillGroupCards, SkillLevelLegend } from '@/components/skills/SkillGroups'
import { MediaImage } from '@/components/ui/MediaImage'
import { ActionLink, EmptyState, Section, SectionHeader, SkeletonGrid, Tag } from '@/components/ui'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useSiteData } from '@/hooks/useSiteData'
import { getRepository } from '@/services'
import { socialHref } from '@/components/layout/SocialLinks'
import { EMPTY_STATES } from '@/lib/defaults'
import { formatDate, truncate } from '@/lib/utils'

export default function Home() {
  const { profile, settings, socialLinks } = useSiteData()
  const repository = getRepository()

  const projects = useAsyncData(() => repository.projects.list(), [])
  const cases = useAsyncData(() => repository.diagnosticCases.list(), [])
  const videos = useAsyncData(() => repository.videos.list(), [])
  const gallery = useAsyncData(() => repository.gallery.list(), [])
  const certificates = useAsyncData(() => repository.certificates.list(), [])
  const skills = useAsyncData(() => repository.skills.list(), [])

  const featuredProjects = useMemo(() => {
    const all = projects.data ?? []
    const featured = all.filter((project) => project.featured)
    return (featured.length ? featured : all).slice(0, 3)
  }, [projects.data])

  const featuredCases = useMemo(() => {
    const all = cases.data ?? []
    const featured = all.filter((item) => item.featured)
    return (featured.length ? featured : all).slice(0, 2)
  }, [cases.data])

  const featuredVideos = useMemo(() => {
    const all = videos.data ?? []
    const featured = all.filter((video) => video.featured)
    return (featured.length ? featured : all).slice(0, 3)
  }, [videos.data])

  const galleryPreview = (gallery.data ?? []).slice(0, 6)
  const certificateList = (certificates.data ?? []).slice(0, 4)
  const sameAs = socialLinks
    .filter((link) => ['youtube', 'linkedin', 'facebook', 'x'].includes(link.platform))
    .map((link) => socialHref(link))
  const emailLink = socialLinks.find((link) => link.platform === 'email')
  const whatsappLink = socialLinks.find((link) => link.platform === 'whatsapp')

  const jsonLd = [
    personJsonLd({
      name: profile.full_name,
      jobTitle: profile.headline,
      city: 'Accra',
      country: 'Ghana',
      image: profile.profile_image,
      sameAs,
    }),
    websiteJsonLd(settings.site_name ?? 'Mawuli Engineering & Diagnostic Services', settings.meta_description ?? ''),
    breadcrumbJsonLd([{ label: 'Home', path: '/' }]),
  ]

  return (
    <>
      <Seo
        title={settings.meta_title || 'Medekuku Mawuli Kofi — Automotive Electronics & Diagnostic Technician'}
        description={settings.meta_description ?? ''}
        path="/"
        image={settings.og_image || profile.profile_image}
        keywords={settings.keywords}
        jsonLd={jsonLd}
      />

      <HomeHero profile={profile} />

      {/* Capability strip */}
      <section className="border-b border-line bg-ink-925/60" aria-label="Core capabilities">
        <div className="container-page grid grid-cols-2 gap-px overflow-hidden py-0 sm:grid-cols-4">
          {[
            { icon: CircuitBoard, label: 'Electrical diagnostics', detail: 'Circuits, sensors, actuators' },
            { icon: Gauge, label: 'ECU & engine management', detail: 'DTC, live data, freeze frame' },
            { icon: Stethoscope, label: 'Systematic fault finding', detail: 'Test plan before parts' },
            { icon: Wrench, label: 'Workshop repairs', detail: 'Mechanical & electrical' },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 border-line/60 px-1 py-6 sm:border-l sm:px-5 sm:first:border-l-0">
              <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-signal-400" aria-hidden="true" />
              <div>
                <p className="text-[0.8125rem] font-semibold text-silver-100">{item.label}</p>
                <p className="mt-0.5 text-[0.6875rem] leading-snug text-silver-500">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured projects */}
      <Section id="featured-projects">
        <div className="container-page">
          <SectionHeader
            eyebrow="Automotive projects"
            title="Documented work on real vehicles"
            description="Each entry records the vehicle, the complaint, the diagnostic path and the outcome — including cases where the cause was not yet confirmed."
            action={
              <ActionLink to="/projects" variant="ghost" size="sm" iconRight={ArrowRight}>
                All projects
              </ActionLink>
            }
          />
          {projects.loading ? (
            <SkeletonGrid />
          ) : featuredProjects.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} priority={index === 0} />
              ))}
            </div>
          ) : (
            <EmptyState {...EMPTY_STATES.projects} adminHint />
          )}
        </div>
      </Section>

      {/* Diagnostic case studies */}
      <Section tone="raised" id="featured-diagnostics">
        <div className="container-page">
          <SectionHeader
            eyebrow="Diagnostic case studies"
            title="How faults are actually found"
            description="Full technical reports: complaint, DTCs, test steps, measurements, confirmed fault and post-repair verification."
            action={
              <ActionLink to="/diagnostics" variant="ghost" size="sm" iconRight={ArrowRight}>
                All case studies
              </ActionLink>
            }
          />
          {cases.loading ? (
            <div className="grid gap-5 md:grid-cols-2">
              <SkeletonGrid count={2} />
            </div>
          ) : featuredCases.length ? (
            <div className="grid gap-5 md:grid-cols-2">
              {featuredCases.map((caseStudy) => (
                <DiagnosticCard key={caseStudy.id} caseStudy={caseStudy} />
              ))}
            </div>
          ) : (
            <EmptyState {...EMPTY_STATES.diagnostics} adminHint icon={Stethoscope} />
          )}
        </div>
      </Section>

      {/* YouTube */}
      <Section id="videos">
        <div className="container-page">
          <SectionHeader
            eyebrow="YouTube portfolio"
            title="Technical demonstrations"
            description="Diagnostic procedures, electrical repairs and workshop demonstrations recorded as they happen."
            action={
              <ActionLink to="/videos" variant="ghost" size="sm" iconRight={ArrowRight}>
                All videos
              </ActionLink>
            }
          />
          {videos.loading ? (
            <SkeletonGrid />
          ) : featuredVideos.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            <EmptyState {...EMPTY_STATES.videos} adminHint icon={PlayCircle} />
          )}
        </div>
      </Section>

      {/* Skills */}
      <Section tone="raised" id="skills">
        <div className="container-page">
          <SectionHeader
            eyebrow="Automotive skills"
            title="Capability, stated honestly"
            description="Skills are grouped by system and marked as practical, developing, or a technical interest — no percentage scores."
            action={
              <ActionLink to="/skills" variant="ghost" size="sm" iconRight={ArrowRight}>
                Full skills matrix
              </ActionLink>
            }
          />
          <SkillLevelLegend className="mb-5" />
          {skills.loading ? (
            <SkeletonGrid count={4} />
          ) : skills.data?.length ? (
            <SkillGroupCards skills={skills.data} compact />
          ) : (
            <EmptyState {...EMPTY_STATES.skills} compact adminHint />
          )}
        </div>
      </Section>

      {/* Gallery */}
      <Section id="gallery">
        <div className="container-page">
          <SectionHeader
            eyebrow="Workshop gallery"
            title="Workshop evidence"
            description="Photographs of diagnostics, electrical repairs, tools and workshop activity, uploaded directly from the workshop."
            action={
              <ActionLink to="/gallery" variant="ghost" size="sm" iconRight={ArrowRight}>
                Open gallery
              </ActionLink>
            }
          />
          {gallery.loading ? (
            <SkeletonGrid count={6} />
          ) : galleryPreview.length ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {galleryPreview.map((image) => (
                <Link
                  key={image.id}
                  to="/gallery"
                  className="group relative overflow-hidden rounded-md border border-line"
                  aria-label={`Gallery image: ${image.title}`}
                >
                  <MediaImage
                    src={image.image_url}
                    alt={image.alt_text}
                    ratio="4/3"
                    placeholderKind="gallery"
                    placeholderLabel="Photograph pending"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/10 to-transparent" aria-hidden="true" />
                  <span className="absolute inset-x-0 bottom-0 p-2.5">
                    <span className="block font-mono text-[0.625rem] uppercase tracking-[0.12em] text-signal-300">
                      {image.category}
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-medium text-white">{image.title}</span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState {...EMPTY_STATES.gallery} adminHint icon={Camera} />
          )}
        </div>
      </Section>

      {/* Certificates */}
      <Section tone="raised" id="certificates">
        <div className="container-page">
          <SectionHeader
            eyebrow="Certificates & achievements"
            title="Training and technical education"
            description="Verified certificates, automotive training records and engineering project achievements."
            action={
              <ActionLink to="/certificates" variant="ghost" size="sm" iconRight={ArrowRight}>
                All certificates
              </ActionLink>
            }
          />
          {certificates.loading ? (
            <SkeletonGrid count={3} />
          ) : certificateList.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {certificateList.map((certificate) => (
                <article key={certificate.id} className="panel panel-interactive flex h-full flex-col p-4">
                  <Award className="mb-3 h-5 w-5 text-signal-400" aria-hidden="true" />
                  <h3 className="font-display text-[0.9375rem] font-semibold leading-snug text-white">
                    <Link to={`/certificates/${certificate.slug}`} className="hover:text-signal-200">
                      {certificate.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-xs text-silver-400">{certificate.institution}</p>
                  <p className="mt-auto pt-3 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-600">
                    {certificate.issue_date ? formatDate(certificate.issue_date) : 'Issue date not recorded'}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState {...EMPTY_STATES.certificates} adminHint icon={GraduationCap} />
          )}
        </div>
      </Section>

      {/* Biography */}
      <Section id="biography">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-14">
            <div>
              <p className="eyebrow mb-2.5">
                <span className="h-px w-6 bg-signal-400/70" aria-hidden="true" />
                Professional biography
              </p>
              <h2 className="text-[1.75rem] leading-tight font-semibold sm:text-4xl">
                An automotive technician, not a software portfolio
              </h2>
              <p className="mt-4 text-[0.9375rem] leading-relaxed text-silver-400">
                My work centres on vehicle electrical systems, electronic control units, engine management and
                systematic fault diagnosis — the evidence on this site is drawn from the workshop.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <ActionLink to="/about" variant="secondary" size="sm" iconRight={ArrowRight}>
                  Read full profile
                </ActionLink>
                <ActionLink to="/cv" variant="ghost" size="sm">
                  View CV
                </ActionLink>
              </div>
            </div>

            <div className="panel p-5 sm:p-6">
              <p className="prose-tech text-sm sm:text-[0.9375rem]">{truncate(profile.biography, 620)}</p>
              {profile.automotive_interests.length ? (
                <div className="mt-5 border-t border-line pt-4">
                  <p className="label-tech mb-2.5">Automotive interests</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {profile.automotive_interests.map((interest) => (
                      <li key={interest}>
                        <Tag>{interest}</Tag>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </Section>

      {/* Contact */}
      <Section tone="raised" id="contact">
        <div className="container-page">
          <div className="panel relative overflow-hidden p-6 sm:p-9">
            <div className="grid-overlay pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal-400/60 to-transparent"
              aria-hidden="true"
            />
            <div className="relative grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div>
                <p className="eyebrow mb-2.5">
                  <span className="h-px w-6 bg-signal-400/70" aria-hidden="true" />
                  Contact
                </p>
                <h2 className="text-[1.625rem] leading-tight font-semibold sm:text-3xl">
                  Open to workshop roles and diagnostic work
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-silver-400 sm:text-[0.9375rem]">
                  {settings.contact_intro ||
                    'For workshop roles, diagnostic work, technical collaboration or training opportunities, send a message.'}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-500">
                  <span>{profile.location || 'Accra, Ghana'}</span>
                  {profile.email ? <span>{profile.email}</span> : null}
                </div>
              </div>
              <div className="flex flex-col gap-2.5 sm:flex-row md:flex-col">
                <ActionLink to="/contact" size="md" icon={Mail}>
                  Contact me
                </ActionLink>
                {emailLink ? (
                  <ActionLink to={socialHref(emailLink)} variant="secondary" size="md" external>
                    Email directly
                  </ActionLink>
                ) : null}
                {whatsappLink ? (
                  <ActionLink to={socialHref(whatsappLink)} variant="ghost" size="md" external>
                    WhatsApp
                  </ActionLink>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
