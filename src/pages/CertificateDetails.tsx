import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, ExternalLink, FileText, GraduationCap, Award } from 'lucide-react'
import { Seo, breadcrumbJsonLd } from '@/components/seo/Seo'
import { Breadcrumbs, EmptyState, Section, Tag } from '@/components/ui'
import { MediaImage } from '@/components/ui/MediaImage'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useSiteData } from '@/hooks/useSiteData'
import { getRepository } from '@/services'
import { formatDate } from '@/lib/utils'

export default function CertificateDetails() {
  const { slug = '' } = useParams()
  const { profile } = useSiteData()
  const repository = getRepository()
  const record = useAsyncData(() => repository.certificates.getBySlug(slug), [slug])
  const certificate = record.data

  if (record.loading) {
    return (
      <div className="container-page py-16" aria-busy="true">
        <div className="skeleton mb-4 h-4 w-40" />
        <div className="skeleton mb-6 h-9 w-2/3" />
        <div className="skeleton h-72 w-full" />
      </div>
    )
  }

  if (!certificate) {
    return (
      <>
        <Seo
          title="Certificate not found — Medekuku Mawuli Kofi"
          description="This certificate could not be found."
          path={`/certificates/${slug}`}
          noindex
        />
        <Section>
          <div className="container-page max-w-2xl">
            <EmptyState
              title="Certificate not found"
              body="This record may have been removed or the link is incorrect."
              icon={Award}
              action={
                <Link to="/certificates" className="btn btn-primary">
                  All certificates
                </Link>
              }
            />
          </div>
        </Section>
      </>
    )
  }

  const path = `/certificates/${certificate.slug}`

  return (
    <>
      <Seo
        title={`${certificate.title} — ${certificate.institution} | ${profile.full_name}`}
        description={
          certificate.description ||
          `${certificate.title} issued by ${certificate.institution}${certificate.issue_date ? ` on ${formatDate(certificate.issue_date)}` : ''}.`
        }
        path={path}
        type="article"
        image={certificate.certificate_url}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'EducationalOccupationalCredential',
            name: certificate.title,
            credentialCategory: 'certificate',
            description: certificate.description || undefined,
            recognizedBy: { '@type': 'Organization', name: certificate.institution },
            ...(certificate.issue_date ? { dateCreated: certificate.issue_date } : {}),
            ...(certificate.verification_url ? { url: certificate.verification_url } : {}),
            ...(certificate.certificate_url ? { image: certificate.certificate_url } : {}),
          },
          breadcrumbJsonLd([
            { label: 'Home', path: '/' },
            { label: 'Certificates', path: '/certificates' },
            { label: certificate.title, path },
          ]),
        ]}
      />

      <Section>
        <div className="container-page">
          <Breadcrumbs
            crumbs={[
              { label: 'Home', path: '/' },
              { label: 'Certificates', path: '/certificates' },
              { label: certificate.title },
            ]}
          />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-11">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {certificate.featured ? <Tag tone="signal">Featured</Tag> : null}
                <Tag>Automotive training record</Tag>
              </div>
              <h1 className="mt-3 text-[1.875rem] leading-tight font-semibold sm:text-[2.25rem]">
                {certificate.title}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-silver-300">
                <GraduationCap className="h-4 w-4 text-signal-400" aria-hidden="true" />
                {certificate.institution}
              </p>
              <p className="mt-1 flex items-center gap-2 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-500">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                {certificate.issue_date ? formatDate(certificate.issue_date) : 'Issue date not recorded'}
              </p>

              {certificate.description ? (
                <p className="prose-tech mt-5 whitespace-pre-line text-sm sm:text-[0.9375rem]">
                  {certificate.description}
                </p>
              ) : null}

              <MediaImage
                src={certificate.certificate_url}
                alt={`${certificate.title} certificate issued by ${certificate.institution}`}
                ratio="4/3"
                priority
                placeholderLabel="Certificate image pending upload"
                className="mt-6 rounded-lg border border-line"
              />

              <div className="mt-6 flex flex-wrap gap-2.5 border-t border-line pt-5">
                <Link to="/certificates" className="btn btn-ghost btn-sm">
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  All certificates
                </Link>
                {certificate.certificate_url ? (
                  <a
                    href={certificate.certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    Open document
                  </a>
                ) : null}
                {certificate.verification_url ? (
                  <a
                    href={certificate.verification_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Verification link
                  </a>
                ) : null}
              </div>
            </div>

            <aside className="space-y-4">
              <div className="panel p-4">
                <h2 className="label-tech mb-3">Certificate record</h2>
                <dl className="space-y-2 text-xs">
                  <Row label="Institution" value={certificate.institution} />
                  <Row label="Issued" value={certificate.issue_date ? formatDate(certificate.issue_date) : '—'} />
                  <Row label="Document" value={certificate.certificate_url ? 'Uploaded' : 'Not uploaded'} />
                  <Row label="Verification" value={certificate.verification_url ? 'External link' : 'Not provided'} />
                </dl>
              </div>
              <p className="text-xs leading-relaxed text-silver-600">
                Certificate images are stored in Supabase Storage and can only be added by the authenticated
                administrator.
              </p>
            </aside>
          </div>
        </div>
      </Section>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-dashed border-line/60 pb-2 last:border-0 last:pb-0">
      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-600">{label}</dt>
      <dd className="text-right text-silver-200">{value}</dd>
    </div>
  )
}
