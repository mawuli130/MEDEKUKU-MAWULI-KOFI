import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Award,
  Briefcase,
  Camera,
  ExternalLink,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Share2,
  Sparkles,
  User,
  Video,
  X,
  Activity,
} from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'
import { useAuth } from '@/hooks/useAuth'
import { useSiteData } from '@/hooks/useSiteData'
import { cn } from '@/lib/utils'
import { DATA_SOURCE } from '@/lib/config'

export interface AdminNavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

export const ADMIN_NAV: Array<{ group: string; items: AdminNavItem[] }> = [
  {
    group: 'Overview',
    items: [{ to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    group: 'Portfolio content',
    items: [
      { to: '/admin/projects', label: 'Automotive Projects', icon: Briefcase },
      { to: '/admin/diagnostics', label: 'Diagnostic Cases', icon: Activity },
      { to: '/admin/videos', label: 'YouTube Videos', icon: Video },
      { to: '/admin/gallery', label: 'Workshop Gallery', icon: Camera },
      { to: '/admin/certificates', label: 'Certificates', icon: Award },
      { to: '/admin/skills', label: 'Automotive Skills', icon: Sparkles },
    ],
  },
  {
    group: 'Profile & documents',
    items: [
      { to: '/admin/profile', label: 'Profile Management', icon: User },
      { to: '/admin/about', label: 'About Me', icon: GraduationCap },
      { to: '/admin/cv', label: 'CV Management', icon: FileText },
    ],
  },
  {
    group: 'Communication',
    items: [{ to: '/admin/messages', label: 'Contact Messages', icon: Mail }],
  },
  {
    group: 'Website',
    items: [
      { to: '/admin/seo', label: 'SEO Settings', icon: Search },
      { to: '/admin/social', label: 'Social Links', icon: Share2 },
      { to: '/admin/settings', label: 'Website Settings', icon: Settings },
    ],
  },
]

export function AdminLayout() {
  const { email, signOut } = useAuth()
  const { profile } = useSiteData()
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/admin', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-ink-950">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-line bg-ink-925/95 backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="grid h-9 w-9 place-items-center rounded border border-line text-silver-300 lg:hidden"
            aria-label={open ? 'Close admin navigation' : 'Open admin navigation'}
            aria-expanded={open}
          >
            {open ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
          </button>

          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-display text-sm font-semibold uppercase tracking-[0.13em] text-white">
                Mawuli Admin
              </span>
              <span className="mt-0.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-silver-500">
                Content management
              </span>
            </span>
          </Link>

          <span
            className={cn(
              'ml-2 hidden rounded-full border px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.1em] sm:inline-block',
              DATA_SOURCE === 'supabase'
                ? 'border-ok-400/40 text-ok-400'
                : 'border-warn-400/40 text-warn-400',
            )}
          >
            {DATA_SOURCE === 'supabase' ? 'Supabase live' : 'Local preview'}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Link to="/" target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">View site</span>
            </Link>
            <span className="hidden max-w-[12rem] truncate font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-500 md:inline">
              {email}
            </span>
            <button type="button" onClick={handleSignOut} className="btn btn-ghost btn-sm" aria-label="Sign out">
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-14 left-0 z-30 w-64 overflow-y-auto border-r border-line bg-ink-925 px-3 py-4 transition-transform lg:sticky lg:top-14 lg:h-[calc(100dvh-3.5rem)] lg:translate-x-0',
            open ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <nav aria-label="Administrator sections">
            {ADMIN_NAV.map((group) => (
              <div key={group.group} className="mb-4">
                <p className="mb-1.5 px-2 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-silver-600">
                  {group.group}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        onClick={() => setOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'flex items-center gap-2.5 rounded px-2 py-2 text-[0.8125rem] transition-colors',
                            isActive
                              ? 'bg-signal-400/10 text-white'
                              : 'text-silver-400 hover:bg-white/[0.03] hover:text-white',
                          )
                        }
                      >
                        <item.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-2 rounded border border-line bg-ink-900 p-3">
            <p className="flex items-center gap-1.5 text-[0.6875rem] font-medium text-silver-300">
              <User className="h-3 w-3" aria-hidden="true" />
              {profile.full_name}
            </p>
            <p className="mt-0.5 text-[0.625rem] text-silver-500">{profile.headline}</p>
            <Link to="/admin/profile" className="mt-2 inline-block text-[0.625rem] text-signal-300 hover:underline">
              Edit public profile
            </Link>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded border border-line/70 p-2.5 text-[0.625rem] leading-relaxed text-silver-600">
            <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            <p>
              Changes publish immediately. Public pages update without a redeploy.
            </p>
          </div>
        </aside>

        {open ? (
          <div
            className="fixed inset-0 z-20 bg-ink-950/70 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
        ) : null}

        {/* Content */}
        <main className="min-w-0 flex-1 px-3 py-5 sm:px-5 lg:px-7" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
