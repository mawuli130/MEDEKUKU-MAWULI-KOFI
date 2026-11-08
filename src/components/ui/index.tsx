import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight, ChevronRight, Inbox } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ----------------------------- Section ----------------------------- */
export function Section({
  children,
  className,
  id,
  as: Tag = 'section',
  tone = 'default',
}: {
  children: ReactNode
  className?: string
  id?: string
  as?: 'section' | 'div' | 'article'
  tone?: 'default' | 'raised' | 'flush'
}) {
  return (
    <Tag
      id={id}
      className={cn(
        'relative py-16 md:py-20 lg:py-24',
        tone === 'raised' && 'bg-ink-925/70',
        tone === 'flush' && 'py-0',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
  align?: 'left' | 'center'
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-9 flex flex-col gap-4 md:mb-11',
        align === 'center' ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow ? (
          <p className="eyebrow mb-2.5">
            <span className="h-px w-6 bg-signal-400/70" aria-hidden="true" />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-[1.75rem] leading-[1.12] font-semibold tracking-tight sm:text-4xl lg:text-[2.6rem]">
          {title}
        </h2>
        {description ? (
          <p className="mt-3.5 text-[0.9375rem] leading-relaxed text-silver-400 md:text-base">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

/* ------------------------------ PageHeader ------------------------- */
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  aside,
}: {
  eyebrow?: string
  title: string
  description?: string
  children?: ReactNode
  aside?: ReactNode
}) {
  return (
    <header className="relative overflow-hidden border-b border-line/80 bg-ink-900">
      <div className="grid-overlay pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden="true" />
      <div className="blueprint-glow pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="container-page relative py-12 md:py-16 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className="eyebrow mb-3">
                <span className="h-px w-6 bg-signal-400/70" aria-hidden="true" />
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-[2rem] leading-[1.06] font-semibold tracking-tight sm:text-[2.6rem] lg:text-[3.25rem]">
              {title}
            </h1>
            {description ? (
              <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-silver-400 md:text-[1.0625rem]">
                {description}
              </p>
            ) : null}
            {children ? <div className="mt-6">{children}</div> : null}
          </div>
          {aside ? <div className="lg:justify-self-end">{aside}</div> : null}
        </div>
      </div>
    </header>
  )
}

/* ------------------------------ Buttons ---------------------------- */
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}
const sizeClass: Record<ButtonSize, string> = { sm: 'btn-sm', md: '', lg: 'btn-lg' }

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconRight?: LucideIcon
  loading?: boolean
}

export function ActionButton({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  children,
  className,
  disabled,
  ...rest
}: ActionButtonProps) {
  return (
    <button
      className={cn('btn', variantClass[variant], sizeClass[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner className="h-4 w-4" /> : Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
      {IconRight && !loading ? <IconRight className="h-4 w-4" aria-hidden="true" /> : null}
    </button>
  )
}

interface ActionLinkProps {
  to: string
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconRight?: LucideIcon
  children: ReactNode
  className?: string
  external?: boolean
  onClick?: () => void
  ariaLabel?: string
}

export function ActionLink({
  to,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  children,
  className,
  external = false,
  onClick,
  ariaLabel,
}: ActionLinkProps) {
  const classes = cn('btn', variantClass[variant], sizeClass[size], className)
  const content = (
    <>
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      {children}
      {IconRight ? <IconRight className="h-4 w-4" aria-hidden="true" /> : null}
    </>
  )
  if (external) {
    return (
      <a
        href={to}
        className={classes}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {content}
      </a>
    )
  }
  return (
    <Link to={to} className={classes} onClick={onClick} aria-label={ariaLabel}>
      {content}
    </Link>
  )
}

/* ------------------------------ Spinner ---------------------------- */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-block animate-spin rounded-full border-2 border-current border-t-transparent', 'h-4 w-4', className)}
      role="status"
      aria-label="Loading"
    />
  )
}

/* ------------------------------ Badges ----------------------------- */
export function Tag({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'signal' | 'warn' | 'danger' | 'ok'
  className?: string
}) {
  const tones: Record<string, string> = {
    neutral: '',
    signal: 'chip-signal',
    warn: 'border-warn-400/40 bg-warn-400/10 text-warn-400',
    danger: 'border-danger-400/40 bg-danger-400/10 text-danger-400',
    ok: 'border-ok-400/40 bg-ok-400/10 text-ok-400',
  }
  return <span className={cn('chip', tones[tone], className)}>{children}</span>
}

/* --------------------------- Empty state --------------------------- */
export function EmptyState({
  title,
  body,
  icon: Icon = Inbox,
  action,
  compact = false,
  adminHint = false,
}: {
  title: string
  body: string
  icon?: LucideIcon
  action?: ReactNode
  compact?: boolean
  adminHint?: boolean
}) {
  return (
    <div
      className={cn(
        'panel relative overflow-hidden border-dashed text-center',
        compact ? 'px-5 py-9' : 'px-6 py-14 md:px-10 md:py-16',
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal-400/40 to-transparent"
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-md flex-col items-center">
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-full border border-line bg-ink-850 text-signal-400">
          <Icon className="h-[1.375rem] w-[1.375rem]" aria-hidden="true" />
        </span>
        <h3 className="font-display text-xl font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-silver-400">{body}</p>
        {adminHint ? (
          <p className="mt-3 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-silver-600">
            Managed from /admin
          </p>
        ) : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  )
}

/* ------------------------- Skeleton helpers ------------------------ */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="panel p-5">
      <div className="skeleton mb-4 aspect-[16/10] w-full" />
      <div className="skeleton mb-2 h-3 w-24" />
      <div className="skeleton mb-3 h-5 w-4/5" />
      {Array.from({ length: lines }).map((_, index) => (
        <div key={index} className="skeleton mb-2 h-3" style={{ width: `${88 - index * 12}%` }} />
      ))}
    </div>
  )
}

export function SkeletonGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  )
}

/* ---------------------------- Breadcrumbs -------------------------- */
export function Breadcrumbs({ crumbs }: { crumbs: { label: string; path?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5">
      <ol className="flex flex-wrap items-center gap-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.1em] text-silver-500">
        {crumbs.map((crumb, index) => (
          <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 ? <ChevronRight className="h-3 w-3 text-ink-600" aria-hidden="true" /> : null}
            {crumb.path ? (
              <Link to={crumb.path} className="transition-colors hover:text-signal-300">
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-silver-300">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

/* --------------------------- Misc layout --------------------------- */
export function StatRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="tech-row">
      <dt className="label-tech shrink-0">{label}</dt>
      <dd className="text-right text-sm font-medium text-silver-200">{value || '—'}</dd>
    </div>
  )
}

export function InlineArrow() {
  return <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
}

export function Callout({
  title,
  children,
  tone = 'info',
}: {
  title?: string
  children: ReactNode
  tone?: 'info' | 'warn' | 'danger'
}) {
  const tones = {
    info: 'border-signal-400/30 bg-signal-400/[0.06] text-signal-200',
    warn: 'border-warn-400/35 bg-warn-400/[0.07] text-warn-400',
    danger: 'border-danger-400/35 bg-danger-400/[0.07] text-danger-400',
  } as const
  return (
    <div className={cn('rounded-md border px-4 py-3 text-sm leading-relaxed', tones[tone])}>
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div className="text-silver-300">{children}</div>
    </div>
  )
}
