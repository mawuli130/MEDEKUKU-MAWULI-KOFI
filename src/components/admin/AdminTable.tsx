import type { ReactNode } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  header: string
  /** Render cell content. */
  cell: (row: T) => ReactNode
  className?: string
  hideOnMobile?: boolean
}

export function PageTitle({
  title,
  description,
  action,
  count,
}: {
  title: string
  description?: string
  action?: ReactNode
  count?: number
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="font-display text-xl font-semibold text-white sm:text-2xl">
          {title}
          {typeof count === 'number' ? (
            <span className="ml-2 font-mono text-xs font-normal text-silver-500">({count})</span>
          ) : null}
        </h1>
        {description ? <p className="mt-1 max-w-2xl text-xs leading-relaxed text-silver-400">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="btn btn-primary btn-sm">
      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  )
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  loading,
  error,
  onRetry,
  onEdit,
  onDelete,
  onPreview,
  empty,
  caption,
}: {
  rows: T[]
  columns: Column<T>[]
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onPreview?: (row: T) => void
  empty?: ReactNode
  caption: string
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded border border-line bg-ink-925 p-5 text-xs text-silver-400" role="status">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Loading records…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded border border-danger-400/40 bg-danger-400/[0.07] p-4 text-xs">
        <p className="font-semibold text-danger-400">Could not load records</p>
        <p className="mt-1 text-silver-300">{error}</p>
        {onRetry ? (
          <button type="button" onClick={onRetry} className="btn btn-ghost btn-sm mt-2">
            Retry
          </button>
        ) : null}
      </div>
    )
  }

  if (!rows.length) {
    return <>{empty}</>
  }

  return (
    <div className="overflow-x-auto rounded border border-line">
      <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-ink-850 font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-500">
            {columns.map((column) => (
              <th
                key={column.header}
                scope="col"
                className={cn('px-3 py-2.5 font-medium', column.className, column.hideOnMobile && 'hidden md:table-cell')}
              >
                {column.header}
              </th>
            ))}
            <th scope="col" className="px-3 py-2.5 text-right font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-line/70 transition-colors hover:bg-white/[0.015]">
              {columns.map((column) => (
                <td
                  key={column.header}
                  className={cn('px-3 py-2.5 align-top text-silver-300', column.className, column.hideOnMobile && 'hidden md:table-cell')}
                >
                  {column.cell(row)}
                </td>
              ))}
              <td className="px-3 py-2.5 text-right align-top">
                <div className="flex justify-end gap-1">
                  {onPreview ? (
                    <button
                      type="button"
                      onClick={() => onPreview(row)}
                      className="rounded px-1.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.08em] text-silver-400 hover:bg-white/5 hover:text-signal-300"
                    >
                      View
                    </button>
                  ) : null}
                  {onEdit ? (
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="grid h-6 w-6 place-items-center rounded text-silver-400 hover:bg-white/5 hover:text-signal-300"
                      aria-label="Edit record"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  ) : null}
                  {onDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(row)}
                      className="grid h-6 w-6 place-items-center rounded text-silver-400 hover:bg-danger-400/10 hover:text-danger-400"
                      aria-label="Delete record"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function StatusPill({ status }: { status: string }) {
  const published = status === 'published'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-[0.1em]',
        published ? 'border-ok-400/40 bg-ok-400/10 text-ok-400' : 'border-warn-400/40 bg-warn-400/10 text-warn-400',
      )}
    >
      <span className={cn('h-1 w-1 rounded-full', published ? 'bg-ok-400' : 'bg-warn-400')} aria-hidden="true" />
      {published ? 'Published' : 'Draft'}
    </span>
  )
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  busy = false,
  tone = 'danger',
}: {
  open: boolean
  title: string
  body: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
  tone?: 'danger' | 'primary'
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-ink-950/85 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-body"
    >
      <div className="w-full max-w-md rounded-lg border border-line bg-ink-900 p-5 shadow-lift">
        <h2 id="confirm-title" className="font-display text-lg font-semibold text-white">
          {title}
        </h2>
        <p id="confirm-body" className="mt-2 text-sm leading-relaxed text-silver-400">
          {body}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm" disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn('btn btn-sm', tone === 'danger' ? 'btn-danger' : 'btn-primary')}
            disabled={busy}
            autoFocus
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AdminCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('rounded border border-line bg-ink-925 p-4 sm:p-5', className)}>{children}</div>
}
