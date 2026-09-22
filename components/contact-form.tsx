'use client'

import { useRef, useState } from 'react'
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

// The form has no backend yet. When a contact email is configured, submitting
// opens the visitor's email app with the message pre-filled so it can actually
// be delivered.
function buildMailto(email: string, form: HTMLFormElement) {
  const data = new FormData(form)
  const field = (name: string) => String(data.get(name) ?? '').trim()
  const lines = [
    ['Name', field('name')],
    ['Organization / affiliation', field('affiliation')],
    ['Email', field('email')],
    ['Connection', field('connection')],
    ['Topic', field('topic')],
    ['Organization / program involved', field('program')],
    ['Preferred contact method', field('contact_method')],
    ['Phone', field('phone')],
    ['Preferred contact time', field('contact_time')],
  ].filter(([, v]) => v)
  const body = `${field('message')}\n\n---\n${lines.map(([k, v]) => `${k}: ${v}`).join('\n')}`
  const subject = `PEARL enquiry: ${field('topic') || 'General'}`
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export function ContactForm({
  email,
  notice,
  confirmationTitle,
  confirmationBody,
}: {
  email: string
  notice: string
  confirmationTitle: string
  confirmationBody: string
}) {
  const [submitted, setSubmitted] = useState(false)
  const confirmationRef = useRef<HTMLDivElement>(null)

  if (submitted) {
    return (
      <div className="form-confirmation" role="status" tabIndex={-1} ref={confirmationRef}>
        <h3>{confirmationTitle}</h3>
        <p>{confirmationBody}</p>
        {email && (
          <p className="form-confirmation-note">
            Your email app should have opened with your message. Press send there to deliver it, or write to us directly at <a href={`mailto:${email}`}>{email}</a>.
          </p>
        )}
      </div>
    )
  }

  return (
    <form
      className="contact-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (email) window.location.href = buildMailto(email, e.currentTarget)
        setSubmitted(true)
        requestAnimationFrame(() => confirmationRef.current?.focus())
      }}
    >
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

      <button className="button button-primary" type="submit">Send message <ArrowUpRight aria-hidden="true" /></button>
    </form>
  )
}
