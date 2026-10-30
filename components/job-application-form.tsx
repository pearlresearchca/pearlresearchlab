'use client'

import { useRef, useState, useTransition } from 'react'
import { CheckCircle2, FileText, Loader2, Upload, X } from 'lucide-react'
import { submitJobApplicationAction } from '@/lib/jobs/actions'

const MAX_BYTES = 3 * 1024 * 1024
const ACCEPT = '.pdf,.doc,.docx,.rtf,.txt'

// Public application form for one job posting. Server-side validation is the
// source of truth; checks here just give faster feedback.
export function JobApplicationForm({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [drag, setDrag] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  function pick(f: File | null | undefined) {
    setError(null)
    if (!f) return
    if (f.size > MAX_BYTES) return setError('Your résumé must be 3 MB or smaller.')
    if (!/\.(pdf|docx?|rtf|txt)$/i.test(f.name)) return setError('Please upload your résumé as a PDF or Word document.')
    setFile(f)
  }

  if (done) {
    return (
      <div className="job-apply-done" role="status">
        <CheckCircle2 aria-hidden="true" />
        <h3>Application sent — thank you!</h3>
        <p>We’ve received your application for {jobTitle}. If your background is a fit, we’ll contact you by email.</p>
      </div>
    )
  }

  return (
    <form
      className="job-apply"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        if (!file) return setError('Please attach your résumé or CV.')
        fd.set('resume', file)
        setError(null)
        start(async () => {
          const r = await submitJobApplicationAction(jobId, fd)
          if ('error' in r) setError(r.error)
          else setDone(true)
        })
      }}
    >
      {/* Honeypot for bots */}
      <input type="text" name="__website" tabIndex={-1} autoComplete="off" className="pb-hp" aria-hidden="true" />
      <div className="job-apply-grid">
        <label>
          <span>Full name <em aria-hidden="true">*</em></span>
          <input name="name" required autoComplete="name" maxLength={200} />
        </label>
        <label>
          <span>Email <em aria-hidden="true">*</em></span>
          <input name="email" type="email" required autoComplete="email" maxLength={200} />
        </label>
        <label>
          <span>Phone</span>
          <input name="phone" type="tel" autoComplete="tel" maxLength={50} />
        </label>
        <label>
          <span>LinkedIn or portfolio</span>
          <input name="profile_url" type="url" placeholder="https://" maxLength={500} />
        </label>
      </div>

      <div
        className={`job-drop${drag ? ' is-drag' : ''}${file ? ' has-file' : ''}`}
        onDragOver={(e) => (e.preventDefault(), setDrag(true))}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          pick(e.dataTransfer.files?.[0])
        }}
      >
        {file ? (
          <>
            <FileText aria-hidden="true" />
            <span className="job-drop-name">{file.name}</span>
            <span className="job-drop-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
            <button type="button" onClick={() => setFile(null)} aria-label="Remove file"><X aria-hidden="true" /></button>
          </>
        ) : (
          <>
            <Upload aria-hidden="true" />
            <span>
              <button type="button" className="job-drop-browse" onClick={() => input.current?.click()}>Choose your résumé</button> or drop it here
            </span>
            <span className="job-drop-hint">PDF or Word · up to 3 MB · required</span>
          </>
        )}
        <input ref={input} type="file" accept={ACCEPT} className="sr-only" tabIndex={-1} aria-label="Résumé file" onChange={(e) => pick(e.target.files?.[0])} />
      </div>

      <label>
        <span>Why are you interested? <em aria-hidden="true">*</em></span>
        <textarea name="message" required rows={5} maxLength={5000} placeholder="Your background, what draws you to this role, and when you could start." />
      </label>

      <label className="job-consent">
        <input type="checkbox" name="consent" required />
        <span>I agree that PEARL may store my application and résumé to review it. Applications are deleted automatically after 7 days.</span>
      </label>

      {error && <p className="job-apply-error" role="alert">{error}</p>}

      <button type="submit" className="button button-primary job-apply-submit" disabled={pending}>
        {pending ? <><Loader2 className="job-spin" aria-hidden="true" /> Sending…</> : 'Submit application'}
      </button>
    </form>
  )
}
