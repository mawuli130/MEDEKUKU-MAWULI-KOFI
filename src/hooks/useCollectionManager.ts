import { useCallback, useEffect, useState } from 'react'
import type { ZodTypeAny, z } from 'zod'
import { fieldErrors } from '@/lib/validation'
import { useToast } from '@/hooks/useToast'
import type { RepositoryError } from '@/services/types'

interface ManagerOptions<T extends { id: string }, TInput, TPayload = TInput> {
  label: string
  schema: ZodTypeAny
  load: () => Promise<T[]>
  create: (input: TPayload) => Promise<T>
  update: (id: string, input: TPayload) => Promise<T>
  remove: (id: string) => Promise<void>
  /** Convert the schema's parsed output into the repository payload. */
  toPayload: (values: z.output<ZodTypeAny>) => TPayload
  emptyValues: TInput
}

export interface CollectionManager<T, TInput> {
  rows: T[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
  editing: T | null
  values: TInput
  errors: Record<string, string>
  saving: boolean
  deleting: T | null
  deletingBusy: boolean
  editorOpen: boolean
  openCreate: () => void
  openEdit: (row: T) => void
  closeEditor: () => void
  setValue: <K extends keyof TInput>(key: K, value: TInput[K]) => void
  patchValues: (patch: Partial<TInput>) => void
  save: () => Promise<boolean>
  requestDelete: (row: T | null) => void
  confirmDelete: () => Promise<void>
}

export function useCollectionManager<T extends { id: string }, TInput, TPayload = TInput>(
  options: ManagerOptions<T, TInput, TPayload> & {
    /** Map an existing row back into form values. */
    toForm: (row: T) => TInput
  },
): CollectionManager<T, TInput> {
  const toast = useToast()
  const [rows, setRows] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<T | null>(null)
  const [values, setValues] = useState<TInput>(options.emptyValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<T | null>(null)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await options.load())
    } catch (cause) {
      setError((cause as RepositoryError)?.message ?? 'Records could not be loaded.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  // Re-fetch when the tab regains focus so the list reflects changes made
  // elsewhere (for example another browser tab or the quick-edit drawer).
  useEffect(() => {
    const onFocus = () => {
      if (document.visibilityState === 'visible') void reload()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [reload])

  const setValue = useCallback(<K extends keyof TInput>(key: K, value: TInput[K]) => {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => {
      const errorKey = String(key)
      if (!current[errorKey]) return current
      const next = { ...current }
      delete next[errorKey]
      return next
    })
  }, [])

  const patchValues = useCallback((patch: Partial<TInput>) => {
    setValues((current) => ({ ...current, ...patch }))
  }, [])

  const closeEditor = useCallback(() => {
    setEditorOpen(false)
    setEditing(null)
    setValues(options.emptyValues)
    setErrors({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openCreate = useCallback(() => {
    setEditing(null)
    setValues(options.emptyValues)
    setErrors({})
    setEditorOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openEdit = useCallback(
    (row: T) => {
      setEditing(row)
      setValues(options.toForm(row))
      setErrors({})
      setEditorOpen(true)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const save = useCallback(async () => {
    const parsed = options.schema.safeParse(values)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      toast.error('Please fix the highlighted fields', 'Nothing was saved.')
      return false
    }
    setSaving(true)
    setErrors({})
    try {
      const payload = options.toPayload(parsed.data)
      if (editing) {
        await options.update(editing.id, payload)
        toast.success(`${options.label} updated`)
      } else {
        await options.create(payload)
        toast.success(`${options.label} created`)
      }
      await reload()
      closeEditor()
      return true
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'The record could not be saved.'
      toast.error('Save failed', message)
      setErrors({ form: message })
      return false
    } finally {
      setSaving(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, editing, options, reload, closeEditor, toast])

  const requestDelete = useCallback((row: T | null) => setDeleting(row), [])

  const confirmDelete = useCallback(async () => {
    if (!deleting) return
    setDeletingBusy(true)
    try {
      await options.remove(deleting.id)
      toast.success(`${options.label} deleted`)
      setDeleting(null)
      await reload()
    } catch (cause) {
      toast.error('Delete failed', cause instanceof Error ? cause.message : 'The record could not be deleted.')
    } finally {
      setDeletingBusy(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleting, options, reload, toast])

  return {
    rows,
    loading,
    error,
    reload,
    editing,
    values,
    errors,
    saving,
    deleting,
    deletingBusy,
    editorOpen,
    openCreate,
    openEdit,
    closeEditor,
    setValue,
    patchValues,
    save,
    requestDelete,
    confirmDelete,
  }
}
