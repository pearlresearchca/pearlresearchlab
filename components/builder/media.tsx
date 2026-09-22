'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { toast } from 'sonner'
import { Check, FileVideo, ImageIcon, Link2, Search, Upload } from 'lucide-react'
import { fetchMediaLibrary, formatBytes, uploadMedia } from '@/lib/builder/upload-client'
import type { MediaItem } from '@/lib/builder/types'
import { Btn, Dialog, Segmented, Skeleton, Spinner, cx, inputClass } from './ui'

export type UploadJob = { id: string; name: string; state: 'uploading' | 'done' | 'error'; message?: string }

// Shared media state: library contents plus an upload queue with per-file status.
export function useMediaLibrary(enabled = true) {
  const [items, setItems] = useState<MediaItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<UploadJob[]>([])

  const reload = useCallback(async () => {
    try {
      setError(null)
      setItems(await fetchMediaLibrary())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the media library.')
    }
  }, [])

  useEffect(() => {
    if (enabled && items === null) reload()
  }, [enabled, items, reload])

  const upload = useCallback(async (files: File[], kind: 'image' | 'video' | 'any' = 'any'): Promise<MediaItem[]> => {
    const results: MediaItem[] = []
    const queue = files.map((f) => ({ id: Math.random().toString(36).slice(2), name: f.name, state: 'uploading' as const }))
    setJobs((j) => [...queue, ...j].slice(0, 20))
    // Upload a few at a time: fast, without flooding the connection.
    let cursor = 0
    async function worker() {
      while (cursor < files.length) {
        const i = cursor++
        try {
          const { media, reused } = await uploadMedia(files[i], kind)
          results.push(media)
          setItems((prev) => (prev ? [media, ...prev.filter((p) => p.id !== media.id)] : [media]))
          setJobs((j) => j.map((x) => (x.id === queue[i].id ? { ...x, state: 'done', message: reused ? 'Already in library — reused' : undefined } : x)))
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Upload failed.'
          setJobs((j) => j.map((x) => (x.id === queue[i].id ? { ...x, state: 'error', message } : x)))
          toast.error(`Image upload failed: ${message}`)
        }
      }
    }
    await Promise.all([worker(), worker(), worker()])
    return results
  }, [])

  return { items, setItems, error, reload, upload, jobs, clearJobs: () => setJobs((j) => j.filter((x) => x.state === 'uploading')) }
}

