import { Facebook, Linkedin, Mail, MessageCircle, Phone, Twitter, Youtube, type LucideIcon } from 'lucide-react'
import type { SocialLink, SocialPlatform } from '@/types'
import { cn } from '@/lib/utils'

const PLATFORM_META: Record<SocialPlatform, { label: string; icon: LucideIcon }> = {
  youtube: { label: 'YouTube', icon: Youtube },
  linkedin: { label: 'LinkedIn', icon: Linkedin },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  facebook: { label: 'Facebook', icon: Facebook },
  x: { label: 'X', icon: Twitter },
  email: { label: 'Email', icon: Mail },
  phone: { label: 'Phone', icon: Phone },
}

/** Converts a stored value into a usable href for the platform. */
export function socialHref(link: Pick<SocialLink, 'platform' | 'url'>): string {
  const value = link.url.trim()
  if (link.platform === 'email') {
    return value.startsWith('mailto:') ? value : `mailto:${value.replace(/^mailto:/, '')}`
  }
  if (link.platform === 'phone') return value.startsWith('tel:') ? value : `tel:${value.replace(/[^+\d]/g, '')}`
  if (link.platform === 'whatsapp') {
    if (value.startsWith('http')) return value
    return `https://wa.me/${value.replace(/[^\d]/g, '')}`
  }
  if (/^https?:\/\//i.test(value)) return value
  return `https://${value}`
}

export function socialLabel(link: Pick<SocialLink, 'platform' | 'handle'>): string {
  const meta = PLATFORM_META[link.platform]
  if (link.platform === 'email') return 'Email'
  if (link.platform === 'phone') return 'Phone'
  return link.handle ? `${meta.label} — ${link.handle}` : meta.label
}

export function SocialLinks({
  links,
  className,
  size = 'md',
  showLabels = false,
}: {
  links: SocialLink[]
  className?: string
  size?: 'sm' | 'md'
  showLabels?: boolean
}) {
  if (!links.length) return null
  const ordered = [...links].sort((a, b) => a.display_order - b.display_order)

  return (
    <ul className={cn('flex flex-wrap items-center gap-2', className)}>
      {ordered.map((link) => {
        const meta = PLATFORM_META[link.platform]
        if (!meta) return null
        const Icon = meta.icon
        const isExternal = link.platform !== 'email' && link.platform !== 'phone'
        return (
          <li key={link.id}>
            <a
              href={socialHref(link)}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              aria-label={socialLabel(link)}
              className={cn(
                'inline-flex items-center gap-2 rounded-md border border-line bg-ink-850/80 text-silver-300 transition-all hover:border-signal-400/50 hover:text-white hover:bg-ink-800',
                showLabels ? 'px-3 py-2 text-xs' : size === 'sm' ? 'h-8 w-8 justify-center' : 'h-9 w-9 justify-center',
              )}
            >
              <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden="true" />
              {showLabels ? <span>{meta.label}</span> : null}
            </a>
          </li>
        )
      })}
    </ul>
  )
}

export { PLATFORM_META }
