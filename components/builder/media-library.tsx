'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Check, ClipboardCopy, Crop, RefreshCw, Trash2, X } from 'lucide-react'
import { deleteMediaAction, mediaUsageAction, replaceMediaAction, updateMediaAction } from '@/lib/builder/actions'
import { formatBytes, readImageSize, removeStoredFile, validateFile } from '@/lib/builder/upload-client'
import { insforge } from '@/lib/insforge/client'
import { sanitizeSvgFile } from '@/lib/builder/sanitize-client'
import type { MediaItem } from '@/lib/builder/types'
import { CropDialog, DropZone, MediaFilters, MediaMeta, MediaThumb, UploadQueue, filterMedia, isVideo, useMediaLibrary, type MediaFilter } from './media'
import { Btn, ConfirmProvider, FieldRow, IconBtn, Skeleton, Spinner, cx, inputClass, useConfirm } from './ui'

export function MediaLibrary(props: { canManage: boolean }) {
  return (
    <ConfirmProvider>
      <Inner {...props} />
    </ConfirmProvider>
  )
}

function Inner({ canManage }: { canManage: boolean }) {
  const lib = useMediaLibrary()
  const confirm = useConfirm()
  const [filter, setFilter] = useState<MediaFilter>({ query: '', type: 'all', sort: 'newest', minWidth: 0 })
  const [active, setActive] = useState<MediaItem | null>(null)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const list = useMemo(() => (lib.items ? filterMedia(lib.items, filter) : null), [lib.items, filter])

  async function remove(items: MediaItem[]) {
    // Warn when files are still used somewhere.
    const usage = await Promise.all(items.map((m) => mediaUsageAction(m.url)))
    const used = usage.reduce((n, u) => n + ('ok' in u ? u.uses.length : 0), 0)
    const names = usage.flatMap((u) => ('ok' in u ? u.uses.map((x) => x.name) : [])).slice(0, 5)
    const ok = await confirm({
      title: items.length === 1 ? `Delete “${items[0].title || items[0].filename}”?` : `Delete ${items.length} files?`,
      body: used ? `Warning: used in ${used} place${used > 1 ? 's' : ''} (${names.join(', ')}). Those images will disappear from the site.` : 'This can’t be undone.',
      confirmLabel: 'Delete',
      danger: true,
    })
    if (!ok) return
    setDeleting(true)
    for (const m of items) {
      const r = await deleteMediaAction(m.id)
      if ('error' in r) {
        toast.error(r.error)
        continue
      }
      if (r.warning) toast.warning(r.warning)
      lib.setItems((prev) => prev?.filter((p) => p.id !== m.id) ?? null)
    }
    setDeleting(false)
    setChecked(new Set())
    if (active && items.some((i) => i.id === active.id)) setActive(null)
    toast.success('Deleted')
  }

  return (
    <div className="flex flex-col gap-4">
      <DropZone accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,video/mp4,video/webm" onFiles={(f) => lib.upload(f, 'any')}>
        <p className="text-xs">JPG, PNG, WebP, GIF, SVG (10 MB) or MP4/WebM video (50 MB). Several files at once is fine. Large photos are optimized automatically and duplicates are detected.</p>
      </DropZone>
      <UploadQueue jobs={lib.jobs} onClear={lib.clearJobs} />
      <MediaFilters filter={filter} setFilter={setFilter} />
      {checked.size > 0 && canManage && (
        <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
          <span className="font-medium">{checked.size} selected</span>
          <Btn size="sm" variant="danger" disabled={deleting} onClick={() => remove(lib.items!.filter((m) => checked.has(m.id)))}>{deleting ? <Spinner /> : <Trash2 className="size-3.5" />} Delete</Btn>
          <button type="button" className="ml-auto text-xs text-muted-foreground hover:underline" onClick={() => setChecked(new Set())}>Clear</button>
        </div>
      )}
      {lib.error && <p className="text-sm text-red-600">{lib.error} <button className="underline" onClick={lib.reload}>Try again</button></p>}

      <div className="flex gap-5">
        <div className="min-w-0 flex-1">
          {!list ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="aspect-square" />)}</div>
          ) : list.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">{lib.items?.length ? 'No files match your filters.' : 'The library is empty. Upload your first images above.'}</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((m) => (
                <li key={m.id} className={cx('group relative overflow-hidden rounded-lg border bg-surface', active?.id === m.id ? 'border-primary ring-2 ring-primary/30' : 'border-border')}>
                  <button type="button" className="block w-full text-left" onClick={() => setActive(m)} aria-label={`Details for ${m.title || m.filename}`}>
                    <MediaThumb item={m} className="aspect-square w-full bg-muted" />
                    <span className="block truncate px-2 pt-1.5 text-xs font-medium">{m.title || m.filename}</span>
                    <span className="block px-2 pb-1.5"><MediaMeta item={m} /></span>
                  </button>
                  {!m.alt && !isVideo(m) && <span className="absolute left-2 top-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">No alt text</span>}
                  {canManage && (
                    <label className="absolute right-2 top-2 flex size-6 cursor-pointer items-center justify-center rounded bg-white/90 shadow">
                      <input type="checkbox" className="admin-check" aria-label={`Select ${m.title || m.filename}`} checked={checked.has(m.id)} onChange={() => setChecked((s) => { const x = new Set(s); if (x.has(m.id)) x.delete(m.id); else x.add(m.id); return x })} />
                    </label>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        {active && (
          <MediaDetails
            key={active.id}
            item={active}
            canManage={canManage}
            onClose={() => setActive(null)}
            onChange={(m) => {
              setActive(m)
              lib.setItems((prev) => prev?.map((p) => (p.id === m.id ? m : p)) ?? null)
            }}
            onAdded={(m) => lib.setItems((prev) => (prev ? [m, ...prev] : [m]))}
            onDelete={() => remove([active])}
          />
        )}
      </div>
    </div>
  )
}