export function UploadQueue({ jobs, onClear }: { jobs: UploadJob[]; onClear: () => void }) {
  if (jobs.length === 0) return null
  const busy = jobs.filter((j) => j.state === 'uploading').length
  return (
    <div className="rounded-lg border border-border bg-background p-3" aria-live="polite">
      <div className="mb-2 flex items-center justify-between text-xs font-medium">
        <span>{busy ? `Uploading ${busy} file${busy > 1 ? 's' : ''}…` : 'Uploads finished'}</span>
        {!busy && <button type="button" className="text-primary hover:underline" onClick={onClear}>Clear</button>}
      </div>
      <ul className="flex max-h-32 flex-col gap-1 overflow-y-auto text-xs">
        {jobs.map((j) => (
          <li key={j.id} className="flex items-center gap-2">
            {j.state === 'uploading' ? <Spinner className="size-3 text-primary" /> : j.state === 'done' ? <Check className="size-3.5 text-green-600" /> : <span className="text-red-600">✕</span>}
            <span className="min-w-0 flex-1 truncate">{j.name}</span>
            {j.message && <span className={cx('shrink-0', j.state === 'error' ? 'text-red-600' : 'text-muted-foreground')}>{j.message}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function isVideo(m: MediaItem) {
  return m.mime_type.startsWith('video/')
}

export function MediaThumb({ item, className }: { item: MediaItem; className?: string }) {
  if (isVideo(item)) {
    return (
      <div className={cx('flex items-center justify-center bg-slate-800 text-white', className)}>
        <FileVideo className="size-6" aria-hidden="true" />
      </div>
    )
  }
  return <img src={item.url} alt={item.alt ?? ''} loading="lazy" className={cx('object-cover', className)} />
}

export type MediaFilter = { query: string; type: 'all' | 'image' | 'svg' | 'gif' | 'video'; sort: 'newest' | 'oldest' | 'name' | 'largest'; minWidth: number }

export function filterMedia(items: MediaItem[], f: MediaFilter) {
  const q = f.query.trim().toLowerCase()
  const list = items.filter((m) => {
    if (q && !`${m.filename} ${m.title ?? ''} ${m.alt ?? ''} ${m.caption ?? ''}`.toLowerCase().includes(q)) return false
    if (f.type === 'video' && !isVideo(m)) return false
    if (f.type === 'image' && (isVideo(m) || m.mime_type === 'image/svg+xml' || m.mime_type === 'image/gif')) return false
    if (f.type === 'svg' && m.mime_type !== 'image/svg+xml') return false
    if (f.type === 'gif' && m.mime_type !== 'image/gif') return false
    if (f.minWidth && (m.width ?? 0) < f.minWidth) return false
    return true
  })
  const sorters: Record<MediaFilter['sort'], (a: MediaItem, b: MediaItem) => number> = {
    newest: (a, b) => b.created_at.localeCompare(a.created_at),
    oldest: (a, b) => a.created_at.localeCompare(b.created_at),
    name: (a, b) => (a.title || a.filename).localeCompare(b.title || b.filename),
    largest: (a, b) => b.size_bytes - a.size_bytes,
  }
  return list.sort(sorters[f.sort])
}

export function MediaFilters({ filter, setFilter, allowVideo = true }: { filter: MediaFilter; setFilter: (f: MediaFilter) => void; allowVideo?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-48 flex-1">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input className={cx(inputClass, 'pl-8')} placeholder="Search by name, alt text or caption" aria-label="Search media" value={filter.query} onChange={(e) => setFilter({ ...filter, query: e.target.value })} />
      </div>
      <select aria-label="File type" className={cx(inputClass, 'w-auto')} value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value as MediaFilter['type'] })}>
        <option value="all">All files</option>
        <option value="image">Photos (JPG, PNG, WebP)</option>
        <option value="svg">SVG</option>
        <option value="gif">GIF</option>
        {allowVideo && <option value="video">Videos</option>}
      </select>
      <select aria-label="Minimum width" className={cx(inputClass, 'w-auto')} value={filter.minWidth} onChange={(e) => setFilter({ ...filter, minWidth: Number(e.target.value) })}>
        <option value={0}>Any size</option>
        <option value={800}>At least 800px wide</option>
        <option value={1200}>At least 1200px wide</option>
        <option value={1920}>At least 1920px wide</option>
      </select>
      <select aria-label="Sort" className={cx(inputClass, 'w-auto')} value={filter.sort} onChange={(e) => setFilter({ ...filter, sort: e.target.value as MediaFilter['sort'] })}>
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="name">Name</option>
        <option value="largest">Largest file</option>
      </select>
    </div>
  )
}

export function DropZone({ onFiles, accept, children, className }: { onFiles: (files: File[]) => void; accept: string; children?: React.ReactNode; className?: string }) {
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  return (
    <div
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('Files')) {
          e.preventDefault()
          setOver(true)
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const files = Array.from(e.dataTransfer.files)
        if (files.length) onFiles(files)
      }}
      className={cx('rounded-lg border-2 border-dashed transition', over ? 'border-primary bg-primary/5' : 'border-border', className)}
    >
      <div className="flex flex-col items-center justify-center gap-2 p-5 text-center text-sm text-muted-foreground">
        <Upload className="size-5" aria-hidden="true" />
        <p>
          Drag files here or{' '}
          <button type="button" className="font-semibold text-primary hover:underline" onClick={() => input.current?.click()}>
            browse your computer
          </button>
        </p>
        {children}
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? [])
          if (files.length) onFiles(files)
          e.target.value = ''
        }}
      />
    </div>
  )
}

