import { Link } from 'react-router-dom'
import { ArrowRight, Home, Search, Stethoscope, Wrench } from 'lucide-react'
import { Seo } from '@/components/seo/Seo'
import { Section } from '@/components/ui'

export default function NotFound() {
  return (
    <>
      <Seo
        title="Page not found — Medekuku Mawuli Kofi"
        description="The page you requested could not be found. Browse automotive projects, diagnostic case studies and the video portfolio."
        path="/404"
        noindex
      />
      <Section>
        <div className="container-page">
          <div className="relative mx-auto max-w-2xl overflow-hidden rounded-lg border border-line bg-ink-900 p-8 text-center sm:p-12">
            <div className="grid-overlay pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal-400/60 to-transparent"
              aria-hidden="true"
            />
            <p className="relative font-mono text-[0.625rem] uppercase tracking-[0.22em] text-signal-300">
              Error 404 · Signal not found
            </p>
            <h1 className="relative mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              This circuit is open
            </h1>
            <p className="relative mx-auto mt-4 max-w-md text-sm leading-relaxed text-silver-400">
              The page you requested does not exist, has been unpublished, or the link is incorrect. Use the routes
              below to continue.
            </p>

            <div className="relative mt-7 flex flex-wrap justify-center gap-2.5">
              <Link to="/" className="btn btn-primary">
                <Home className="h-4 w-4" aria-hidden="true" />
                Homepage
              </Link>
              <Link to="/projects" className="btn btn-secondary">
                <Wrench className="h-4 w-4" aria-hidden="true" />
                Projects
              </Link>
              <Link to="/diagnostics" className="btn btn-ghost">
                <Stethoscope className="h-4 w-4" aria-hidden="true" />
                Diagnostics
              </Link>
            </div>

            <div className="relative mt-8 grid gap-2 border-t border-line pt-6 text-left sm:grid-cols-2">
              {[
                { to: '/videos', label: 'YouTube video portfolio' },
                { to: '/gallery', label: 'Workshop gallery' },
                { to: '/skills', label: 'Automotive skills' },
                { to: '/cv', label: 'Curriculum vitae' },
                { to: '/certificates', label: 'Certificates' },
                { to: '/contact', label: 'Contact' },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center justify-between rounded border border-line/60 px-3 py-2 text-xs text-silver-300 transition-colors hover:border-signal-400/40 hover:text-white"
                >
                  {link.label}
                  <ArrowRight className="h-3 w-3 text-silver-600" aria-hidden="true" />
                </Link>
              ))}
            </div>

            <p className="relative mt-6 flex items-center justify-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-silver-600">
              <Search className="h-3 w-3" aria-hidden="true" />
              Check the URL or return to the homepage
            </p>
          </div>
        </div>
      </Section>
    </>
  )
}
