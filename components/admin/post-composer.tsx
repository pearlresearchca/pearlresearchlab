'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowDown, ArrowLeft, ArrowUp, BarChart3, Bold, Check, ChevronDown, Columns2, Copy, ExternalLink, Eye, LayoutTemplate, Palette, PenLine, Heading, Image as ImageIcon, Italic, Lightbulb, Link2,
  List, Loader2, Minus, MousePointerClick, MessagesSquare, PanelsLeftRight, Pilcrow, PlayCircle, Plus, Quote, Star, Trash2, Upload, X, type LucideIcon,
} from 'lucide-react'
import { insforge } from '@/lib/insforge/client'
import { PostArticle } from '@/components/blog/post-article'
import { StylePreview } from '@/components/admin/post-style-preview'
import { BLOCK_DEF, BLOCK_DEFS, POST_STYLES, POST_STYLE, blockId, blocksText, embedUrl, readingMinutesFromText, type PostBlock, type PostBlockType } from '@/lib/blog/blocks'
import { savePostAction, setPostStatusAction, deletePostAction, type PostDraft } from '@/app/admin/(dashboard)/blog/actions'

const ICONS: Record<string, LucideIcon> = { Pilcrow, Heading, Image: ImageIcon, PanelsLeftRight, Quote, List, Lightbulb, BarChart3, PlayCircle, MessagesSquare, MousePointerClick, Minus }

const input = 'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-surface focus:ring-4 focus:ring-primary/15'
const label = 'mb-1.5 block text-xs font-semibold text-slate-600'

// Placeholder prompts per style, so the empty starter blocks guide the writer.
const PROMPTS: Record<string, string> = {
  classic: 'Start writing your story…',
  research: 'Summarise the research in a few sentences…',
  interview: 'Introduce the person you spoke with…',
  news: 'What happened, when and where?',
  event: 'Describe the event in a sentence or two…',
}

function AutoTextarea({ value, onChange, className, textareaRef, ...rest }: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> & { value: string; onChange: (v: string) => void; textareaRef?: React.RefObject<HTMLTextAreaElement | null> }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (textareaRef) textareaRef.current = ref.current
  })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return <textarea ref={ref} rows={1} value={value} onChange={(e) => onChange(e.target.value)} className={`resize-none overflow-hidden ${className ?? ''}`} {...rest} />
}

async function uploadImage(file: File): Promise<{ url: string; key: string } | null> {
  if (!file.type.startsWith('image/')) {
    toast.error('Please choose an image file.')
    return null
  }
  if (file.size > 8 * 1024 * 1024) {
    toast.error('Images must be 8 MB or smaller.')
    return null
  }
  const { data, error } = await insforge.storage.from('site-images').uploadAuto(file)
  if (error || !data) {
    toast.error(error?.message ?? 'Upload failed. Please try again.')
    return null
  }
  return { url: data.url, key: data.key }
}

function ImagePicker({ src, onChange, ratio = 'aspect-[16/9]' }: { src: string; onChange: (url: string, key?: string) => void; ratio?: string }) {
  const [busy, setBusy] = useState(false)
  const [drag, setDrag] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  async function take(file?: File | null) {
    if (!file) return
    setBusy(true)
    const r = await uploadImage(file)
    setBusy(false)
    if (r) onChange(r.url, r.key)
  }
  return (
    <div
      className={`group relative overflow-hidden rounded-xl border-2 border-dashed transition ${drag ? 'border-primary bg-primary/5' : 'border-border bg-muted/50'} ${ratio}`}
      onDragOver={(e) => (e.preventDefault(), setDrag(true))}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => (e.preventDefault(), setDrag(false), take(e.dataTransfer.files?.[0]))}
    >
      {src ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/45 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
            <button type="button" onClick={() => ref.current?.click()} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-foreground shadow">Replace</button>
            <button type="button" onClick={() => onChange('')} className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-red-600 shadow">Remove</button>
          </div>
        </>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-sm text-slate-500 transition hover:text-primary">
          {busy ? <Loader2 className="size-6 animate-spin text-primary" /> : <Upload className="size-6" />}
          <span className="font-semibold">{busy ? 'Uploading…' : 'Upload an image'}</span>
          <span className="text-xs text-slate-400">or drag and drop</span>
        </button>
      )}
      {busy && src && <div className="absolute inset-0 flex items-center justify-center bg-white/70"><Loader2 className="size-6 animate-spin text-primary" /></div>}
      <input ref={ref} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => (take(e.target.files?.[0]), (e.target.value = ''))} />
    </div>
  )
}

