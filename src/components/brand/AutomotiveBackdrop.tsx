import { cn } from '@/lib/utils'

/**
 * Decorative automotive backdrops.
 *
 * These are original abstract technical illustrations (oscilloscope traces,
 * circuit topology, ECU connector grids) — never presented as photographs of
 * real work. Real workshop imagery is uploaded by the administrator.
 */
export function WaveformBackdrop({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 260"
      aria-hidden="true"
      className={cn('w-full', className)}
      preserveAspectRatio="none"
      fill="none"
    >
      <defs>
        <linearGradient id="bd-trace" x1="0" y1="130" x2="640" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2fdcf2" stopOpacity="0" />
          <stop offset="0.2" stopColor="#2fdcf2" stopOpacity="0.85" />
          <stop offset="0.75" stopColor="#b6f4ff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#2fdcf2" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="bd-trace-2" x1="0" y1="0" x2="640" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2a6df5" stopOpacity="0" />
          <stop offset="0.5" stopColor="#2a6df5" stopOpacity="0.55" />
          <stop offset="1" stopColor="#2a6df5" stopOpacity="0" />
        </linearGradient>
      </defs>

      {Array.from({ length: 7 }).map((_, index) => (
        <line
          key={index}
          x1="0"
          y1={20 + index * 37}
          x2="640"
          y2={20 + index * 37}
          stroke="#26313c"
          strokeWidth="1"
          strokeDasharray="4 8"
          opacity="0.62"
        />
      ))}

      <path
        d="M0 130h70l16-44 22 88 18-62 14 26h44l18-30 24 56 20-40 16 18h60l14-26 20 48 16-34 18 14h84l16-30 22 60 18-40 14 12h60"
        stroke="url(#bd-trace)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M0 178h120l26-22 30 34 26-18h96l30-26 34 40 30-24h110l28-18 30 26h80"
        stroke="url(#bd-trace-2)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.65"
      />
    </svg>
  )
}

/** ECU connector + harness topology illustration. */
export function CircuitBackdrop({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 260" aria-hidden="true" className={cn('w-full', className)} fill="none">
      <rect x="150" y="90" width="120" height="80" rx="6" stroke="#26313c" strokeWidth="1.5" />
      <rect x="164" y="104" width="92" height="52" rx="3" stroke="#2fdcf2" strokeOpacity="0.35" />
      {Array.from({ length: 6 }).map((_, index) => (
        <g key={index}>
          <line
            x1={168 + index * 15}
            y1="104"
            x2={168 + index * 15}
            y2="80"
            stroke="#8492a0"
            strokeWidth="1.3"
          />
          <circle cx={168 + index * 15} cy="78" r="2.4" fill="#2fdcf2" fillOpacity="0.85" />
        </g>
      ))}
      {Array.from({ length: 4 }).map((_, index) => (
        <g key={`b-${index}`}>
          <line x1={175 + index * 20} y1="156" x2={175 + index * 20} y2="180" stroke="#8492a0" strokeWidth="1.3" />
          <circle cx={175 + index * 20} cy="182" r="2.4" fill="#2a6df5" fillOpacity="0.9" />
        </g>
      ))}
      <path d="M60 60h60v30" stroke="#26313c" strokeWidth="1.3" strokeDasharray="5 6" />
      <path d="M360 200h-50v-30" stroke="#26313c" strokeWidth="1.3" strokeDasharray="5 6" />
      <circle cx="60" cy="60" r="3" fill="#2fdcf2" />
      <circle cx="360" cy="200" r="3" fill="#2a6df5" />
    </svg>
  )
}

/** Abstract vehicle-front silhouette, used behind hero and cards. */
export function VehicleOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 200" aria-hidden="true" className={cn('w-full', className)} fill="none">
      <path
        d="M40 138c0-10 4-18 13-22l34-13c9-4 15-9 22-17l20-22c8-9 18-14 31-14h126c14 0 25 5 34 15l19 22c7 8 14 12 24 15l44 12c10 3 15 11 15 21v12c0 7-5 12-12 12H52c-7 0-12-5-12-12z"
        stroke="#3a4753"
        strokeWidth="1.7"
      />
      <path d="M120 106h132l-14-30c-3-6-9-9-16-9H168c-7 0-13 3-17 9z" stroke="#2fdcf2" strokeOpacity="0.45" strokeWidth="1.4" />
      <path d="M266 106h96l-16-30c-4-6-10-9-17-9h-46z" stroke="#2fdcf2" strokeOpacity="0.28" strokeWidth="1.4" />
      <line x1="20" y1="160" x2="500" y2="160" stroke="#26313c" strokeWidth="1" strokeDasharray="6 8" />
      <circle cx="150" cy="168" r="21" stroke="#3a4753" strokeWidth="1.6" />
      <circle cx="150" cy="168" r="9" stroke="#2fdcf2" strokeOpacity="0.6" strokeWidth="1.2" />
      <circle cx="386" cy="168" r="21" stroke="#3a4753" strokeWidth="1.6" />
      <circle cx="386" cy="168" r="9" stroke="#2fdcf2" strokeOpacity="0.6" strokeWidth="1.2" />
    </svg>
  )
}

/** Small DTC / diagnostic header used on report cards. */
export function DiagnosticRule({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 8" aria-hidden="true" className={cn('h-2 w-full', className)} preserveAspectRatio="none">
      <path
        d="M0 4h40l6-4 8 8 6-8 6 8 8-4h120"
        stroke="#2fdcf2"
        strokeOpacity="0.55"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  )
}
