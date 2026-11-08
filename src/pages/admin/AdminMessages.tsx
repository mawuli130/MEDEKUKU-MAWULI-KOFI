import { useEffect, useMemo, useState } from 'react'
import { Archive, Check, Inbox, Mail, Trash2 } from 'lucide-react'
import { ConfirmDialog, PageTitle } from '@/components/admin/AdminTable'
import { EmptyState, Tag } from '@/components/ui'
import { useToast } from '@/hooks/useToast'
import { getRepository } from '@/services'
import { formatDateTime, relativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ContactMessage, MessageStatus } from '@/types'

const FILTERS: Array<{ value: 'all' | MessageStatus; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'archived', label: 'Archived' },
]

export default function AdminMessages() {
  const repository = getRepository()
  const toast = useToast()
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | MessageStatus>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<ContactMessage | null>(null)
  const [busy, setBusy] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const list = await repository.messages.list()
      setMessages(list)
      setSelectedId((current) => current ?? list[0]?.id ?? null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Messages could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(
    () => messages.filter((message) => filter === 'all' || message.status === filter),
    [messages, filter],
  )

  const selected = messages.find((message) => message.id === selectedId) ?? null

  async function setStatus(message: ContactMessage, status: MessageStatus) {
    try {
      await repository.messages.updateStatus(message.id, status)
      setMessages((current) => current.map((item) => (item.id === message.id ? { ...item, status } : item)))
      toast.success(`Marked as ${status}`)
    } catch (cause) {
      toast.error('Update failed', cause instanceof Error ? cause.message : undefined)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await repository.messages.remove(deleting.id)
      setMessages((current) => current.filter((item) => item.id !== deleting.id))
      setDeleting(null)
      setSelectedId(null)
      toast.success('Message deleted')
    } catch (cause) {
      toast.error('Delete failed', cause instanceof Error ? cause.message : undefined)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Contact messages"
        description="Enquiries submitted through the contact form. Only authenticated administrators can read these — public visitors have no read access under RLS."
        count={messages.length}
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {FILTERS.map((option) => {
          const count = option.value === 'all' ? messages.length : messages.filter((m) => m.status === option.value).length
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              aria-pressed={filter === option.value}
              className={cn(
                'rounded-full border px-3 py-1 font-mono text-[0.625rem] uppercase tracking-[0.08em] transition-colors',
                filter === option.value
                  ? 'border-signal-400/60 bg-signal-400/12 text-signal-200'
                  : 'border-line text-silver-400 hover:text-silver-200',
              )}
            >
              {option.label} ({count})
            </button>
          )
        })}
      </div>

      {error ? (
        <div className="rounded border border-danger-400/40 bg-danger-400/[0.08] p-4 text-xs">
          <p className="font-semibold text-danger-400">Could not load messages</p>
          <p className="mt-1 text-silver-300">{error}</p>
          <button type="button" onClick={() => void load()} className="btn btn-ghost btn-sm mt-2">
            Retry
          </button>
        </div>
      ) : loading ? (
        <p className="text-xs text-silver-500">Loading messages…</p>
      ) : !messages.length ? (
        <EmptyState
          title="No contact messages yet"
          body="When a visitor submits the contact form, the message appears here and is readable only by you."
          icon={Inbox}
        />
      ) : !filtered.length ? (
        <EmptyState title="No messages in this filter" body="Switch filters to see other messages." icon={Inbox} compact />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <ul className="space-y-1.5" aria-label="Message list">
            {filtered.map((message) => (
              <li key={message.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(message.id)}
                  aria-current={selectedId === message.id}
                  className={cn(
                    'w-full rounded border p-3 text-left transition-colors',
                    selectedId === message.id
                      ? 'border-signal-400/50 bg-signal-400/[0.07]'
                      : 'border-line bg-ink-925 hover:border-silver-600',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-xs font-medium text-white">{message.subject}</p>
                    <span className="shrink-0 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-600">
                      {relativeTime(message.created_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-[0.6875rem] text-silver-500">
                    {message.name} · {message.email}
                  </p>
                  <div className="mt-1.5">
                    <Tag
                      tone={message.status === 'new' ? 'signal' : message.status === 'archived' ? 'neutral' : 'ok'}
                    >
                      {message.status}
                    </Tag>
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {selected ? (
            <article className="rounded border border-line bg-ink-925 p-4 sm:p-5">
              <header className="border-b border-line pb-3">
                <h2 className="font-display text-lg font-semibold text-white">{selected.subject}</h2>
                <p className="mt-1 text-xs text-silver-400">
                  From <span className="text-silver-200">{selected.name}</span> ·{' '}
                  <a href={`mailto:${selected.email}`} className="text-signal-300 hover:underline">
                    {selected.email}
                  </a>
                </p>
                <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-600">
                  Received {formatDateTime(selected.created_at)}
                </p>
              </header>

              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-silver-300">{selected.message}</p>

              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                <a href={`mailto:${selected.email}?subject=Re: ${encodeURIComponent(selected.subject)}`} className="btn btn-primary btn-sm">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  Reply by email
                </a>
                {selected.status !== 'read' ? (
                  <button type="button" onClick={() => void setStatus(selected, 'read')} className="btn btn-ghost btn-sm">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    Mark read
                  </button>
                ) : null}
                {selected.status !== 'archived' ? (
                  <button
                    type="button"
                    onClick={() => void setStatus(selected, 'archived')}
                    className="btn btn-ghost btn-sm"
                  >
                    <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                    Archive
                  </button>
                ) : null}
                <button type="button" onClick={() => setDeleting(selected)} className="btn btn-danger btn-sm">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete
                </button>
              </div>
            </article>
          ) : (
            <div className="rounded border border-line bg-ink-925 p-5 text-xs text-silver-500">
              Select a message to read it.
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this message?"
        body="The enquiry will be permanently removed from the database."
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
        busy={busy}
      />
    </div>
  )
}
