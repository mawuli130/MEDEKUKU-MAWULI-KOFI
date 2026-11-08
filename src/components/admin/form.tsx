import { useId, useState, type ReactNode } from 'react'
import { AlertCircle, Loader2, Plus, Trash2, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadImage, type Bucket } from '@/services/storage'
import { UploadValidationError } from '@/lib/image'
import { ActionButton } from '@/components/ui'

/* ---------------------------- Field wrapper ---------------------------- */
export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-silver-300">
        {label} {required ? <span className="text-danger-400">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 flex items-start gap-1 text-xs text-danger-400" role="alert">
          <AlertCircle className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[0.6875rem] leading-relaxed text-silver-600">{hint}</p>
      ) : null}
    </div>
  )
}

/* ------------------------------ Text input ----------------------------- */
export function TextInput({
  id,
  value,
  onChange,
  error,
  ...rest
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  error?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'id'>) {
  const generated = useId()
  const inputId = id ?? generated
  return (
    <input
      id={inputId}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={Boolean(error)}
      className="field"
      {...rest}
    />
  )
}

export function TextArea({
  id,
  value,
  onChange,
  error,
  rows = 4,
  ...rest
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  error?: string
  rows?: number
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'id' | 'rows'>) {
  const generated = useId()
  const inputId = id ?? generated
  return (
    <textarea
      id={inputId}
      rows={rows}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={Boolean(error)}
      className="field"
      {...rest}
    />
  )
}

export function SelectInput<T extends string>({
  id,
  value,
  onChange,
  options,
  error,
  ...rest
}: {
  id?: string
  value: T
  onChange: (value: T) => void
  options: readonly T[] | ReadonlyArray<{ value: T; label: string }>
  error?: string
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange' | 'id'>) {
  const generated = useId()
  const inputId = id ?? generated
  const normalised = (options as ReadonlyArray<T | { value: T; label: string }>).map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option,
  )
  return (
    <select
      id={inputId}
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
      aria-invalid={Boolean(error)}
      className="field"
      {...rest}
    >
      {normalised.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  description?: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded border border-line bg-ink-950/60 p-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors',
          checked ? 'border-signal-400/60 bg-signal-500/70' : 'border-ink-600 bg-ink-800',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all',
            checked ? 'left-[1.15rem]' : 'left-0.5',
          )}
        />
      </button>
      <span>
        <span className="block text-xs font-medium text-silver-200">{label}</span>
        {description ? <span className="mt-0.5 block text-[0.6875rem] text-silver-500">{description}</span> : null}
      </span>
    </label>
  )
}

/* ---------------------------- Image uploader --------------------------- */
export function ImageUploader({
  label,
  value,
  onChange,
  bucket,
  folder = 'uploads',
  error,
  hint,
  aspect = 'aspect-[16/10]',
}: {
  label: string
  value: string | null
  onChange: (url: string | null) => void
  bucket: Bucket
  folder?: string
  error?: string
  hint?: string
  aspect?: string
}) {
  const [progress, setProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputId = useId()

  async function handleFile(file: File | undefined) {
    if (!file) return
    setUploadError(null)
    setProgress(0)
    try {
      const result = await uploadImage(file, { bucket, folder, onProgress: setProgress })
      onChange(result.url)
      setProgress(100)
    } catch (cause) {
      setUploadError(cause instanceof UploadValidationError || cause instanceof Error ? cause.message : 'Upload failed.')
      setProgress(null)
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-silver-300">{label}</p>
      <div className="rounded border border-line bg-ink-950/50 p-3">
        {value ? (
          <div className="relative">
            <img
              src={value}
              alt="Upload preview"
              className={cn('w-full rounded object-cover', aspect)}
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-line bg-ink-950/90 text-silver-300 hover:text-danger-400"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div className={cn('grid w-full place-items-center rounded border border-dashed border-line text-center', aspect)}>
            <div className="px-3">
              <Upload className="mx-auto mb-1.5 h-5 w-5 text-silver-600" aria-hidden="true" />
              <p className="text-[0.6875rem] text-silver-500">No image uploaded</p>
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label
            htmlFor={inputId}
            className="btn btn-ghost btn-sm cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            {value ? 'Replace image' : 'Upload image'}
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="sr-only"
            onChange={(event) => {
              void handleFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />
          <input
            type="url"
            placeholder="or paste an image URL"
            defaultValue={value && !value.startsWith('data:') ? value : ''}
            onBlur={(event) => {
              const next = event.target.value.trim()
              if (next && next !== value) onChange(next)
            }}
            className="field min-w-0 flex-1 py-1.5 text-xs"
            aria-label={`${label} URL`}
          />
        </div>

        {progress !== null ? (
          <div className="mt-2.5">
            <div className="h-1 w-full overflow-hidden rounded-full bg-ink-700">
              <div
                className="h-full rounded-full bg-signal-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-500">
              Uploading · {progress}%
            </p>
          </div>
        ) : null}

        {uploadError ? <p className="mt-2 text-xs text-danger-400">{uploadError}</p> : null}
        {error ? <p className="mt-2 text-xs text-danger-400">{error}</p> : null}
        {hint && !error ? <p className="mt-2 text-[0.6875rem] text-silver-600">{hint}</p> : null}
      </div>
    </div>
  )
}

/* --------------------------- Repeater section -------------------------- */
export function RepeaterSection({
  title,
  description,
  onAdd,
  addLabel,
  children,
  emptyMessage,
}: {
  title: string
  description?: string
  onAdd: () => void
  addLabel: string
  children: ReactNode
  emptyMessage: string
}) {
  return (
    <fieldset className="rounded border border-line bg-ink-925/40 p-3 sm:p-4">
      <legend className="px-1 text-xs font-semibold uppercase tracking-[0.1em] text-silver-300">{title}</legend>
      {description ? <p className="mb-3 text-[0.6875rem] leading-relaxed text-silver-600">{description}</p> : null}
      <div className="space-y-2.5">{children}</div>
      {children ? null : <p className="text-xs text-silver-600">{emptyMessage}</p>}
      <button type="button" onClick={onAdd} className="btn btn-ghost btn-sm mt-3">
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        {addLabel}
      </button>
    </fieldset>
  )
}

export function RepeaterRow({ onRemove, children }: { onRemove: () => void; children: ReactNode }) {
  return (
    <div className="relative rounded border border-line bg-ink-950/60 p-2.5 pr-9">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded text-silver-500 transition-colors hover:bg-danger-400/10 hover:text-danger-400"
        aria-label="Remove this entry"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

/* ---------------------------- Submit footer ---------------------------- */
export function FormActions({
  onSubmit,
  onCancel,
  saving,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  dirty,
}: {
  onSubmit?: () => void
  onCancel?: () => void
  saving: boolean
  submitLabel?: string
  cancelLabel?: string
  dirty?: boolean
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line bg-ink-900/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:px-5">
      <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-600">
        {saving ? 'Saving…' : dirty ? 'Unsaved changes' : 'No unsaved changes'}
      </p>
      <div className="flex gap-2">
        {onCancel ? (
          <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm" disabled={saving}>
            {cancelLabel}
          </button>
        ) : null}
        <ActionButton
          type="button"
          onClick={onSubmit}
          loading={saving}
          variant="primary"
          size="sm"
        >
          {saving ? 'Saving' : submitLabel}
        </ActionButton>
      </div>
    </div>
  )
}

export function SavingOverlay({ label = 'Saving changes' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-silver-400" role="status" aria-live="polite">
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      {label}
    </div>
  )
}
