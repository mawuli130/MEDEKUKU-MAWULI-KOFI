import { Link } from 'react-router-dom'
import { ArrowRight, Download, MapPin, PlayCircle, Stethoscope } from 'lucide-react'
import { PortraitImage } from '@/components/ui/MediaImage'
import { WaveformBackdrop } from '@/components/brand/AutomotiveBackdrop'
import { Tag } from '@/components/ui'
import type { Profile } from '@/types'

export function HomeHero({ profile }: { profile: Profile }) {
  const hasCv = Boolean(profile.cv_url)

  return (
    <section className="relative overflow-hidden border-b border-line/80 bg-ink-950" aria-labelledby="hero-heading">
      {/* Layered technical backdrop */}
      <div className="grid-overlay pointer-events-none absolute inset-0 opacity-[0.4]" aria-hidden="true" />
      <div className="blueprint-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -inset-x-10 bottom-0 h-56 opacity-45 md:h-64"
        aria-hidden="true"
      >
        <WaveformBackdrop className="h-full" />
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950 to-transparent"
        aria-hidden="true"
      />

      <div className="container-page relative py-12 md:py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-14">
          <div className="animate-rise">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Tag tone="signal">
                <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal-400" />
                </span>
                Available for workshop opportunities
              </Tag>
              <Tag>
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {profile.location || 'Accra, Ghana'}
              </Tag>
            </div>

            <h1
              id="hero-heading"
              className="text-[2.25rem] leading-[0.98] font-semibold tracking-tight sm:text-[3.1rem] lg:text-[3.75rem]"
            >
              <span className="block text-white">Medekuku Mawuli Kofi</span>
              <span className="mt-2 block bg-gradient-to-r from-signal-300 via-signal-400 to-electric-500 bg-clip-text text-[1.5rem] leading-tight text-transparent sm:text-[2rem] lg:text-[2.125rem]">
                {profile.headline || 'Automotive Electronics & Diagnostic Technician'}
              </span>
            </h1>

            <p className="mt-3 font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-silver-500">
              Mawuli Engineering &amp; Diagnostic Services
            </p>

            <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-silver-300 sm:text-base">
              {profile.hero_intro ||
                'I specialize in automotive electrical and electronic systems, vehicle diagnostics, ECU-related troubleshooting, and practical workshop repairs.'}
            </p>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link to="/projects" className="btn btn-primary">
                <Stethoscope className="h-4 w-4" aria-hidden="true" />
                Explore automotive projects
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link to="/diagnostics" className="btn btn-secondary">
                View diagnostic case studies
              </Link>
            </div>

            <div className="mt-3 flex flex-wrap gap-2.5">
              <Link to="/videos" className="btn btn-ghost">
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                Watch my YouTube videos
              </Link>
              <Link to="/contact" className="btn btn-ghost">
                Contact me
              </Link>
              {hasCv ? (
                <a href={profile.cv_url ?? '#'} download className="btn btn-ghost">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download my CV
                </a>
              ) : (
                <Link to="/cv" className="btn btn-ghost">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download my CV
                </Link>
              )}
            </div>

            <dl className="mt-8 grid max-w-lg grid-cols-3 gap-3 border-t border-line pt-5">
              <HeroStat label="Discipline" value="Auto electronics" />
              <HeroStat label="Focus" value="Fault diagnosis" />
              <HeroStat label="Base" value="Accra, Ghana" />
            </dl>
          </div>

          {/* Portrait / equipment frame */}
          <div className="relative animate-rise lg:justify-self-end">
            <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
              <div
                className="absolute -inset-2 rounded-xl border border-line/70"
                aria-hidden="true"
              />
              <div
                className="absolute -right-2 -top-2 h-16 w-16 border-r-2 border-t-2 border-signal-400/45"
                aria-hidden="true"
              />
              <div
                className="absolute -bottom-2 -left-2 h-16 w-16 border-b-2 border-l-2 border-signal-400/25"
                aria-hidden="true"
              />
              <PortraitImage
                src={profile.profile_image}
                alt={`${profile.full_name} — ${profile.headline}${profile.location ? `, ${profile.location}` : ''}`}
                name={profile.full_name}
                priority
                className="aspect-[4/5] w-full"
              />
              <div className="absolute inset-x-3 bottom-3 hidden rounded border border-line/80 bg-ink-950/85 px-3 py-2 backdrop-blur sm:block">
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-silver-500">
                  Automotive electronics · ECU · engine management
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[0.625rem] uppercase tracking-[0.13em] text-silver-600">{label}</dt>
      <dd className="mt-1 text-[0.8125rem] font-medium text-silver-200">{value}</dd>
    </div>
  )
}
