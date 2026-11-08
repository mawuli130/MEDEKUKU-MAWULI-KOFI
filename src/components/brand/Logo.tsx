import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

/**
 * Brand mark: a diagnostic waveform captured inside a stylised piston/gear ring,
 * with a circuit trace that resolves into a vehicle roofline. Original artwork —
 * no manufacturer resemblance.
 */
export function LogoMark({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="Mawuli Engineering and Diagnostic Services logo"
      className={cn('h-10 w-10', className)}
      fill="none"
    >
      <defs>
        <linearGradient id="mw-ring" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#dfe6ec" />
          <stop offset="0.45" stopColor="#8492a0" />
          <stop offset="1" stopColor="#2fdcf2" />
        </linearGradient>
        <linearGradient id="mw-trace" x1="8" y1="24" x2="40" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2fdcf2" />
          <stop offset="1" stopColor="#b6f4ff" />
        </linearGradient>
      </defs>

      {/* Outer gear ring with notches */}
      <circle cx="24" cy="24" r="20" stroke="url(#mw-ring)" strokeWidth="1.6" opacity="0.9" />
      <circle cx="24" cy="24" r="16.5" stroke="#2fdcf2" strokeOpacity="0.22" strokeWidth="1" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1="24"
          y1="3.2"
          x2="24"
          y2="7"
          stroke="#c3ced8"
          strokeWidth="1.7"
          strokeLinecap="round"
          transform={`rotate(${angle} 24 24)`}
          opacity="0.75"
        />
      ))}

      {/* Diagnostic waveform */}
      <path
        d="M8 25.5h6.4l2.6-6.8 3.6 13 3.1-9.2 2.3 5.4h4.1l2.2-3.6 2.6 6.2 2.1-4.6H40"
        stroke="url(#mw-trace)"
        strokeWidth="2.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animated ? 'diag-wave-path' : undefined}
        style={animated ? { strokeDasharray: 620, animation: 'trace 6s linear infinite' } : undefined}
      />

      {/* Circuit nodes */}
      <circle cx="8" cy="25.5" r="1.5" fill="#2fdcf2" />
      <circle cx="40" cy="25.5" r="1.5" fill="#b6f4ff" />
    </svg>
  )
}

export function LogoLockup({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className={compact ? 'h-9 w-9' : 'h-10 w-10'} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.0625rem] font-semibold uppercase tracking-[0.13em] text-white sm:text-lg">
          Mawuli
        </span>
        <span className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.17em] text-silver-500">
          Engineering &amp; Diagnostics
        </span>
      </span>
    </span>
  )
}

export function BrandLink({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      className="group flex shrink-0 items-center rounded focus-visible:outline-offset-4"
      aria-label="Mawuli Engineering & Diagnostic Services — home"
    >
      <LogoLockup />
    </Link>
  )
}
