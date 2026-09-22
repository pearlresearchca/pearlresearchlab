'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { saveSettingAction } from '@/lib/builder/actions'
import { SOCIAL_PLATFORMS } from '@/lib/builder/blocks'
import { uid } from '@/lib/builder/tree'
import type { SiteSettings } from '@/lib/builder/types'
import { MediaPickerDialog } from './media'
import { SeoPreview } from './page-dialogs'
import { Btn, FieldRow, IconBtn, Spinner, inputClass } from './ui'

export function SiteSettingsEditor({ initial, siteUrl }: { initial: SiteSettings; siteUrl: string }) {
  const router = useRouter()
  const [site, setSite] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [picker, setPicker] = useState<'logoUrl' | 'faviconUrl' | 'socialImage' | null>(null)
  const set = (p: Partial<SiteSettings>) => setSite((s) => ({ ...s, ...p }))
  const dirty = JSON.stringify(site) !== JSON.stringify(initial)

  async function save() {
    setSaving(true)
    const r = await saveSettingAction('site', site)
    setSaving(false)
    if ('error' in r) return toast.error(r.error)
    toast.success('Site settings saved')
    router.refresh()
  }

  const imageField = (key: 'logoUrl' | 'faviconUrl' | 'socialImage', label: string, hint: string) => (
    <FieldRow label={label} hint={hint}>
      <div className="flex items-center gap-2">
        {site[key] && <img src={site[key]} alt="" className="size-12 rounded border border-border bg-muted object-contain" />}
        <Btn size="sm" onClick={() => setPicker(key)}>{site[key] ? 'Replace' : 'Choose image'}</Btn>
        {site[key] && <Btn size="sm" variant="ghost" onClick={() => set({ [key]: '' })}>Remove</Btn>}
      </div>
    </FieldRow>
  )

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
        <h2 className="text-base font-semibold sm:col-span-2">General</h2>
        <FieldRow label="Site name" htmlFor="ss-name"><input id="ss-name" className={inputClass} value={site.siteName} onChange={(e) => set({ siteName: e.target.value })} /></FieldRow>
        <FieldRow label="Short name" htmlFor="ss-short" hint="Used in the footer and where space is tight."><input id="ss-short" className={inputClass} value={site.shortName} onChange={(e) => set({ shortName: e.target.value })} /></FieldRow>
        {imageField('logoUrl', 'Logo', 'Shown in the header.')}
        {imageField('faviconUrl', 'Favicon', 'The small icon in browser tabs. A square PNG works best.')}
      </section>

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold">Default SEO</h2>
        <p className="-mt-2 text-sm text-muted-foreground">Used when a page doesn’t set its own.</p>
        <FieldRow label="Default SEO title" htmlFor="ss-seot"><input id="ss-seot" className={inputClass} value={site.defaultSeoTitle} onChange={(e) => set({ defaultSeoTitle: e.target.value })} /></FieldRow>
        <FieldRow label="Default description" htmlFor="ss-seod"><textarea id="ss-seod" rows={2} className={inputClass} value={site.defaultSeoDescription} onChange={(e) => set({ defaultSeoDescription: e.target.value })} /></FieldRow>
        {imageField('socialImage', 'Default social share image', 'Shown when a page is shared on social media. 1200 × 630px is ideal.')}
        <SeoPreview title={site.defaultSeoTitle} description={site.defaultSeoDescription} url={siteUrl} image={site.socialImage} />
      </section>

      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
        <h2 className="text-base font-semibold sm:col-span-2">Contact details</h2>
        <FieldRow label="Contact email" htmlFor="ss-email"><input id="ss-email" type="email" className={inputClass} value={site.contactEmail ?? ''} onChange={(e) => set({ contactEmail: e.target.value })} /></FieldRow>
        <FieldRow label="Phone" htmlFor="ss-phone"><input id="ss-phone" type="tel" className={inputClass} value={site.phone ?? ''} onChange={(e) => set({ phone: e.target.value })} /></FieldRow>
        <FieldRow label="Address" htmlFor="ss-addr"><textarea id="ss-addr" rows={3} className={inputClass} value={site.address ?? ''} onChange={(e) => set({ address: e.target.value })} /></FieldRow>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold">Social media</h2>
        {site.social.map((s, i) => (
          <div key={s.id} className="flex gap-2">
            <select className={`${inputClass} w-44`} value={s.platform} aria-label="Platform" onChange={(e) => set({ social: site.social.map((x, j) => (j === i ? { ...x, platform: e.target.value } : x)) })}>
              {SOCIAL_PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <input className={inputClass} value={s.url} aria-label="Profile address" placeholder="https://…" onChange={(e) => set({ social: site.social.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)) })} />
            <IconBtn label="Remove" onClick={() => set({ social: site.social.filter((_, j) => j !== i) })}><Trash2 /></IconBtn>
          </div>
        ))}
        <div><Btn size="sm" onClick={() => set({ social: [...site.social, { id: uid(), platform: 'linkedin', url: '' }] })}><Plus className="size-3.5" /> Add social link</Btn></div>
      </section>

      <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-lg border border-border bg-surface/95 p-3 shadow-lg backdrop-blur">
        {dirty && <span className="mr-auto text-sm text-amber-700">Unsaved changes</span>}
        <Btn onClick={() => setSite(initial)} disabled={!dirty}>Discard</Btn>
        <Btn variant="primary" onClick={save} disabled={!dirty || saving}>{saving ? <><Spinner /> Saving…</> : 'Save settings'}</Btn>
      </div>
      <MediaPickerDialog open={picker !== null} onClose={() => setPicker(null)} onSelect={({ url }) => picker && set({ [picker]: url })} />
    </div>
  )
}
