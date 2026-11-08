import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  Briefcase,
  Camera,
  Database,
  FileText,
  Mail,
  RefreshCw,
  Share2,
  Sparkles,
  Video,
} from 'lucide-react'
import { getRepository } from '@/services'
import { DATA_SOURCE } from '@/lib/config'
import { useSiteData } from '@/hooks/useSiteData'
import { relativeTime } from '@/lib/utils'
import type { ContactMessage, DashboardCounts } from '@/types'
import { AdminCard, PageTitle } from '@/components/admin/AdminTable'
import { Spinner } from '@/components/ui'

const EMPTY_COUNTS: DashboardCounts = {
  projects: 0,
  diagnosticCases: 0,
  videos: 0,
  galleryImages: 0,
  certificates: 0,
  contactMessages: 0,
  newMessages: 0,
}

export default function Overview() {
  const repository = getRepository()
  const { profile, settings, socialLinks, refresh } = useSiteData()
  const [counts, setCounts] = useState<DashboardCounts>(EMPTY_COUNTS)
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [projects, cases, videos, gallery, certificates, allMessages] = await Promise.all([
        repository.projects.list({ includeDrafts: true }),
        repository.diagnosticCases.list({ includeDrafts: true }),
        repository.videos.list({ includeDrafts: true }),
        repository.gallery.list(),
        repository.certificates.list(),
        repository.messages.list(),
      ])
      setMessages(allMessages.slice(0, 5))
      setCounts({
        projects: projects.length,
        diagnosticCases: cases.length,
        videos: videos.length,
        galleryImages: gallery.length,
        certificates: certificates.length,
        contactMessages: allMessages.length,
        newMessages: allMessages.filter((message) => message.status === 'new').length,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Dashboard data could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cards = [
    { label: 'Automotive projects', value: counts.projects, to: '/admin/projects', icon: Briefcase },
    { label: 'Diagnostic case studies', value: counts.diagnosticCases, to: '/admin/diagnostics', icon: Activity },
    { label: 'YouTube videos', value: counts.videos, to: '/admin/videos', icon: Video },
    { label: 'Gallery images', value: counts.galleryImages, to: '/admin/gallery', icon: Camera },
    { label: 'Certificates', value: counts.certificates, to: '/admin/certificates', icon: Award },
    { label: 'Contact messages', value: counts.contactMessages, to: '/admin/messages', icon: Mail },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Dashboard"
        description={`Signed in as administrator for ${profile.full_name}. Content changes publish to the public portfolio immediately.`}
        action={
          <button type="button" onClick={() => void load()} className="btn btn-ghost btn-sm" disabled={loading}>
            {loading ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
            Refresh
          </button>
        }
      />

      {error ? (
        <div className="mb-4 flex items-start gap-2 rounded border border-danger-400/40 bg-danger-400/[0.08] p-3 text-xs text-danger-400">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Data could not be loaded</p>
            <p className="mt-0.5 text-silver-300">{error}</p>
            <p className="mt-1 text-silver-500">
              If you are using Supabase, confirm the migration has been applied and that this account exists in{' '}
              <code className="font-mono">admin_users</code>.
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="group rounded border border-line bg-ink-925 p-4 transition-colors hover:border-signal-400/40"
          >
            <div className="flex items-start justify-between">
              <card.icon className="h-4 w-4 text-signal-400" aria-hidden="true" />
              <ArrowRight className="h-3.5 w-3.5 text-silver-600 transition-transform group-hover:translate-x-0.5 group-hover:text-signal-300" aria-hidden="true" />
            </div>
            <p className="mt-3 font-display text-2xl font-semibold text-white">
              {loading ? <span className="skeleton inline-block h-6 w-8 align-middle" /> : card.value}
            </p>
            <p className="mt-0.5 text-[0.6875rem] uppercase tracking-[0.08em] text-silver-500">{card.label}</p>
          </Link>
        ))}
      </div>

      {counts.newMessages > 0 ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded border border-signal-400/40 bg-signal-400/[0.07] px-4 py-3">
          <p className="text-xs text-signal-200">
            {counts.newMessages} new contact {counts.newMessages === 1 ? 'message' : 'messages'} awaiting review.
          </p>
          <Link to="/admin/messages" className="btn btn-primary btn-sm">
            Open inbox
          </Link>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <AdminCard>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.1em] text-white">
              Recent messages
            </h2>
            <Link to="/admin/messages" className="text-[0.6875rem] text-signal-300 hover:underline">
              All messages
            </Link>
          </div>
          {loading ? (
            <p className="text-xs text-silver-500">Loading…</p>
          ) : messages.length ? (
            <ul className="space-y-2">
              {messages.map((message) => (
                <li key={message.id} className="rounded border border-line bg-ink-950/50 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-medium text-silver-100">{message.subject}</p>
                    <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-600">
                      {relativeTime(message.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[0.6875rem] text-silver-500">
                    {message.name} · {message.email}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-silver-500">No contact messages yet.</p>
          )}
        </AdminCard>

        <div className="space-y-4">
          <AdminCard>
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.1em] text-white">
              Site status
            </h2>
            <dl className="space-y-2 text-xs">
              <Row label="Data source" value={DATA_SOURCE === 'supabase' ? 'Supabase (PostgreSQL + RLS)' : 'Local preview storage'} />
              <Row label="Public name" value={profile.full_name} />
              <Row label="Headline" value={profile.headline} />
              <Row label="Portrait" value={profile.profile_image ? 'Uploaded' : 'Not uploaded'} />
              <Row label="CV PDF" value={profile.cv_url ? 'Uploaded' : 'Not uploaded'} />
              <Row label="Social links" value={`${socialLinks.length} configured`} />
              <Row label="Meta title" value={settings.meta_title ? 'Configured' : 'Missing'} />
            </dl>
            <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
              <Link to="/admin/profile" className="btn btn-ghost btn-sm">
                <FileText className="h-3 w-3" aria-hidden="true" />
                Profile
              </Link>
              <Link to="/admin/seo" className="btn btn-ghost btn-sm">
                SEO
              </Link>
              <Link to="/admin/social" className="btn btn-ghost btn-sm">
                <Share2 className="h-3 w-3" aria-hidden="true" />
                Social
              </Link>
            </div>
          </AdminCard>

          {DATA_SOURCE === 'local' ? (
            <AdminCard className="border-warn-400/35 bg-warn-400/[0.05]">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-warn-400">
                <Database className="h-3.5 w-3.5" aria-hidden="true" />
                Local preview mode
              </p>
              <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-silver-400">
                Supabase environment variables are not configured, so content is stored in this browser only. Apply
                the SQL migration and set <code className="font-mono text-silver-200">VITE_SUPABASE_URL</code> /{' '}
                <code className="font-mono text-silver-200">VITE_SUPABASE_ANON_KEY</code> to enable the live database.
              </p>
            </AdminCard>
          ) : (
            <AdminCard className="border-ok-400/30 bg-ok-400/[0.04]">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-ok-400">
                <Database className="h-3.5 w-3.5" aria-hidden="true" />
                Supabase connected
              </p>
              <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-silver-400">
                Public reads are limited to published rows by Row Level Security. Writes require membership of the
                admin_users table.
              </p>
            </AdminCard>
          )}

          <AdminCard>
            <p className="text-[0.6875rem] leading-relaxed text-silver-500">
              <Sparkles className="mr-1 inline h-3 w-3 text-signal-400" aria-hidden="true" />
              New featured projects, videos and case studies appear on the homepage automatically.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Link to="/admin/projects" className="btn btn-secondary btn-sm">
                Add project
              </Link>
              <Link to="/admin/diagnostics" className="btn btn-secondary btn-sm">
                Add case study
              </Link>
            </div>
          </AdminCard>
        </div>
      </div>

      <p className="mt-6 flex items-center gap-1.5 text-[0.625rem] text-silver-600">
        <RefreshCw className="h-3 w-3" aria-hidden="true" />
        Profile settings refreshed at {relativeTime(profile.updated_at ?? profile.created_at)}
        <button type="button" onClick={refresh} className="ml-1 text-signal-300 hover:underline">
          Reload shared content
        </button>
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-line/60 pb-1.5 last:border-0">
      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-600">{label}</dt>
      <dd className="max-w-[60%] truncate text-right text-silver-200">{value}</dd>
    </div>
  )
}
