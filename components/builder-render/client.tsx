'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { submitFormAction } from '@/lib/builder/form-actions'

// Adds `.is-in` to animated blocks as they scroll into view. Respects
// reduced-motion via CSS (animations only exist under no-preference).
export function AnimateOnScroll() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.pb-anim'))
    if (els.length === 0) return
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const repeat = e.target.classList.contains('pb-anim--repeat')
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            if (!repeat) io.unobserve(e.target)
          } else if (repeat && e.boundingClientRect.top > 0) {
            // Replay when it scrolls back in from below.
            e.target.classList.remove('is-in')
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return null
}

type GalleryImage = { id: string; src: string; alt: string; caption: string }

export function GalleryBlock({ images, columns, gap, aspect, lightbox, captions }: { images: GalleryImage[]; columns: number; gap: string; aspect: string; lightbox: boolean; captions: boolean }) {
  const [open, setOpen] = useState<number | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)

  const close = useCallback(() => {
    setOpen(null)
    returnFocus.current?.focus()
  }, [])

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % images.length))
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length))
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, images.length, close])

  return (
    <>
      <div className="pb-gallery" style={{ '--pb-gallery-cols': columns, '--pb-gallery-gap': gap } as React.CSSProperties}>
        {images.map((img, i) => {
          const frame = (
            <div className="pb-gallery-frame" style={aspect !== 'auto' ? { aspectRatio: aspect } : undefined}>
              <img src={img.src} alt={img.alt} loading="lazy" decoding="async" />
            </div>
          )
          return (
            <figure key={img.id}>
              {lightbox ? (
                <button
                  type="button"
                  onClick={(e) => {
                    returnFocus.current = e.currentTarget
                    setOpen(i)
                  }}
                  aria-label={`Open image${img.alt ? `: ${img.alt}` : ''}`}
                >
                  {frame}
                </button>
              ) : (
                frame
              )}
              {captions && img.caption && <figcaption>{img.caption}</figcaption>}
            </figure>
          )
        })}
      </div>
      {open !== null &&
        images[open] &&
        createPortal(
          <div className="pb-lightbox" role="dialog" aria-modal="true" aria-label="Image viewer" onClick={close}>
            <img src={images[open].src} alt={images[open].alt} onClick={(e) => e.stopPropagation()} />
            {images[open].caption && <p>{images[open].caption}</p>}
            <button type="button" className="pb-lb-close" onClick={close} aria-label="Close" autoFocus>
              <X aria-hidden="true" />
            </button>
            {images.length > 1 && (
              <>
                <button type="button" className="pb-lb-prev" onClick={(e) => (e.stopPropagation(), setOpen((open - 1 + images.length) % images.length))} aria-label="Previous image">
                  <ChevronLeft aria-hidden="true" />
                </button>
                <button type="button" className="pb-lb-next" onClick={(e) => (e.stopPropagation(), setOpen((open + 1) % images.length))} aria-label="Next image">
                  <ChevronRight aria-hidden="true" />
                </button>
              </>
            )}
          </div>,
          document.body
        )}
    </>
  )
}

export function TabsBlock({ items, idPrefix }: { items: { id: string; label: string; body: string }[]; idPrefix: string }) {
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const current = Math.min(active, Math.max(0, items.length - 1))

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    let next = i
    if (e.key === 'ArrowRight') next = (i + 1) % items.length
    else if (e.key === 'ArrowLeft') next = (i - 1 + items.length) % items.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = items.length - 1
    else return
    e.preventDefault()
    setActive(next)
    refs.current[next]?.focus()
  }

  return (
    <>
      <div role="tablist">
        {items.map((item, i) => (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            role="tab"
            type="button"
            id={`${idPrefix}-tab-${item.id}`}
            aria-selected={i === current}
            aria-controls={`${idPrefix}-panel-${item.id}`}
            tabIndex={i === current ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item, i) => (
        <div key={item.id} role="tabpanel" id={`${idPrefix}-panel-${item.id}`} aria-labelledby={`${idPrefix}-tab-${item.id}`} hidden={i !== current} tabIndex={0}>
          {item.body}
        </div>
      ))}
    </>
  )
}

