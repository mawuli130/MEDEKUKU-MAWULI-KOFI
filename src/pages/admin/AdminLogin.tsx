import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowLeft, KeyRound, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react'
import { LogoMark } from '@/components/brand/Logo'
import { Seo } from '@/components/seo/Seo'
import { useAuth } from '@/hooks/useAuth'
import { loginSchema, fieldErrors } from '@/lib/validation'
import { authService } from '@/services/auth'
import { DATA_SOURCE, DEMO_CREDENTIALS } from '@/lib/config'

export default function AdminLogin() {
  const { signIn, email, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [mode, setMode] = useState<'signin' | 'reset'>('signin')

  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/admin/dashboard'

  if (!loading && email) return <Navigate to={redirectTo} replace />

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setNotice(null)

    if (mode === 'reset') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
        setErrors({ email: 'Enter a valid email address.' })
        return
      }
      setSubmitting(true)
      try {
        await authService.requestPasswordReset(values.email)
        setNotice('If that address belongs to an administrator, a password reset link has been sent.')
        setErrors({})
      } catch (error) {
        setFormError(error instanceof Error ? error.message : 'The reset request failed.')
      } finally {
        setSubmitting(false)
      }
      return
    }

    const parsed = loginSchema.safeParse(values)
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      return
    }

    setSubmitting(true)
    try {
      await signIn(parsed.data.email, parsed.data.password)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Sign in failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-ink-950">
      <Seo
        title="Administrator sign in — Mawuli Engineering & Diagnostic Services"
        description="Secure administrator access for the Mawuli Diagnostics content dashboard."
        path="/admin"
        noindex
      />

      <div className="grid-overlay pointer-events-none absolute inset-0 opacity-30" aria-hidden="true" />
      <div className="blueprint-glow pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-1.5 text-xs text-silver-500 transition-colors hover:text-signal-300"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to portfolio
          </Link>

          <div className="panel overflow-hidden">
            <div className="flex items-center gap-3 border-b border-line bg-ink-900 p-5">
              <LogoMark className="h-10 w-10" />
              <div>
                <h1 className="font-display text-base font-semibold uppercase tracking-[0.12em] text-white">
                  Administrator
                </h1>
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-silver-500">
                  Content dashboard
                </p>
              </div>
              <ShieldCheck className="ml-auto h-5 w-5 text-signal-400" aria-hidden="true" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
              <p className="text-xs leading-relaxed text-silver-400">
                {mode === 'signin'
                  ? 'Sign in to manage projects, diagnostic case studies, videos, gallery images and website content.'
                  : 'Enter the administrator email address to request a password reset link.'}
              </p>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-silver-300">
                  Email address
                </label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-600"
                    aria-hidden="true"
                  />
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={values.email}
                    onChange={(event) => setValues((v) => ({ ...v, email: event.target.value }))}
                    onBlur={() => {
                      if (DATA_SOURCE === 'local' && !values.email) {
                        setValues((v) => ({ ...v, email: DEMO_CREDENTIALS.email }))
                      }
                    }}
                    aria-invalid={Boolean(errors.email)}
                    className="field pl-9"
                    placeholder="admin@example.com"
                    disabled={submitting}
                  />
                </div>
                {errors.email ? <p className="mt-1.5 text-xs text-danger-400">{errors.email}</p> : null}
              </div>

              {mode === 'signin' ? (
                <div>
                  <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-silver-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-600"
                      aria-hidden="true"
                    />
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={values.password}
                      onChange={(event) => setValues((v) => ({ ...v, password: event.target.value }))}
                      aria-invalid={Boolean(errors.password)}
                      className="field pl-9"
                      placeholder="••••••••••••"
                      disabled={submitting}
                    />
                  </div>
                  {errors.password ? <p className="mt-1.5 text-xs text-danger-400">{errors.password}</p> : null}
                </div>
              ) : null}

              {formError ? (
                <div className="flex items-start gap-2 rounded border border-danger-400/40 bg-danger-400/[0.08] px-3 py-2 text-xs text-danger-400">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <p>{formError}</p>
                </div>
              ) : null}

              {notice ? (
                <div className="rounded border border-ok-400/40 bg-ok-400/[0.08] px-3 py-2 text-xs text-ok-400">
                  {notice}
                </div>
              ) : null}

              <button type="submit" className="btn btn-primary w-full justify-center" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Please wait…
                  </>
                ) : mode === 'signin' ? (
                  <>
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                    Sign in
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>

              <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setMode((current) => (current === 'signin' ? 'reset' : 'signin'))
                    setFormError(null)
                    setNotice(null)
                  }}
                  className="text-xs text-silver-400 transition-colors hover:text-signal-300"
                >
                  {mode === 'signin' ? 'Forgot password?' : 'Back to sign in'}
                </button>
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.1em] text-silver-600">
                  {DATA_SOURCE === 'supabase' ? 'Supabase Auth' : 'Local preview auth'}
                </span>
              </div>
            </form>
          </div>

          {DATA_SOURCE === 'local' ? (
            <div className="mt-4 rounded border border-warn-400/30 bg-warn-400/[0.06] p-3 text-[0.6875rem] leading-relaxed text-silver-400">
              <p className="mb-1 font-semibold text-warn-400">Local preview mode</p>
              <p>
                Supabase credentials are not configured, so admin access uses a local session. Preview credentials:{' '}
                <code className="font-mono text-silver-200">{DEMO_CREDENTIALS.email}</code> /{' '}
                <code className="font-mono text-silver-200">{DEMO_CREDENTIALS.password}</code>
              </p>
              <p className="mt-1.5">
                Set <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
                <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> for real Supabase Auth. There is no public
                registration.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-center text-[0.6875rem] text-silver-600">
              Administrator accounts are created in the Supabase dashboard and authorised in the{' '}
              <code className="font-mono">admin_users</code> table. Public registration is disabled.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