// Pick (or upload) an image/video from the media library, or paste a URL.
export function MediaPickerDialog({ open, onClose, onSelect, kind = 'image', title }: { open: boolean; onClose: () => void; onSelect: (m: { url: string; alt?: string; media?: MediaItem }) => void; kind?: 'image' | 'video'; title?: string }) {
  const lib = useMediaLibrary(open)
  const [tab, setTab] = useState<'library' | 'url'>('library')
  const [filter, setFilter] = useState<MediaFilter>({ query: '', type: kind === 'video' ? 'video' : 'all', sort: 'newest', minWidth: 0 })
  const [url, setUrl] = useState('')
  const list = useMemo(() => (lib.items ? filterMedia(lib.items, filter).filter((m) => (kind === 'video' ? isVideo(m) : !isVideo(m))) : null), [lib.items, filter, kind])
  const accept = kind === 'video' ? 'video/mp4,video/webm' : 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml'

  return (
    <Dialog open={open} onClose={onClose} title={title ?? (kind === 'video' ? 'Choose a video' : 'Choose an image')} size="xl">
      <div className="flex flex-col gap-4">
        <Segmented
          label="Source"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'library', label: <><ImageIcon /> Media library</> },
            { value: 'url', label: <><Link2 /> From a web address</> },
          ]}
        />
        {tab === 'url' ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!/^https:\/\//i.test(url.trim())) {
                toast.error('Please paste a full https:// address.')
                return
              }
              onSelect({ url: url.trim() })
              onClose()
            }}
          >
            <input className={inputClass} placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="File address" />
            <p className="text-xs text-muted-foreground">Tip: uploading to the library is more reliable than linking to other websites, which can change or remove files.</p>
            <div>
              <Btn type="submit" variant="primary">Use this address</Btn>
            </div>
          </form>
        ) : (
          <>
            <DropZone accept={accept} onFiles={async (files) => {
              const uploaded = await lib.upload(files, kind)
              if (uploaded.length === 1) {
                onSelect({ url: uploaded[0].url, alt: uploaded[0].alt ?? undefined, media: uploaded[0] })
                onClose()
              }
            }}>
              <p className="text-xs">{kind === 'video' ? 'MP4 or WebM, up to 50 MB' : 'JPG, PNG, WebP, GIF or SVG, up to 10 MB. Large photos are optimized automatically.'}</p>
            </DropZone>
            <UploadQueue jobs={lib.jobs} onClear={lib.clearJobs} />
            <MediaFilters filter={filter} setFilter={setFilter} allowVideo={kind === 'video'} />
            {lib.error && <p className="text-sm text-red-600">{lib.error} <button className="underline" onClick={lib.reload}>Try again</button></p>}
            {!list ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {Array.from({ length: 10 }, (_, i) => <Skeleton key={i} className="aspect-square" />)}
              </div>
            ) : list.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No files yet. Upload one above.</p>
            ) : (
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {list.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect({ url: m.url, alt: m.alt ?? undefined, media: m })
                        onClose()
                      }}
                      className="group flex w-full flex-col overflow-hidden rounded-lg border border-border text-left transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <MediaThumb item={m} className="aspect-square w-full bg-muted" />
                      <span className="truncate px-2 py-1.5 text-xs">{m.title || m.filename}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </Dialog>
  )
}

// Crop an image in the browser; the result is uploaded as a new library file
// (the original stays untouched).
export function CropDialog({ open, src, onClose, onCropped }: { open: boolean; src: string; onClose: () => void; onCropped: (media: MediaItem) => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState<string>('free')
  const [area, setArea] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !src) return
    let revoked: string | null = null
    // Load through a blob so the canvas isn't tainted by cross-origin data.
    fetch(src)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error('fetch failed'))))
      .then((b) => {
        revoked = URL.createObjectURL(b)
        setObjectUrl(revoked)
      })
      .catch(() => toast.error('This image can’t be cropped (it may be hosted on another website).'))
    return () => {
      if (revoked) URL.revokeObjectURL(revoked)
      setObjectUrl(null)
    }
  }, [open, src])

  const ratios: Record<string, number | undefined> = { free: undefined, '1/1': 1, '4/3': 4 / 3, '16/9': 16 / 9, '3/4': 3 / 4 }

  async function apply() {
    if (!objectUrl || !area) return
    setBusy(true)
    try {
      const img = new Image()
      img.src = objectUrl
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(area.width)
      canvas.height = Math.round(area.height)
      canvas.getContext('2d')!.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height)
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.9))
      if (!blob) throw new Error('Could not create the cropped image.')
      const name = (src.split('/').pop()?.split('?')[0] ?? 'image').replace(/\.[a-z0-9]+$/i, '')
      const { media } = await uploadMedia(new File([blob], `${decodeURIComponent(name)}-cropped.webp`, { type: 'image/webp' }))
      toast.success('Cropped image saved to the media library')
      onCropped(media)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Cropping failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Crop image"
      description="The cropped version is saved as a new file; the original is kept."
      size="lg"
      footer={
        <>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn variant="primary" onClick={apply} disabled={busy || !area}>{busy ? <><Spinner /> Saving…</> : 'Crop and use'}</Btn>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Segmented label="Shape" value={aspect} onChange={setAspect} options={[{ value: 'free', label: 'Free' }, { value: '1/1', label: 'Square' }, { value: '4/3', label: '4:3' }, { value: '16/9', label: '16:9' }, { value: '3/4', label: 'Portrait' }]} />
        <div className="relative h-80 overflow-hidden rounded-lg bg-slate-900">
          {objectUrl ? (
            <Cropper image={objectUrl} crop={crop} zoom={zoom} aspect={ratios[aspect]} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, px) => setArea(px)} objectFit="contain" />
          ) : (
            <div className="flex h-full items-center justify-center text-white"><Spinner /></div>
          )}
        </div>
        <label className="flex items-center gap-3 text-xs font-medium">
          Zoom
          <input type="range" min={1} max={4} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="flex-1 accent-primary" />
        </label>
      </div>
    </Dialog>
  )
}

export function MediaMeta({ item }: { item: MediaItem }) {
  return (
    <span className="text-xs text-muted-foreground">
      {item.width && item.height ? `${item.width} × ${item.height}px · ` : ''}
      {formatBytes(item.size_bytes)} · {item.mime_type.replace('image/', '').replace('video/', '').toUpperCase()}
    </span>
  )
}
