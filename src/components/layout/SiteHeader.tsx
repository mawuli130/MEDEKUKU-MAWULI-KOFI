import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Download, Menu, X, ArrowRight } from 'lucide-react'
import { BrandLink } from '@/components/brand/Logo'
import { PRIMARY_NAV, isActivePath } from '@/components/layout/navItems'
import { SocialLinks } from '@/components/layout/SocialLinks'
import { useSiteData } from '@/hooks/useSiteData'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const { profile, socialLinks } = useSiteData()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Desktop bar shows a compact set; the full list lives in the drawer.
  const desktopItems = PRIMARY_NAV.filter((item) =>
    ['/', '/about', '/projects', '/diagnostics', '/videos', '/skills'].includes(item.to),
  )

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header
        className={cn(
          'sticky top-0 z-50 w-full border-b transition-colors duration-300',
          scrolled || open
            ? 'border-line bg-ink-950/95 backdrop-blur-md'
            : 'border-line/50 bg-ink-950/80 backdrop-blur-sm',
        )}
      >
        <div className="container-page flex h-16 items-center justify-between gap-4 md:h-[4.5rem]">
          <BrandLink />

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-0.5">
              {desktopItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'relative block rounded px-2.5 py-2 text-[0.8125rem] font-medium transition-colors',
                        isActive ? 'text-white' : 'text-silver-400 hover:text-white',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {item.label}
                        <span
                          className={cn(
                            'absolute inset-x-2.5 -bottom-px h-0.5 rounded-full transition-opacity',
                            isActive ? 'bg-signal-400 opacity-100' : 'opacity-0',
                          )}
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
              <li className="ml-1">
                <NavLink
                  to="/gallery"
                  className={({ isActive }) =>
                    cn(
                      'block rounded px-2.5 py-2 text-[0.8125rem] font-medium transition-colors',
                      isActive ? 'text-white' : 'text-silver-400 hover:text-white',
                    )
                  }
                >
                  Gallery
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/certificates"
                  className={({ isActive }) =>
                    cn(
                      'block rounded px-2.5 py-2 text-[0.8125rem] font-medium transition-colors',
                      isActive ? 'text-white' : 'text-silver-400 hover:text-white',
                    )
                  }
                >
                  Certificates
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <SocialLinks links={socialLinks.slice(0, 3)} size="sm" />
            {profile.cv_url ? (
              <a href={profile.cv_url} download className="btn btn-ghost btn-sm" aria-label="Download CV (PDF)">
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                CV
              </a>
            ) : null}
            <Link to="/contact" className="btn btn-primary btn-sm">
              Contact
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <Link to="/contact" className="btn btn-primary btn-sm hidden sm:inline-flex">
              Contact
            </Link>
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className="grid h-10 w-10 place-items-center rounded-md border border-line bg-ink-850 text-silver-200 transition-colors hover:border-signal-400/50 hover:text-white"
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          open ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!open}
      >
        <div
          className={cn(
            'absolute inset-0 bg-ink-950/80 backdrop-blur-sm transition-opacity duration-300',
            open ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setOpen(false)}
        />
        <div
          id="mobile-nav"
          className={cn(
            'absolute inset-x-0 top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-line bg-ink-925 shadow-lift transition-transform duration-300 md:top-[4.5rem]',
            open ? 'translate-y-0' : '-translate-y-3 opacity-0',
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <nav className="container-page py-4">
            <ul className="grid gap-0.5">
              {PRIMARY_NAV.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      'flex items-center justify-between rounded-md px-3 py-2.5 text-[0.9375rem] font-medium transition-colors',
                      isActivePath(location.pathname, item.to)
                        ? 'bg-signal-400/10 text-white'
                        : 'text-silver-300 hover:bg-white/[0.03] hover:text-white',
                    )}
                  >
                    <span>{item.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-silver-600" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4">
              <Link to="/contact" className="btn btn-primary w-full justify-center">
                Contact me
              </Link>
              {profile.cv_url ? (
                <a href={profile.cv_url} download className="btn btn-secondary w-full justify-center">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download CV
                </a>
              ) : null}
              <SocialLinks links={socialLinks} showLabels className="mt-1" />
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}
