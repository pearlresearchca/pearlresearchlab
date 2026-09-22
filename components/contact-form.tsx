'use client'

import { useRef, useState } from 'react'
import { submitContactFormAction } from '@/lib/builder/form-actions'
import { ArrowUpRight } from 'lucide-react'

const CONNECTION_TYPES = [
  'Community member',
  'Community-based organization',
  'Health or social-service organization',
  'Health-system partner',
  'Hospital or health centre',
  'Government / public-sector organization',
  'Professional association',
  'Advocacy organization',
  'Researcher / academic',
  'Student',
  'Other',
]

const TOPICS = [
  'Community priority or concern',
  'Research collaboration',
  'Program evaluation',
  'Quality improvement',
  'Evidence synthesis',
  'Knowledge mobilization',
  'Community consultation',
  'Health-workforce planning',
  'Student / practicum opportunity',
  'Potential grant or proposal collaboration',
  'Partnership / networking',
  'Other',
]

const CONTACT_METHODS = ['Email', 'Phone', 'Either']

function Required() {
  return <span className="required-mark" aria-hidden="true">*</span>
}

export function ContactForm({
  notice,
  confirmationTitle,
  confirmationBody,
}: {
  notice: string
  confirmationTitle: string
  confirmationBody: string
}) {
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // One token per form fill: if the network drops after the server saved the
  // message, resending the same fill is recognised and not stored twice.
  const [token] = useState(() => crypto.randomUUID())
  const confirmationRef = useRef<HTMLDivElement>(null)

  if (submitted) {
    return (
      <div className="form-confirmation" role="status" tabIndex={-1} ref={confirmationRef}>
        <h3>{confirmationTitle}</h3>
        <p>{confirmationBody}</p>
      </div>
    )
  }

  return (
    <form
      className="contact-form"
      onSubmit={async (e) => {
        e.preventDefault()
        if (sending) return
        setError(null)
        setSending(true)
        const fd = new FormData(e.currentTarget)
        // Field names are prefixed to match the server-side definition.
        const payload = new FormData()
        fd.forEach((value, key) => payload.set(key.startsWith('__') ? key : `f_${key}`, value))
        payload.set('__token', token)
        try {
          const result = await submitContactFormAction(payload)
          if ('error' in result) {
            setError(result.error)
            return
          }
          setSubmitted(true)
          requestAnimationFrame(() => confirmationRef.current?.focus())
        } catch {
          setError('Your message could not be sent. Please check your connection and try again.')
        } finally {
          setSending(false)
        }
      }}
    >
      <div className="pb-hp" aria-hidden="true">
        <label>
          Leave this empty
          <input type="text" name="__website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label htmlFor="cf-name">Name<Required /></label>
      <input id="cf-name" name="name" required autoComplete="name" />

      <label htmlFor="cf-affiliation">Organization / Community / Affiliation</label>
      <input id="cf-affiliation" name="affiliation" autoComplete="organization" />

      <label htmlFor="cf-email">Email address<Required /></label>
      <input id="cf-email" name="email" type="email" required autoComplete="email" />

      <label htmlFor="cf-connection">What best describes your connection?</label>
      <select id="cf-connection" name="connection" defaultValue="">
        <option value="">Select an option</option>
        {CONNECTION_TYPES.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>

      <label htmlFor="cf-topic">What would you like to discuss?<Required /></label>
      <select id="cf-topic" name="topic" required defaultValue="">
        <option value="" disabled>Select a topic</option>
        {TOPICS.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>

      <label htmlFor="cf-message">Tell us more about your question, priority, or idea.<Required /></label>
      <textarea id="cf-message" name="message" required rows={6} />

      <label htmlFor="cf-program">Organization / community / program involved</label>
      <input id="cf-program" name="program" />

      <fieldset>
        <legend>How would you like PEARL to connect with you?<Required /></legend>
        <div className="choice-row">
          {CONTACT_METHODS.map((m) => (
            <label key={m}>
              <input type="radio" name="contact_method" value={m} required />
              {m}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field-row">
        <div>
          <label htmlFor="cf-phone">Phone number</label>
          <input id="cf-phone" name="phone" type="tel" autoComplete="tel" />
        </div>
        <div>
          <label htmlFor="cf-time">Preferred contact time</label>
          <input id="cf-time" name="contact_time" placeholder="e.g. weekday mornings" />
        </div>
      </div>

      {notice && <p className="sensitive-notice">{notice}</p>}

      {error && <p className="form-error" role="alert" style={{ color: '#b42318', fontSize: 14, margin: '8px 0 0' }}>{error}</p>}

      <button className="button button-primary" type="submit" disabled={sending} aria-busy={sending}>
        {sending ? 'Sending…' : 'Send message'} <ArrowUpRight aria-hidden="true" />
      </button>
    </form>
  )
}