function MediaDetails({ item, canManage, onClose, onChange, onAdded, onDelete }: { item: MediaItem; canManage: boolean; onClose: () => void; onChange: (m: MediaItem) => void; onAdded: (m: MediaItem) => void; onDelete: () => void }) {
  const [form, setForm] = useState({ filename: item.filename, title: item.title ?? '', alt: item.alt ?? '', caption: item.caption ?? '', description: item.description ?? '' })
  const [saving, setSaving] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [crop, setCrop] = useState(false)
  const [uses, setUses] = useState<{ kind: string; id: string; name: string }[] | null>(null)

  useEffect(() => {
    mediaUsageAction(item.url).then((r) => setUses('ok' in r ? r.uses : []))
  }, [item.url])

  const dirty = form.filename !== item.filename || form.title !== (item.title ?? '') || form.alt !== (item.alt ?? '') || form.caption !== (item.caption ?? '') || form.description !== (item.description ?? '')

  async function save() {
    setSaving(true)
    const r = await updateMediaAction(item.id, form)
    setSaving(false)
    if ('error' in r) return toast.error(r.error)
    toast.success('Details saved')
    onChange({ ...item, ...form })
  }

  async function replace(file: File) {
    const problem = validateFile(file, isVideo(item) ? 'video' : 'image')
    if (problem) return toast.error(problem)
    setReplacing(true)
    try {
      const f = file.type === 'image/svg+xml' ? await sanitizeSvgFile(file) : file
      const dims = f.type.startsWith('image/') ? await readImageSize(f) : null
      const { data, error } = await insforge.storage.from('site-images').uploadAuto(f)
      if (error || !data) throw new Error(error?.message ?? 'Upload failed.')
      const r = await replaceMediaAction(item.id, { url: data.url, key: data.key, filename: file.name, mime_type: f.type, size_bytes: f.size, width: dims?.width ?? null, height: dims?.height ?? null, checksum: null })
      if ('error' in r) {
        await removeStoredFile(data.key)
        throw new Error(r.error)
      }
      if (r.oldKey) await removeStoredFile(r.oldKey).catch((err) => console.error('old file cleanup failed', err))
      if (r.warning) toast.warning(r.warning)
      onChange({ ...item, url: data.url, key: data.key, filename: file.name, mime_type: f.type, size_bytes: f.size, width: dims?.width ?? null, height: dims?.height ?? null })
      toast.success(r.updated ? `File replaced and updated in ${r.updated} place${r.updated > 1 ? 's' : ''}` : 'File replaced')
    } catch (err) {
      toast.error(`Image upload failed. ${err instanceof Error ? err.message : ''}`)
    } finally {
      setReplacing(false)
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value })

  return (
    <aside className="sticky top-20 hidden max-h-[calc(100vh-7rem)] w-80 shrink-0 flex-col overflow-y-auto rounded-xl border border-border bg-surface md:flex" aria-label="File details">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <p className="text-sm font-semibold">File details</p>
        <IconBtn label="Close details" onClick={onClose}><X /></IconBtn>
      </div>
      <div className="flex flex-col gap-3 p-4">
        {isVideo(item) ? <video src={item.url} controls className="w-full rounded-md bg-black" /> : <img src={item.url} alt={item.alt ?? ''} className="max-h-56 w-full rounded-md border border-border bg-muted object-contain" />}
        <MediaMeta item={item} />
        <p className="text-xs text-muted-foreground">Uploaded {new Date(item.created_at).toLocaleDateString()}</p>
        <div className="flex flex-wrap gap-1.5">
          <Btn size="sm" onClick={() => navigator.clipboard.writeText(item.url).then(() => toast.success('URL copied'))}><ClipboardCopy className="size-3.5" /> Copy URL</Btn>
          {canManage && (
            <label className={cx('inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-xs font-medium hover:bg-muted', replacing && 'opacity-60')}>
              {replacing ? <Spinner className="size-3" /> : <RefreshCw className="size-3.5" />} Replace
              <input type="file" className="hidden" disabled={replacing} accept={isVideo(item) ? 'video/mp4,video/webm' : 'image/*'} onChange={(e) => { const f = e.target.files?.[0]; if (f) replace(f); e.target.value = '' }} />
            </label>
          )}
          {!isVideo(item) && item.mime_type !== 'image/svg+xml' && <Btn size="sm" onClick={() => setCrop(true)}><Crop className="size-3.5" /> Crop copy</Btn>}
        </div>
        <FieldRow label="File name" htmlFor="md-fn"><input id="md-fn" className={inputClass} value={form.filename} onChange={set('filename')} disabled={!canManage} /></FieldRow>
        <FieldRow label="Title" htmlFor="md-title"><input id="md-title" className={inputClass} value={form.title} onChange={set('title')} disabled={!canManage} /></FieldRow>
        <FieldRow label="Alt text" htmlFor="md-alt" hint="Describe the image for people who can’t see it. Used automatically when the image is added to a page.">
          <textarea id="md-alt" rows={2} className={inputClass} value={form.alt} onChange={set('alt')} disabled={!canManage} />
        </FieldRow>
        <FieldRow label="Caption" htmlFor="md-cap"><input id="md-cap" className={inputClass} value={form.caption} onChange={set('caption')} disabled={!canManage} /></FieldRow>
        <FieldRow label="Description" htmlFor="md-desc"><textarea id="md-desc" rows={3} className={inputClass} value={form.description} onChange={set('description')} disabled={!canManage} /></FieldRow>
        {canManage && (
          <div className="flex items-center gap-2">
            <Btn variant="primary" size="sm" onClick={save} disabled={!dirty || saving}>{saving ? <Spinner className="size-3" /> : <Check className="size-3.5" />} Save details</Btn>
            <Btn variant="ghost" size="sm" className="ml-auto text-red-600" onClick={onDelete}><Trash2 className="size-3.5" /> Delete</Btn>
          </div>
        )}
        <div className="border-t border-border pt-3">
          <p className="mb-1 text-xs font-semibold">Used in</p>
          {uses === null ? <Skeleton className="h-4 w-32" /> : uses.length === 0 ? <p className="text-xs text-muted-foreground">Not used on any builder page or setting.</p> : (
            <ul className="text-xs text-muted-foreground">{uses.map((u) => <li key={`${u.kind}-${u.id}`}>{u.kind === 'page' ? 'Page' : u.kind === 'block' ? 'Block' : 'Setting'}: {u.name}</li>)}</ul>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground">{formatBytes(item.size_bytes)}</p>
      </div>
      <CropDialog open={crop} src={item.url} onClose={() => setCrop(false)} onCropped={onAdded} />
    </aside>
  )
}
