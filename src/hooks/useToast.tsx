import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastTone = 'success' | 'error' | 'info' | 'warn'

interface ToastItem {
  id: number
  tone: ToastTone
  title: string
  description?: string
}

interface ToastValue {
  push: (toast: Omit<ToastItem, 'id'>, tone?: ToastTone) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
}

const ToastContext = createContext<ToastValue | null>(null)

const toneStyles: Record<ToastTone, { icon: typeof CheckCircle2; classes: string }> = {
  success: { icon: CheckCircle2, classes: 'border-ok-400/40 text-ok-400' },
  error: { icon: XCircle, classes: 'border-danger-400/40 text-danger-400' },
  warn: { icon: TriangleAlert, classes: 'border-warn-400/40 text-warn-400' },
  info: { icon: Info, classes: 'border-signal-400/40 text-signal-300' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const push = useCallback(
    (toast: Omit<ToastItem, 'id'>, tone: ToastTone = 'info') => {
      const id = Date.now() + Math.random()
      setToasts((current) => [...current.slice(-3), { ...toast, tone, id }])
      window.setTimeout(() => dismiss(id), tone === 'error' ? 8000 : 5000)
    },
    [dismiss],
  )

  const value = useMemo<ToastValue>(
    () => ({
      push,
      success: (title, description) => push({ title, description, tone: 'success' }, 'success'),
      error: (title, description) => push({ title, description, tone: 'error' }, 'error'),
      info: (title, description) => push({ title, description, tone: 'info' }, 'info'),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const { icon: Icon, classes } = toneStyles[toast.tone]
          return (
            <div
              key={toast.id}
              role="status"
              aria-live="polite"
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border bg-ink-850 px-4 py-3 shadow-lift animate-rise',
                classes,
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-xs leading-relaxed text-silver-400">{toast.description}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded p-1 text-silver-500 transition-colors hover:text-white"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
