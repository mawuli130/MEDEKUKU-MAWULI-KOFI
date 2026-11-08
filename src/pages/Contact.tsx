import { useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Mail, MapPin, MessageSquare, Send, ShieldCheck } from 'lucide-react'
import { Seo, breadcrumbJsonLd, personJsonLd } from '@/components/seo/Seo'
import { Callout, PageHeader, Section } from '@/components/ui'
import { SocialLinks, socialHref } from '@/components/layout/SocialLinks'
import { useSiteData } from '@/hooks/useSiteData'
import { getRepository } from '@/services'
import { contactFormSchema, fieldErrors } from '@/lib/validation'
import { getSupabaseClient } from '@/lib/supabase'
import { DATA_SOURCE } from '@/lib/config'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export default function Contact() {
  const { profile, settings, socialLinks } = useSiteData()
  const repository = getRepository()

  const [values, setValues] = useState({ name: '', email: '', subject: '', message: '', company: '' })
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [state, setState] = useState<FormState>('idle')
  const [feedback, setFeedback] = useState<string | null>(null)

  const formEnabled = settings.allow_contact_form !== 'false'
  const emailLink = socialLinks.find((link) => link.platform === 'email')
  const whatsappLink = socialLinks.find((link) => link.platform === 'whatsapp')
  const phoneLink = socialLinks.find((link) => link.platform === 'phone')

  function update(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (state === 'submitting') return
    setFeedback(null)

    const parsed = contactFormSchema.safeParse({ ...values, consent })
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error))
      setState('error')
      setFeedback('Please correct the highlighted fields and try again.')
      return
    }

    // Honeypot: silently accept but do not store.
    if (parsed.data.company) {
      setState('success')
      setFeedback('Thank you — your message has been received.')
      return
    }

    setState('submitting')
    setErrors({})

    try {
      // Lightweight spam throttle per browser.
      const throttleKey = 'mawuli.contact.last'
      const last = Number(window.localStorage.getItem(throttleKey) ?? '0')
      if (Date.now() - last < 30_000) {
        throw new Error('Please wait about 30 seconds before sending another message.')
      }

      await repository.messages.submit({
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
        token: getSupabaseClient() ? 'supabase' : 'local',
      })

      window.localStorage.setItem(throttleKey, String(Date.now()))
      setState('success')
      setFeedback('Thank you — your message has been stored securely and only the administrator can read it.')
      setValues({ name: '', email: '', subject: '', message: '', company: '' })
      setConsent(false)
    } catch (error) {
      setState('error')
      setFeedback(
        error instanceof Error
          ? error.message
          : 'Your message could not be sent. Please try again, or use the direct email link.',
      )
    }
  }

  return (
    <>
      <Seo
        title="Contact — Medekuku Mawuli Kofi, Automotive Diagnostic Technician (Accra)"
        description="Contact Medekuku Mawuli Kofi for automotive diagnostic work, workshop roles, technical collaboration or training opportunities in Accra, Ghana."
        path="/contact"
        image={profile.profile_image}
        jsonLd={[
          personJsonLd({
            name: profile.full_name,
            jobTitle: profile.headline,
            city: 'Accra',
            country: 'Ghana',
            image: profile.profile_image,
            sameAs: socialLinks
              .filter((link) => ['youtube', 'linkedin', 'facebook', 'x'].includes(link.platform))
              .map((link) => socialHref(link)),
          }),
          breadcrumbJsonLd([
            { label: 'Home', path: '/' },
            { label: 'Contact', path: '/contact' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'Contact Medekuku Mawuli Kofi',
            mainEntity: {
              '@type': 'Person',
              name: profile.full_name,
              jobTitle: profile.headline,
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Accra',
                addressCountry: 'Ghana',
              },
            },
          },
        ]}
      />

      <PageHeader
        eyebrow="Contact"
        title="Start a conversation"
        description={
          settings.contact_intro ||
          'For workshop roles, diagnostic work, technical collaboration or training opportunities, send a message using the form.'
        }
      />

      <Section>
        <div className="container-page grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-11">
          {/* Form */}
          <div className="panel p-5 sm:p-7">
            <h2 className="text-xl font-semibold">Send a message</h2>
            <p className="mt-1.5 text-sm text-silver-400">
              Messages are stored securely. Only the administrator can read them.
            </p>

            {!formEnabled ? (
              <div className="mt-5">
                <Callout title="Contact form is temporarily closed" tone="warn">
                  Please use the direct email or WhatsApp links alongside this form.
                </Callout>
              </div>
            ) : null}

            <form className="mt-5 space-y-4" onSubmit={onSubmit} noValidate aria-describedby="form-status">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="name"
                  label="Full name"
                  required
                  value={values.name}
                  error={errors.name}
                  autoComplete="name"
                  onChange={(value) => update('name', value)}
                  disabled={state === 'submitting' || !formEnabled}
                />
                <Field
                  id="email"
                  label="Email address"
                  type="email"
                  required
                  value={values.email}
                  error={errors.email}
                  autoComplete="email"
                  onChange={(value) => update('email', value)}
                  disabled={state === 'submitting' || !formEnabled}
                />
              </div>

              <Field
                id="subject"
                label="Subject"
                required
                value={values.subject}
                error={errors.subject}
                onChange={(value) => update('subject', value)}
                placeholder="Workshop role, diagnostic enquiry, collaboration…"
                disabled={state === 'submitting' || !formEnabled}
              />

              <div>
                <label htmlFor="message" className="mb-1.5 block text-xs font-medium text-silver-300">
                  Message <span className="text-danger-400">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  value={values.message}
                  onChange={(event) => update('message', event.target.value)}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={errors.message ? 'message-error' : 'message-hint'}
                  disabled={state === 'submitting' || !formEnabled}
                  className="field"
                  placeholder="Describe the vehicle, the fault or the opportunity…"
                />
                {errors.message ? (
                  <p id="message-error" className="mt-1.5 text-xs text-danger-400">
                    {errors.message}
                  </p>
                ) : (
                  <p id="message-hint" className="mt-1.5 text-xs text-silver-600">
                    {values.message.length}/4000 characters
                  </p>
                )}
              </div>

              {/* Honeypot — hidden from users and assistive tech */}
              <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                <label htmlFor="company">Company</label>
                <input
                  id="company"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  value={values.company}
                  onChange={(event) => update('company', event.target.value)}
                />
              </div>

              <div>
                <label className="flex items-start gap-2.5 text-xs leading-relaxed text-silver-400">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => {
                      setConsent(event.target.checked)
                      setErrors((current) => {
                        const next = { ...current }
                        delete next.consent
                        return next
                      })
                    }}
                    disabled={state === 'submitting' || !formEnabled}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-line bg-ink-950 accent-signal-500"
                    aria-invalid={Boolean(errors.consent)}
                  />
                  <span>
                    I agree that my name, email and message may be stored so this enquiry can be answered.
                    {errors.consent ? <span className="mt-1 block text-danger-400">{errors.consent}</span> : null}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full justify-center sm:w-auto"
                disabled={state === 'submitting' || !formEnabled}
              >
                {state === 'submitting' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    Send message
                  </>
                )}
              </button>

              <div id="form-status" aria-live="polite" role="status">
                {feedback ? (
                  <div
                    className={`flex items-start gap-2.5 rounded border px-3 py-2.5 text-sm ${
                      state === 'success'
                        ? 'border-ok-400/40 bg-ok-400/[0.08] text-ok-400'
                        : 'border-danger-400/40 bg-danger-400/[0.08] text-danger-400'
                    }`}
                  >
                    {state === 'success' ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    )}
                    <p className="text-silver-200">{feedback}</p>
                  </div>
                ) : null}
              </div>

              {DATA_SOURCE === 'local' ? (
                <p className="border-t border-line pt-3 text-[0.6875rem] leading-relaxed text-silver-600">
                  This preview is running without a Supabase backend, so messages are stored only in this browser.
                  Configure <code className="font-mono">VITE_SUPABASE_URL</code> and{' '}
                  <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> to store enquiries in PostgreSQL.
                </p>
              ) : null}
            </form>
          </div>

          {/* Details */}
          <aside className="space-y-4">
            <div className="panel p-5">
              <h2 className="label-tech mb-3">Direct contact</h2>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-signal-500" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-silver-100">{profile.location || 'Accra, Ghana'}</p>
                    <p className="text-xs text-silver-500">Workshop and diagnostic services</p>
                  </div>
                </li>
                {emailLink ? (
                  <li className="flex items-start gap-2.5">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-signal-500" aria-hidden="true" />
                    <div>
                      <a href={socialHref(emailLink)} className="font-medium text-silver-100 hover:text-signal-300">
                        {emailLink.url.replace(/^mailto:/, '')}
                      </a>
                      <p className="text-xs text-silver-500">Email</p>
                    </div>
                  </li>
                ) : null}
                {whatsappLink ? (
                  <li className="flex items-start gap-2.5">
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-signal-500" aria-hidden="true" />
                    <div>
                      <a
                        href={socialHref(whatsappLink)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-silver-100 hover:text-signal-300"
                      >
                        WhatsApp
                      </a>
                      <p className="text-xs text-silver-500">{whatsappLink.handle || 'Message directly'}</p>
                    </div>
                  </li>
                ) : null}
                {phoneLink ? (
                  <li className="flex items-start gap-2.5">
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-signal-500" aria-hidden="true" />
                    <div>
                      <a href={socialHref(phoneLink)} className="font-medium text-silver-100 hover:text-signal-300">
                        {phoneLink.url}
                      </a>
                      <p className="text-xs text-silver-500">Phone</p>
                    </div>
                  </li>
                ) : null}
              </ul>

              {!emailLink && !whatsappLink && !phoneLink ? (
                <p className="mt-3 text-xs leading-relaxed text-silver-600">
                  Direct contact channels are added by the administrator. Until then, use the message form.
                </p>
              ) : null}
            </div>

            <div className="panel p-5">
              <h2 className="label-tech mb-3">Social &amp; professional</h2>
              {socialLinks.length ? (
                <SocialLinks links={socialLinks} showLabels />
              ) : (
                <p className="text-xs leading-relaxed text-silver-600">
                  Social profiles are added from the dashboard once available.
                </p>
              )}
            </div>

            <Callout title="Privacy" >
              Only your name, email, subject and message are collected. Messages are readable solely by the
              authenticated administrator and are never published on the site.
            </Callout>

            <div className="panel flex items-start gap-2.5 p-4 text-xs text-silver-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok-400" aria-hidden="true" />
              <p>Form submissions are rate-limited in the browser and covered by database row-level security.</p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  type = 'text',
  required = false,
  placeholder,
  autoComplete,
  disabled,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  type?: string
  required?: boolean
  placeholder?: string
  autoComplete?: string
  disabled?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-silver-300">
        {label} {required ? <span className="text-danger-400">*</span> : null}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="field"
      />
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-danger-400">
          {error}
        </p>
      ) : null}
    </div>
  )
}