type FormField = { id: string; label: string; kind: string; required: boolean; placeholder: string; options: string; half: boolean }

export function FormBlock({ pageId, nodeId, props, preview }: { pageId: string; nodeId: string; props: Record<string, any>; preview: boolean }) {
  const fields = (props.fields ?? []) as FormField[]
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)
  const doneRef = useRef<HTMLDivElement>(null)
  const uid = useId()
  // One token per form fill, so a resend after a dropped connection isn't stored twice.
  const [token] = useState(() => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : ''))

  if (state === 'done') {
    return (
      <div className="pb-form-done" role="status" tabIndex={-1} ref={doneRef}>
        <h3>{props.confirmationTitle || 'Thank you!'}</h3>
        <p>{props.confirmationMessage}</p>
      </div>
    )
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (preview) return
    setError(null)
    setState('sending')
    const fd = new FormData(e.currentTarget)
    fd.set('__page', pageId)
    fd.set('__node', nodeId)
    if (token) fd.set('__token', token)
    try {
      const result = await submitFormAction(fd)
      if ('error' in result) {
        setError(result.error)
        setState('idle')
        return
      }
      setState('done')
      requestAnimationFrame(() => doneRef.current?.focus())
    } catch {
      setError('Your message could not be sent. Please check your connection and try again.')
      setState('idle')
    }
  }

  return (
    <form className="pb-form" onSubmit={onSubmit} noValidate={false}>
      {/* Honeypot for bots; hidden from people and assistive tech. */}
      <div className="pb-hp" aria-hidden="true">
        <label>
          Leave this empty
          <input type="text" name="__website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {fields.map((f) => {
        const id = `${uid}-${f.id}`
        const name = `f_${f.id}`
        const cls = `pb-form-field${f.half ? ' pb-form-field--half' : ''}`
        const req = f.required ? <span className="pb-req" aria-hidden="true">*</span> : null
        const options = String(f.options ?? '').split('\n').map((o) => o.trim()).filter(Boolean)
        if (f.kind === 'radio') {
          return (
            <fieldset key={f.id} className={cls}>
              <legend>{f.label}{req}</legend>
              {options.map((o) => (
                <label key={o} className="pb-choice">
                  <input type="radio" name={name} value={o} required={f.required} /> {o}
                </label>
              ))}
            </fieldset>
          )
        }
        if (f.kind === 'checkbox') {
          return (
            <div key={f.id} className={cls}>
              <label className="pb-choice">
                <input type="checkbox" name={name} value="Yes" required={f.required} /> {f.label}
                {req}
              </label>
            </div>
          )
        }
        return (
          <div key={f.id} className={cls}>
            <label htmlFor={id}>{f.label}{req}</label>
            {f.kind === 'textarea' ? (
              <textarea id={id} name={name} rows={6} required={f.required} placeholder={f.placeholder || undefined} maxLength={5000} />
            ) : f.kind === 'select' ? (
              <select id={id} name={name} required={f.required} defaultValue="">
                <option value="" disabled={f.required}>Select an option</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : f.kind === 'file' ? (
              <input id={id} name={name} type="file" required={f.required} accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp" />
            ) : (
              <input
                id={id}
                name={name}
                type={f.kind === 'email' ? 'email' : f.kind === 'tel' ? 'tel' : 'text'}
                required={f.required}
                placeholder={f.placeholder || undefined}
                autoComplete={f.kind === 'email' ? 'email' : f.kind === 'tel' ? 'tel' : /name/i.test(f.label) ? 'name' : undefined}
                maxLength={500}
              />
            )}
          </div>
        )
      })}
      {props.notice && <p className="pb-form-notice">{props.notice}</p>}
      <div className="pb-form-actions">
        <button className="pb-btn pb-btn--primary pb-btn--md" type="submit" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : props.submitLabel || 'Send'} <ArrowUpRight aria-hidden="true" />
        </button>
        {error && <p className="pb-form-error" role="alert">{error}</p>}
        {preview && <p className="pb-form-notice" style={{ gridColumn: 'auto', margin: 0 }}>Form preview — submissions work on the live page.</p>}
      </div>
    </form>
  )
}
