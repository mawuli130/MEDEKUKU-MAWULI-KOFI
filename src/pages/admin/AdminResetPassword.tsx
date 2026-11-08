import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, KeyRound, Loader2 } from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'
import { Seo } from '@/components/seo/Seo'
import { updatePassword } from '@/services/auth'
import { passwordSchema, fieldErrors } from '@/lib/validation'
import { DATA_SOURCE } from '@/lib/config'

/**
 * Landing page for the Supabase password-recovery link. Supabase exchanges the
 * recovery token from the URL hash on load (detectSessionInUrl), after which the
 * user can set a new password.
 */
export default function AdminResetPassword() {
  const navigate = useNavigate()
  const [values, setValues] = useState({ password: '', confirm: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    const parsed = passwordSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }
    setSubmitting(true)
    try {
      await updatePassword(parsed.data.password)
      navigate('/admin', { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'The password could not be updated.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-ink-950">
      <Seo
        title="Set a new password — Mawuli Diagnostics administrator"
        description="Reset the administrator password for the Mawuli Diagnostics content dashboard."
        path="/admin/reset-password"
        noindex
      />
      <div className="grid-overlay pointer-events-none absolute inset-0 opacity-25" aria-hidden="true" />
      <div className="relative flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link
            to="/admin"
            className="mb-6 inline-flex items-center gap-1.5 text-xs text-silver-500 transition-colors hover:text-signal-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to sign in
          </Link>
          <div className="panel overflow-hidden">
            <div className="flex items-center gap-3 border-b border-line bg-ink-900 p-5">
              <LogoMark className="h-10 w-10" />
              <div>
                <h1 className="font-display text-base font-semibold uppercase tracking-[0.12em] text-white">
                  New password
                </h1>
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-silver-500">
                  Account recovery
                </p>
              </div>
            </div>
            <form onSubmit={onSubmit} className="space-y-4 p-5" noValidate>
              {DATA_SOURCE === 'local' ? (
                <p className="rounded border border-warn-400/35 bg-warn-400/[0.07] p-3 text-xs text-silver-300">
                  Password reset requires Supabase authentication. Configure the Supabase environment variables to use
                  this page.
                </p>
              ) : null}

              <div>
                <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-silver-300">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={values.password}
                  onChange={(event) => setValues((v) => ({ ...v, password: event.target.value }))}
                  className="field"
                  disabled={submitting}
                />
                {errors.password ? <p className="mt-1.5 text-xs text-danger-400">{errors.password}</p> : null}
                <p className="mt-1.5 text-[0.6875rem] text-silver-600">
                  At least 12 characters with upper and lower case letters and a number.
                </p>
              </div>

              <div>
                <label htmlFor="confirm" className="mb-1.5 block text-xs font-medium text-silver-300">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  autoComplete="new-password"
                  value={values.confirm}
                  onChange={(event) => setValues((v) => ({ ...v, confirm: event.target.value }))}
                  className="field"
                  disabled={submitting}
                />
                {errors.confirm ? <p className="mt-1.5 text-xs text-danger-400">{errors.confirm}</p> : null}
              </div>

              {formError ? (
                <div className="flex items-start gap-2 rounded border border-danger-400/40 bg-danger-400/[0.08] px-3 py-2 text-xs text-danger-400">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <p>{formError}</p>
                </div>
              ) : null}

              <button type="submit" className="btn btn-primary w-full justify-center" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Updating…
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                    Update password
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
