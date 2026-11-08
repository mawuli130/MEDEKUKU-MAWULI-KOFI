import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Slide-over editor used by every admin section. Keeps list and form in one
 * screen on mobile, and a two-pane layout on desktop.
 */
export function Drawer({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  wide = false,
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        className={cn(
          'relative flex h-full w-full flex-col border-l border-line bg-ink-900 shadow-lift',
          wide ? 'max-w-3xl' : 'max-w-xl',
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id="drawer-title" className="truncate font-display text-base font-semibold text-white">
              {title}
            </h2>
            {description ? <p className="mt-0.5 text-[0.6875rem] text-silver-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 shrink-0 place-items-center rounded border border-line text-silver-400 hover:text-white"
            aria-label="Close editor"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>

        {footer ? <div className="border-t border-line bg-ink-925 px-4 py-3 sm:px-5">{footer}</div> : null}
      </div>
    </div>
  )
}