// Paragraph box with tiny formatting helpers that insert **bold**, *italic*
// and [link](url) — readable even before it's rendered.
function TextWithHelpers({ value, onChange, placeholder, big }: { value: string; onChange: (v: string) => void; placeholder?: string; big?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  function wrap(before: string, after: string, fallback: string) {
    const el = ref.current
    if (!el) return
    const { selectionStart: a, selectionEnd: b } = el
    const sel = value.slice(a, b) || fallback
    const next = value.slice(0, a) + before + sel + after + value.slice(b)
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(a + before.length, a + before.length + sel.length)
    })
  }
  return (
    <div className="rounded-xl border border-border bg-background transition focus-within:border-primary focus-within:bg-surface focus-within:ring-4 focus-within:ring-primary/15">
      <div className="flex items-center gap-0.5 border-b border-border px-1.5 py-1">
        {[
          { icon: Bold, title: 'Bold', run: () => wrap('**', '**', 'bold text') },
          { icon: Italic, title: 'Italic', run: () => wrap('*', '*', 'italic text') },
          { icon: Link2, title: 'Link', run: () => { const url = window.prompt('Link address (https://…)'); if (url) wrap('[', `](${url.trim()})`, 'link text') } },
        ].map(({ icon: Icon, title, run }) => (
          <button key={title} type="button" title={title} aria-label={title} onClick={run} className="rounded-md p-1.5 text-slate-500 transition hover:bg-muted hover:text-foreground">
            <Icon className="size-4" />
          </button>
        ))}
        <span className="ml-auto pr-1.5 text-[11px] text-slate-400">Blank line = new paragraph</span>
      </div>
      <AutoTextarea textareaRef={ref} value={value} onChange={onChange} placeholder={placeholder} className={`w-full bg-transparent px-3.5 py-3 leading-relaxed text-foreground outline-none placeholder:text-slate-400 ${big ? 'min-h-[120px] text-[16px]' : 'min-h-[90px] text-[15px]'}`} />
    </div>
  )
}
function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-0.5">
      {options.map((o) => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)} className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${value === o.value ? 'bg-surface text-primary shadow-sm' : 'text-slate-500 hover:text-foreground'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

function BlockFields({ block, set, prompt }: { block: PostBlock; set: (patch: Partial<PostBlock>) => void; prompt: string }) {
  switch (block.type) {
    case 'paragraph':
      return <TextWithHelpers value={block.text} onChange={(text) => set({ text })} placeholder={prompt} big />
    case 'heading':
      return (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input className={`${input} font-serif text-xl`} value={block.text} onChange={(e) => set({ text: e.target.value })} placeholder="Section heading" />
          <Segmented value={block.level} onChange={(level) => set({ level })} options={[{ value: 'h2', label: 'Large' }, { value: 'h3', label: 'Small' }]} />
        </div>
      )
    case 'image':
      return (
        <div className="flex flex-col gap-3">
          <ImagePicker src={block.src} onChange={(src) => set({ src })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={input} value={block.caption} onChange={(e) => set({ caption: e.target.value })} placeholder="Caption (optional)" />
            <input className={input} value={block.alt} onChange={(e) => set({ alt: e.target.value })} placeholder="Describe the image (for screen readers)" />
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">Width <Segmented value={block.size} onChange={(size) => set({ size })} options={[{ value: 'normal', label: 'Text width' }, { value: 'wide', label: 'Wide' }, { value: 'full', label: 'Full screen' }]} /></div>
        </div>
      )
    case 'imageText':
      return (
        <div className="grid gap-4 sm:grid-cols-[220px_1fr]">
          <ImagePicker src={block.src} onChange={(src) => set({ src })} ratio="aspect-[4/3]" />
          <div className="flex flex-col gap-2.5">
            <input className={`${input} font-semibold`} value={block.title} onChange={(e) => set({ title: e.target.value })} placeholder="Title (optional)" />
            <TextWithHelpers value={block.text} onChange={(text) => set({ text })} placeholder="Text beside the image…" />
            <div className="flex items-center gap-2 text-xs text-slate-500">Image on the <Segmented value={block.side} onChange={(side) => set({ side })} options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} /></div>
          </div>
        </div>
      )
    case 'quote':
      return (
        <div className="flex flex-col gap-2.5 border-l-4 border-amber-400 pl-4">
          <AutoTextarea className={`${input} min-h-[70px] font-serif text-lg italic`} value={block.text} onChange={(text) => set({ text })} placeholder="The quote…" />
          <input className={input} value={block.cite} onChange={(e) => set({ cite: e.target.value })} placeholder="Who said it (optional)" />
        </div>
      )
    case 'list':
      return (
        <div className="flex flex-col gap-2">
          <AutoTextarea className={`${input} min-h-[100px]`} value={block.items} onChange={(items) => set({ items })} placeholder={'One item per line\nSecond item\nThird item'} />
          <div className="flex items-center gap-2 text-xs text-slate-500">Style <Segmented value={block.ordered ? 'ol' : 'ul'} onChange={(v) => set({ ordered: v === 'ol' })} options={[{ value: 'ul', label: '• Bullets' }, { value: 'ol', label: '1. Numbered' }]} /></div>
        </div>
      )
    case 'callout':
      return (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input className={`${input} font-semibold`} value={block.title} onChange={(e) => set({ title: e.target.value })} placeholder="Title, e.g. Key takeaway" />
            <Segmented value={block.tone} onChange={(tone) => set({ tone })} options={[{ value: 'info', label: 'Note' }, { value: 'tip', label: 'Tip' }, { value: 'important', label: 'Bold' }]} />
          </div>
          <TextWithHelpers value={block.text} onChange={(text) => set({ text })} placeholder="The message…" />
        </div>
      )
    case 'stats':
      return (
        <div className="flex flex-col gap-2.5">
          <div className="grid gap-3 sm:grid-cols-2">
            {block.items.map((item, i) => (
              <div key={i} className="relative flex flex-col gap-1.5 rounded-xl border border-border bg-background p-3">
                <input className={`${input} bg-surface font-serif text-2xl`} value={item.value} onChange={(e) => set({ items: block.items.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)) })} placeholder="e.g. 85%" />
                <input className={`${input} bg-surface text-sm`} value={item.label} onChange={(e) => set({ items: block.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder="What the number means" />
                {block.items.length > 1 && (
                  <button type="button" onClick={() => set({ items: block.items.filter((_, j) => j !== i) })} className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-muted hover:text-red-600" aria-label="Remove number"><X className="size-3.5" /></button>
                )}
              </div>
            ))}
          </div>
          {block.items.length < 4 && (
            <button type="button" onClick={() => set({ items: [...block.items, { value: '', label: '' }] })} className="self-start text-xs font-semibold text-primary hover:underline">+ Add a number</button>
          )}
        </div>
      )
    case 'video': {
      const ok = !!embedUrl(block.url)
      return (
        <div className="flex flex-col gap-2.5">
          <input className={`${input} ${block.url && !ok ? 'border-red-300' : ''}`} value={block.url} onChange={(e) => set({ url: e.target.value })} placeholder="Paste a YouTube or Vimeo link" />
          {block.url && !ok && <p className="text-xs text-red-600">That doesn’t look like a YouTube or Vimeo link.</p>}
          {ok && <div className="aspect-video overflow-hidden rounded-xl bg-black"><iframe src={embedUrl(block.url)!} title="Video preview" className="size-full" allowFullScreen /></div>}
          <input className={input} value={block.caption} onChange={(e) => set({ caption: e.target.value })} placeholder="Caption (optional)" />
        </div>
      )
    }
    case 'qa':
      return (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5"><span className="mt-2 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">Q</span><AutoTextarea className={`${input} font-semibold`} value={block.question} onChange={(question) => set({ question })} placeholder="The question" /></div>
          <div className="flex items-start gap-2.5"><span className="mt-2 flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">A</span><div className="flex-1"><TextWithHelpers value={block.answer} onChange={(answer) => set({ answer })} placeholder="The answer…" /></div></div>
        </div>
      )
    case 'button':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={input} value={block.label} onChange={(e) => set({ label: e.target.value })} placeholder="Button text" />
          <input className={input} value={block.href} onChange={(e) => set({ href: e.target.value })} placeholder="/contact or https://…" />
        </div>
      )
    case 'divider':
      return <div className="flex items-center justify-center py-2"><span className="h-px w-32 bg-gradient-to-r from-transparent via-amber-400 to-transparent" /></div>
  }
}

function InsertPanel({ onPick, onClose }: { onPick: (t: PostBlockType) => void; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="rounded-2xl border border-primary/25 bg-surface p-3 shadow-[0_20px_50px_-30px_rgba(67,97,238,.55)] motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:duration-150">
      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Add a block</p>
        <button type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-muted" aria-label="Close"><X className="size-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
        {BLOCK_DEFS.map((d, i) => {
          const Icon = ICONS[d.icon] ?? Pilcrow
          return (
            <button
              key={d.type}
              type="button"
              autoFocus={i === 0}
              onClick={() => onPick(d.type)}
              className="group flex items-center gap-2.5 rounded-xl p-2.5 text-left transition hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-slate-600 transition group-hover:bg-primary group-hover:text-white"><Icon className="size-[18px]" /></span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">{d.label}</span>
                <span className="block truncate text-[11px] text-muted-foreground">{d.description}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function InsertBar({ open, onOpen, onPick, onClose, last }: { open: boolean; onOpen: () => void; onPick: (t: PostBlockType) => void; onClose: () => void; last?: boolean }) {
  if (open) return <div className="py-2"><InsertPanel onPick={onPick} onClose={onClose} /></div>
  return last ? (
    <button type="button" onClick={onOpen} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-5 text-sm font-semibold text-slate-500 transition hover:border-primary hover:bg-primary/5 hover:text-primary">
      <Plus className="size-4" /> Add a block
    </button>
  ) : (
    <div className="group relative flex h-7 items-center justify-center">
      <span className="absolute inset-x-0 top-1/2 h-px bg-primary/0 transition group-hover:bg-primary/30" />
      <button type="button" onClick={onOpen} aria-label="Insert a block here" className="relative flex size-7 items-center justify-center rounded-full border border-border bg-surface text-slate-400 opacity-0 shadow-sm transition hover:border-primary hover:bg-primary hover:text-white focus-visible:opacity-100 group-hover:opacity-100">
        <Plus className="size-4" />
      </button>
    </div>
  )
}

export type ComposerPost = PostDraft & { id: string; status: 'draft' | 'published'; slug: string }

type View = 'write' | 'split' | 'preview'
const VIEW_KEY = 'pearl-post-editor-view'

export function PostComposer({ post: initial, views, isNew = false }: { post: ComposerPost; views: { d30: number; d90: number }; isNew?: boolean }) {
  const router = useRouter()
  const [draft, setDraft] = useState<PostDraft>(() => ({
    title: initial.title === 'Untitled post' ? '' : initial.title,
    excerpt: initial.excerpt, author: initial.author, category: initial.category, slug: initial.slug, featured: initial.featured,
    style: initial.style, cover_image_url: initial.cover_image_url, cover_image_key: initial.cover_image_key, blocks: initial.blocks,
  }))
  const [status, setStatus] = useState(initial.status)
  const [saved, setSaved] = useState(() => JSON.stringify(draft))
  const [saving, setSaving] = useState(false)
  const [insertAt, setInsertAt] = useState<number | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [lookOpen, setLookOpen] = useState(isNew)
  const [view, setViewState] = useState<View>('write')
  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY)
      if (v === 'write' || v === 'split' || v === 'preview') setViewState(v)
    } catch {}
  }, [])
  const setView = (v: View) => {
    setViewState(v)
    try {
      localStorage.setItem(VIEW_KEY, v)
    } catch {}
  }
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pending, start] = useTransition()

  const dirty = JSON.stringify(draft) !== saved
  const words = useMemo(() => blocksText(draft.blocks).split(/\s+/).filter(Boolean).length, [draft.blocks])
  const minutes = readingMinutesFromText(blocksText(draft.blocks))
  const style = POST_STYLE[draft.style] ?? POST_STYLES[0]
  const prompt = PROMPTS[draft.style] ?? PROMPTS.classic

  const set = (patch: Partial<PostDraft>) => setDraft((d) => ({ ...d, ...patch }))
  const setBlock = (id: string, patch: Partial<PostBlock>) => setDraft((d) => ({ ...d, blocks: d.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as PostBlock) : b)) }))

  const save = useCallback(
    async (quiet = false) => {
      const snapshot = JSON.stringify(draft)
      setSaving(true)
      const r = await savePostAction(initial.id, draft)
      setSaving(false)
      if ('error' in r) {
        toast.error(r.error)
        return false
      }
      setSaved(snapshot)
      if (r.slug !== draft.slug) setDraft((d) => ({ ...d, slug: r.slug }))
      if (!quiet) toast.success('Post saved')
      return true
    },
    [draft, initial.id]
  )

  // Autosave a few seconds after the last change.
  useEffect(() => {
    if (!dirty) return
    const t = setTimeout(() => void save(true), 4000)
    return () => clearTimeout(t)
  }, [dirty, draft, save])

  // Ctrl/Cmd+S saves; leaving with unsaved changes asks first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void save()
      }
    }
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('beforeunload', onLeave)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('beforeunload', onLeave)
    }
  }, [dirty, save])

  function addBlock(type: PostBlockType, at: number) {
    const block = BLOCK_DEF[type].create()
    setDraft((d) => ({ ...d, blocks: [...d.blocks.slice(0, at), block, ...d.blocks.slice(at)] }))
    setInsertAt(null)
    setFlash(block.id)
    setTimeout(() => document.getElementById(`blk-${block.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60)
  }
  function move(i: number, dir: -1 | 1) {
    setDraft((d) => {
      const j = i + dir
      if (j < 0 || j >= d.blocks.length) return d
      const blocks = [...d.blocks]
      ;[blocks[i], blocks[j]] = [blocks[j], blocks[i]]
      setFlash(blocks[j].id)
      return { ...d, blocks }
    })
  }
  function duplicate(i: number) {
    setDraft((d) => {
      const copy = { ...structuredClone(d.blocks[i]), id: blockId() } as PostBlock
      setFlash(copy.id)
      return { ...d, blocks: [...d.blocks.slice(0, i + 1), copy, ...d.blocks.slice(i + 1)] }
    })
  }
  function remove(i: number) {
    const removed = draft.blocks[i]
    setDraft((d) => ({ ...d, blocks: d.blocks.filter((_, j) => j !== i) }))
    toast(`${BLOCK_DEF[removed.type].label} removed`, {
      action: { label: 'Undo', onClick: () => setDraft((d) => ({ ...d, blocks: [...d.blocks.slice(0, i), removed, ...d.blocks.slice(i)] })) },
    })
  }

  function publish(next: 'published' | 'draft') {
    start(async () => {
      if (dirty && !(await save(true))) return
      const r = await setPostStatusAction(initial.id, next)
      if ('error' in r) return void toast.error(r.error)
      setStatus(next)
      toast.success(next === 'published' ? 'Published — it’s now on the Blogs page' : 'Moved back to drafts')
      router.refresh()
    })
  }
  async function preview() {
    if (dirty && !(await save(true))) return
    window.open(`/admin/blog/${initial.id}/preview`, '_blank', 'noopener')
  }

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(null), 900)
    return () => clearTimeout(t)
  }, [flash])

  const live = status === 'published'
  // Stable 'today' for the preview's date line.
  const [previewDate] = useState(() => new Date().toISOString())
  const hasContent = !!blocksText(draft.blocks).trim() || draft.blocks.some((b) => (b.type === 'image' || b.type === 'imageText') && !!b.src)

  // Switching the look keeps what's written; an empty post also gets the
  // new style's starter layout.
  function chooseStyle(key: string) {
    if (key === draft.style) return
    const next = POST_STYLE[key]
    if (!next) return
    set({ style: key, ...(hasContent ? {} : { blocks: next.starter() }) })
  }
  function loadStarter() {
    const before = draft.blocks
    set({ blocks: style.starter() })
    toast(`${style.name} starter layout loaded`, { action: { label: 'Undo', onClick: () => set({ blocks: before }) } })
  }

  const lookPicker = (
    <section className="mb-6 overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,.04)]" aria-label="Post look">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-black/5" style={{ background: style.swatch.bg }}>
          <span className="h-1.5 w-5 rounded-full" style={{ background: style.swatch.accent }} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Look</p>
          <p className="truncate text-sm font-semibold text-foreground">
            {style.name} <span className="font-normal text-muted-foreground">— {style.description}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLookOpen((o) => !o)}
          aria-expanded={lookOpen}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
        >
          <Palette className="size-3.5" /> {lookOpen ? 'Hide looks' : 'Change look'}
          <ChevronDown className={`size-3.5 transition-transform duration-200 ${lookOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {lookOpen && (
        <div className="border-t border-border bg-background/60 px-5 pb-5 pt-4 sm:px-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-200">
          <p className="mb-3 text-xs text-muted-foreground">
            {hasContent ? 'Click a look to apply it — your writing stays as it is. Switch to Split or Preview to see it.' : 'Pick a look to start. It loads a ready-made layout you can fill in, and you can change it any time.'}
          </p>
          <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
            {POST_STYLES.map((s, i) => {
              const active = s.key === draft.style
              return (
                <li
                  key={s.key}
                  className="w-[176px] shrink-0 snap-start motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:fill-mode-both"
                  style={{ animationDelay: `${i * 30}ms`, animationDuration: '300ms' }}
                >
                  <button
                    type="button"
                    onClick={() => chooseStyle(s.key)}
                    aria-pressed={active}
                    className={`group relative flex w-full flex-col gap-2 rounded-2xl border bg-surface p-2 text-left transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-20px_rgba(67,97,238,.6)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 active:scale-[.98] ${active ? 'border-primary ring-4 ring-primary/15' : 'border-border hover:border-primary/40'}`}
                  >
                    <StylePreview style={s} />
                    <span className="px-1 pb-0.5">
                      <span className="block text-[13px] font-semibold text-foreground">{s.name}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{s.description}</span>
                    </span>
                    {active && (
                      <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-primary text-white shadow motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-200">
                        <Check className="size-3.5" />
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
          {hasContent && (
            <button type="button" onClick={loadStarter} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
              <LayoutTemplate className="size-3.5" /> Replace my blocks with the {style.name} starter layout
            </button>
          )}
        </div>
      )}
    </section>
  )

  // Live render of the post in its look, using the site's own theme (scoped
  // by .pa-preview-scope) — it updates as you type.
  const previewPane = (
    <div className={view === 'split' ? 'min-w-0 xl:sticky xl:top-36 xl:self-start' : 'min-w-0'}>
      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_24px_60px_-40px_rgba(15,23,42,.45)]">
        <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-4 py-2.5">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-red-300" />
            <span className="size-2.5 rounded-full bg-amber-300" />
            <span className="size-2.5 rounded-full bg-emerald-300" />
          </span>
          <span className="min-w-0 flex-1 truncate rounded-md bg-surface px-3 py-1 text-center font-mono text-[11px] text-slate-500">/blogs/{draft.slug}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> Live preview
          </span>
        </div>
        <div className={`pa-preview-scope overflow-y-auto ${view === 'split' ? 'max-h-[calc(100dvh-12rem)]' : 'max-h-[calc(100dvh-14rem)]'}`}>
          <div key={draft.style} className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300">
            <PostArticle backHref={null} post={{ ...draft, published_at: previewDate }} />
          </div>
        </div>
      </div>
    </div>
  )

  const sidebar = (
    <>
          <section className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="mb-3 text-sm font-semibold">Cover image</h2>
            <ImagePicker src={draft.cover_image_url ?? ''} onChange={(url, key) => set({ cover_image_url: url || null, cover_image_key: url ? key ?? null : null })} ratio="aspect-[16/10]" />
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-sm font-semibold">Details</h2>
            <div><label className={label} htmlFor="pc-author">Author</label><input id="pc-author" className={input} value={draft.author} onChange={(e) => set({ author: e.target.value })} placeholder="e.g. Dr. Mahasti Khakpour" /></div>
            <div><label className={label} htmlFor="pc-category">Category</label><input id="pc-category" className={input} value={draft.category} onChange={(e) => set({ category: e.target.value })} placeholder="e.g. Food systems" list="pc-categories" />
              <datalist id="pc-categories">{['Food systems', 'Health systems', 'Health equity', 'Rural health', 'Community engagement', 'Events', 'News'].map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div><label className={label} htmlFor="pc-slug">Web address</label>
              <div className="flex items-center rounded-xl border border-border bg-background focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/15"><span className="pl-3 text-sm text-slate-400">/blogs/</span><input id="pc-slug" className="min-w-0 flex-1 bg-transparent py-2.5 pr-3 text-sm outline-none" value={draft.slug} onChange={(e) => set({ slug: e.target.value })} /></div>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border p-3 text-sm transition hover:bg-muted/50">
              <input type="checkbox" className="admin-check" checked={draft.featured} onChange={(e) => set({ featured: e.target.checked })} />
              <Star className={`size-4 ${draft.featured ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} /> Feature on the Blogs page
            </label>
          </section>

          <section className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-surface p-4 text-center">
            {[[words, 'words'], [minutes, 'min read'], [views.d30, 'views · 30d']].map(([v, l]) => (
              <div key={String(l)}><p className="text-xl font-semibold tabular-nums">{v}</p><p className="text-[11px] text-muted-foreground">{l}</p></div>
            ))}
          </section>

          <button
            type="button"
            onClick={() => {
              if (!confirmDelete) return setConfirmDelete(true)
              start(async () => {
                const r = await deletePostAction(initial.id)
                if ('error' in r) return void toast.error(r.error)
                setSaved(JSON.stringify(draft))
                toast.success('Post deleted')
                router.push('/admin/blog')
              })
            }}
            onBlur={() => setConfirmDelete(false)}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${confirmDelete ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50'}`}
          >
            <Trash2 className="size-4" /> {confirmDelete ? 'Click again to delete for good' : 'Delete post'}
          </button>
    </>
  )

  return (
    <div className="-mx-4 -mt-6 sm:-mx-6 lg:-mx-8 lg:-mt-8">
      {/* Top bar */}
      <div className="sticky top-16 z-10 flex flex-wrap items-center gap-3 border-b border-border bg-surface/90 px-4 py-3 backdrop-blur-md sm:px-6 lg:px-8">
        <Link href="/admin/blog" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-muted"><ArrowLeft className="size-4" /> Posts</Link>
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${live ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{live ? 'Published' : 'Draft'}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
          {saving ? <><Loader2 className="size-3.5 animate-spin" /> Saving…</> : dirty ? <><span className="size-1.5 rounded-full bg-amber-500" /> Unsaved changes</> : <><Check className="size-3.5 text-emerald-600" /> All changes saved</>}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {live && <a href={`/blogs/${draft.slug}`} target="_blank" rel="noopener noreferrer" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-muted sm:inline-flex"><ExternalLink className="size-4" /> View live</a>}
          <div className="inline-flex rounded-lg bg-muted p-0.5" role="radiogroup" aria-label="Editor view">
            {([['write', 'Write', PenLine], ['split', 'Split', Columns2], ['preview', 'Preview', Eye]] as const).map(([v, l, Icon]) => (
              <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => setView(v)} className={`items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${view === v ? 'bg-surface text-primary shadow-sm' : 'text-slate-500 hover:text-foreground'} ${v === 'split' ? 'hidden xl:inline-flex' : 'inline-flex'}`}>
                <Icon className="size-3.5" /> {l}
              </button>
            ))}
          </div>
          <button type="button" onClick={preview} title="Open the full page in a new tab" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold transition hover:bg-muted active:scale-[.97]"><ExternalLink className="size-4" /> <span className="hidden sm:inline">Full page</span></button>
          <button type="button" onClick={() => save()} disabled={saving || !dirty} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold transition hover:bg-muted active:scale-[.97] disabled:opacity-50">Save</button>
          <button type="button" onClick={() => publish(live ? 'draft' : 'published')} disabled={pending} className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition active:scale-[.97] disabled:opacity-60 ${live ? 'border border-border bg-surface text-foreground hover:bg-muted' : 'bg-primary text-white shadow-primary/30 hover:bg-primary-dark'}`}>
            {pending && <Loader2 className="size-4 animate-spin" />} {live ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      <div className={`grid gap-8 px-4 py-8 sm:px-6 lg:px-8 ${view === 'write' ? 'xl:grid-cols-[minmax(0,1fr)_340px]' : view === 'split' ? 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : ''}`}>
        {view === 'preview' && (
          <div className="mx-auto flex w-full max-w-[1180px] flex-col">
            {lookPicker}
            {previewPane}
          </div>
        )}
        {/* Writing area */}
        {view !== 'preview' && (
        <div className="mx-auto w-full min-w-0 max-w-[860px]">
          {lookPicker}
          <div className="rounded-3xl border border-border bg-surface px-5 py-7 shadow-[0_1px_2px_rgba(15,23,42,.04)] sm:px-10 sm:py-10">
            <AutoTextarea
              value={draft.title}
              onChange={(title) => set({ title })}
              placeholder="Give your post a title"
              aria-label="Post title"
              className="w-full bg-transparent font-serif text-[clamp(30px,4vw,44px)] font-semibold leading-tight tracking-tight text-foreground outline-none placeholder:text-slate-300"
            />
            <AutoTextarea
              value={draft.excerpt}
              onChange={(excerpt) => set({ excerpt })}
              placeholder="Add a one-line summary — it appears on the Blogs page and in Google"
              aria-label="Summary"
              maxLength={400}
              className="mt-3 w-full bg-transparent text-lg leading-relaxed text-muted-foreground outline-none placeholder:text-slate-300"
            />

            <div className="mt-8 flex flex-col">
              {draft.blocks.length === 0 && insertAt === null && (
                <p className="mb-3 rounded-2xl bg-muted/60 p-5 text-center text-sm text-muted-foreground">Your post is empty. Add a paragraph, an image or any other block below.</p>
              )}
              {draft.blocks.map((b, i) => {
                const def = BLOCK_DEF[b.type]
                const Icon = ICONS[def.icon] ?? Pilcrow
                return (
                  <div key={b.id}>
                    {i > 0 && <InsertBar open={insertAt === i} onOpen={() => setInsertAt(i)} onPick={(t) => addBlock(t, i)} onClose={() => setInsertAt(null)} />}
                    <section
                      id={`blk-${b.id}`}
                      aria-label={def.label}
                      className={`group/blk relative rounded-2xl border p-4 transition-[border-color,box-shadow,background-color] duration-300 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 sm:p-5 ${flash === b.id ? 'border-primary bg-primary/[.03] shadow-[0_0_0_4px_rgba(67,97,238,.12)]' : 'border-transparent hover:border-border focus-within:border-border focus-within:bg-background/40'}`}
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-slate-500"><Icon className="size-4" /></span>
                        <span className="text-xs font-semibold text-slate-500">{def.label}</span>
                        <div className="ml-auto flex items-center gap-0.5 opacity-100 transition sm:opacity-0 sm:group-hover/blk:opacity-100 sm:group-focus-within/blk:opacity-100">
                          <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded-md p-1.5 text-slate-400 hover:bg-muted hover:text-foreground disabled:opacity-30" aria-label="Move up"><ArrowUp className="size-4" /></button>
                          <button type="button" onClick={() => move(i, 1)} disabled={i === draft.blocks.length - 1} className="rounded-md p-1.5 text-slate-400 hover:bg-muted hover:text-foreground disabled:opacity-30" aria-label="Move down"><ArrowDown className="size-4" /></button>
                          <button type="button" onClick={() => duplicate(i)} className="rounded-md p-1.5 text-slate-400 hover:bg-muted hover:text-foreground" aria-label="Duplicate"><Copy className="size-4" /></button>
                          <button type="button" onClick={() => remove(i)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete block"><Trash2 className="size-4" /></button>
                        </div>
                      </div>
                      <BlockFields block={b} set={(patch) => setBlock(b.id, patch)} prompt={i === 0 ? prompt : 'Keep writing…'} />
                    </section>
                  </div>
                )
              })}
              <div className="mt-4">
                <InsertBar last open={insertAt === draft.blocks.length} onOpen={() => setInsertAt(draft.blocks.length)} onPick={(t) => addBlock(t, draft.blocks.length)} onClose={() => setInsertAt(null)} />
              </div>
            </div>
          </div>

          {view === 'split' && <div className="mt-6 grid gap-5 sm:grid-cols-2">{sidebar}</div>}
        </div>
        )}
        {view === 'split' && previewPane}
        {view === 'write' && <aside className="flex flex-col gap-5 xl:sticky xl:top-36 xl:self-start">{sidebar}</aside>}
      </div>
    </div>
  )
}
