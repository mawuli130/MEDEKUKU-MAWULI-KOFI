import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ImageOff, ScanLine } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WaveformBackdrop } from '@/components/brand/AutomotiveBackdrop'

/**
 * Image with a graceful, honest placeholder.
 *
 * When the administrator has not uploaded a photograph we show a technical
 * illustration and an explicit label — never an unrelated stock photo dressed up
 * as workshop evidence.
 */
export function MediaImage({
  src,
  alt,
  className,
  imgClassName,
  ratio = '16/10',
  loading = 'lazy',
  placeholderLabel = 'Photograph not uploaded yet',
  placeholderKind = 'generic',
  priority = false,
}: {
  src?: string | null
  alt: string
  className?: string
  imgClassName?: string
  ratio?: '16/10' | '4/3' | '1/1' | '3/2' | '16/9' | 'auto'
  loading?: 'lazy' | 'eager'
  placeholderLabel?: string
  placeholderKind?: 'generic' | 'portrait' | 'scan' | 'gallery'
  priority?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src) && !failed

  const ratioClass =
    ratio === 'auto'
      ? ''
      : ratio === '1/1'
        ? 'aspect-square'
        : ratio === '4/3'
          ? 'aspect-[4/3]'
          : ratio === '3/2'
            ? 'aspect-[3/2]'
            : ratio === '16/9'
              ? 'aspect-video'
              : 'aspect-[16/10]'

  return (
    <div className={cn('img-frame relative w-full', ratioClass, className)}>
      {showImage ? (
        <img
          src={src ?? undefined}
          alt={alt}
          loading={priority ? 'eager' : loading}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover', imgClassName)}
        />
      ) : (
        <MediaPlaceholder label={placeholderLabel} kind={placeholderKind} alt={alt} />
      )}
    </div>
  )
}

function MediaPlaceholder({
  label,
  kind,
  alt,
}: {
  label: string
  kind: 'generic' | 'portrait' | 'scan' | 'gallery'
  alt: string
}) {
  const Icon: LucideIcon = kind === 'scan' ? ScanLine : ImageOff
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-ink-850"
      role="img"
      aria-label={`${alt} — ${label}`}
    >
      <div className="grid-overlay absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="absolute inset-0 opacity-45" aria-hidden="true">
        <WaveformBackdrop className="h-full" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-2 px-4 text-center">
        <span className="grid h-10 w-10 place-items-center rounded-full border border-line bg-ink-900/80 text-silver-500">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-silver-500">{label}</span>
      </div>
      <span className="pointer-events-none absolute inset-2 rounded border border-line/60" aria-hidden="true" />
    </div>
  )
}

/** Portrait variant with a monogram fallback (never a fabricated likeness). */
export function PortraitImage({
  src,
  alt,
  name,
  className,
  priority = false,
}: {
  src?: string | null
  alt: string
  name: string
  className?: string
  priority?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const showImage = Boolean(src) && !failed
  const monogram = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')

  return (
    <div className={cn('relative overflow-hidden rounded-lg border border-line bg-ink-850', className)}>
      {showImage ? (
        <img
          src={src ?? undefined}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="relative flex h-full min-h-[16rem] w-full flex-col items-center justify-center gap-3">
          <div className="grid-overlay absolute inset-0 opacity-30" aria-hidden="true" />
          <div className="blueprint-glow absolute inset-0" aria-hidden="true" />
          <span
            className="relative font-display text-[3.5rem] font-semibold leading-none tracking-tight text-silver-600"
            aria-hidden="true"
          >
            {monogram || 'MK'}
          </span>
          <p className="relative max-w-[15rem] px-4 text-center font-mono text-[0.625rem] uppercase leading-relaxed tracking-[0.13em] text-silver-600">
            Portrait not uploaded — add it in the dashboard
          </p>
        </div>
      )}
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-signal-400/50 to-transparent"
        aria-hidden="true"
      />
    </div>
  )
}
