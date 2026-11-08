import { Link } from 'react-router-dom'
import { Award, Calendar, ExternalLink, FileCheck2, GraduationCap } from 'lucide-react'
import { Seo, breadcrumbJsonLd } from '@/components/seo/Seo'
import { EmptyState, PageHeader, Section, SkeletonGrid, Tag } from '@/components/ui'
import { MediaImage } from '@/components/ui/MediaImage'
import { useAsyncData } from '@/hooks/useAsyncData'
import { getRepository } from '@/services'
import { EMPTY_STATES } from '@/lib/defaults'
import { formatDate } from '@/lib/utils'

export default function Certificates() {
  const repository = getRepository()
  const certificates = useAsyncData(() => repository.certificates.list(), [])
  const list = certificates.data ?? []

  return (
    <>
      <Seo
        title="Automotive Certificates & Achievements | Medekuku Mawuli Kofi"
        description="Technical education, automotive training, workshop training and engineering project achievements of Medekuku Mawuli Kofi, Automotive Electronics & Diagnostic Technician."
        path="/certificates"
        jsonLd={[
          breadcrumbJsonLd([
            { label: 'Home', path: '/' },
            { label: 'Certificates', path: '/certificates' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Certificates and Achievements',
            description: 'Automotive technical education, training and project achievements.',
          },
        ]}
      />

      <PageHeader
        eyebrow="Certificates & achievements"
        title="Training, education and technical achievement"
        description="Only certificates and achievements that have been verified and uploaded are listed here. Nothing is claimed without documentation."
        aside={
          <Tag tone="signal">
            <Award className="h-3 w-3" aria-hidden="true" />
            {list.length} records
          </Tag>
        }
      />

      <Section>
        <div className="container-page">
          {certificates.error ? (
            <div className="panel border-danger-400/30 p-5 text-sm">
              <p className="font-semibold text-danger-400">Certificates could not be loaded</p>
              <p className="mt-1 text-silver-400">{certificates.error}</p>
              <button type="button" onClick={certificates.reload} className="btn btn-ghost btn-sm mt-3">
                Try again
              </button>
            </div>
          ) : certificates.loading ? (
            <SkeletonGrid count={3} />
          ) : list.length ? (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((certificate, index) => (
                <li key={certificate.id}>
                  <article className="panel panel-interactive flex h-full flex-col overflow-hidden">
                    <Link to={`/certificates/${certificate.slug}`} className="block" tabIndex={-1} aria-hidden="true">
                      <MediaImage
                        src={certificate.certificate_url}
                        alt={`${certificate.title} certificate issued by ${certificate.institution}`}
                        ratio="4/3"
                        loading={index < 3 ? 'eager' : 'lazy'}
                        placeholderKind="scan"
                        placeholderLabel="Certificate image pending"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-signal-300/80">
                        <GraduationCap className="h-3 w-3" aria-hidden="true" />
                        {certificate.institution}
                      </p>
                      <h2 className="font-display text-base font-semibold leading-snug text-white">
                        <Link to={`/certificates/${certificate.slug}`} className="hover:text-signal-200">
                          {certificate.title}
                        </Link>
                      </h2>
                      {certificate.description ? (
                        <p className="mt-2 flex-1 text-xs leading-relaxed text-silver-400">
                          {certificate.description}
                        </p>
                      ) : null}
                      <p className="mt-3 flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-600">
                        <Calendar className="h-3 w-3" aria-hidden="true" />
                        {certificate.issue_date ? formatDate(certificate.issue_date) : 'Issue date not recorded'}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                        <Link to={`/certificates/${certificate.slug}`} className="btn btn-ghost btn-sm">
                          <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Details
                        </Link>
                        {certificate.verification_url ? (
                          <a
                            href={certificate.verification_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-signal-300 hover:text-signal-200"
                          >
                            Verify
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState {...EMPTY_STATES.certificates} adminHint icon={Award} />
          )}
        </div>
      </Section>
    </>
  )
}
