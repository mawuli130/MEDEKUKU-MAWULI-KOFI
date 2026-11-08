import { Link } from 'react-router-dom'
import { Download, Mail, MapPin, ShieldCheck } from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'
import { SocialLinks } from '@/components/layout/SocialLinks'
import { PRIMARY_NAV } from '@/components/layout/navItems'
import { useSiteData } from '@/hooks/useSiteData'
import { CONTACT } from '@/lib/config'

export function SiteFooter() {
  const { profile, settings, socialLinks } = useSiteData()
  const year = new Date().getFullYear()
  const emailLink = profile.email ? `mailto:${profile.email}` : null

  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink-925">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal-400/40 to-transparent"
        aria-hidden="true"
      />
      <div className="container-page py-12 md:py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr] md:gap-8">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark className="h-11 w-11" />
              <div>
                <p className="font-display text-base font-semibold uppercase tracking-[0.14em] text-white">
                  Mawuli
                </p>
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-silver-500">
                  Engineering &amp; Diagnostics
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-silver-400">
              {settings.site_tagline || 'Automotive electronics, vehicle diagnostics and practical workshop repairs.'}
            </p>
            <dl className="mt-5 space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5 text-silver-300">
                <MapPin className="h-4 w-4 shrink-0 text-signal-500" aria-hidden="true" />
                <dd>
                  {profile.location || `${CONTACT.city}, ${CONTACT.country}`}
                </dd>
              </div>
              {emailLink ? (
                <div className="flex items-center gap-2.5 text-silver-300">
                  <Mail className="h-4 w-4 shrink-0 text-signal-500" aria-hidden="true" />
                  <dd>
                    <a href={emailLink} className="transition-colors hover:text-white">
                      {profile.email}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
            <SocialLinks links={socialLinks} className="mt-5" />
          </div>

          <nav aria-label="Footer">
            <h2 className="label-tech mb-3.5">Portfolio</h2>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 md:grid-cols-1">
              {PRIMARY_NAV.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className="text-[0.8125rem] text-silver-400 transition-colors hover:text-signal-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="label-tech mb-3.5">Professional</h2>
            <ul className="space-y-1.5 text-[0.8125rem]">
              <li>
                <Link to="/cv" className="inline-flex items-center gap-1.5 text-silver-400 transition-colors hover:text-signal-300">
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
                  Curriculum Vitae
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-silver-400 transition-colors hover:text-signal-300">
                  Contact &amp; opportunities
                </Link>
              </li>
              <li>
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 text-silver-500 transition-colors hover:text-signal-300"
                >
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Administrator
                </Link>
              </li>
            </ul>
            <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-silver-600">
              All projects, diagnostic reports and photographs are published with the owner&apos;s authorisation.
              Unverified findings are labelled as such.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-xs text-silver-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.canonical_name || CONTACT.name}. {settings.footer_note || 'All rights reserved.'}
          </p>
          <p className="font-mono uppercase tracking-[0.12em]">
            {profile.headline || CONTACT.role} · {CONTACT.city}, {CONTACT.country}
          </p>
        </div>
      </div>
    </footer>
  )
}
