'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronRight, Copy, Crop, ImageIcon, Plus, Trash2, X } from 'lucide-react'
import { BLOCKS, ICON_OPTIONS, type FieldDef } from '@/lib/builder/blocks'
import type { BuilderNode, Device, PageDoc, Style } from '@/lib/builder/types'
import { pathTo } from '@/lib/builder/tree'
import { uid } from '@/lib/builder/tree'
import { ICONS } from '@/components/builder-render/icons'
import { ColorField } from './color-field'
import { LinkField } from './link-field'
import { CropDialog, MediaPickerDialog } from './media'
import { RichTextEditor } from './rich-text-editor'
import { DeviceHint, StyleControls } from './style-controls'
import { Btn, Dialog, FieldRow, IconBtn, Segmented, Toggle, cx, inputClass } from './ui'

function ImageControl({ value, onChange, onAlt, label }: { value: string; onChange: (url: string) => void; onAlt?: (alt: string) => void; label: string }) {
  const [picker, setPicker] = useState(false)
  const [crop, setCrop] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-md border border-border bg-muted">
        {value ? <img src={value} alt="" className="max-h-40 w-full object-contain" /> : <div className="flex h-24 items-center justify-center text-muted-foreground"><ImageIcon className="size-6" aria-hidden="true" /></div>}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Btn size="sm" onClick={() => setPicker(true)}>{value ? 'Replace' : `Choose ${label.toLowerCase()}`}</Btn>
        {value && <Btn size="sm" onClick={() => setCrop(true)}><Crop className="size-3.5" /> Crop</Btn>}
        {value && <Btn size="sm" variant="ghost" onClick={() => onChange('')}>Remove</Btn>}
      </div>
      <MediaPickerDialog
        open={picker}
        onClose={() => setPicker(false)}
        onSelect={({ url, alt }) => {
          onChange(url)
          if (alt && onAlt) onAlt(alt)
        }}
      />
      {value && <CropDialog open={crop} src={value} onClose={() => setCrop(false)} onCropped={(m) => onChange(m.url)} />}
    </div>
  )
}

function VideoControl({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [picker, setPicker] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <input className={inputClass} placeholder="https://youtube.com/watch?v=…" value={value ?? ''} onChange={(e) => onChange(e.target.value)} aria-label="Video link" />
      <div>
        <Btn size="sm" onClick={() => setPicker(true)}>Upload or choose a video file</Btn>
      </div>
      <MediaPickerDialog open={picker} kind="video" onClose={() => setPicker(false)} onSelect={({ url }) => onChange(url)} />
    </div>
  )
}

function IconControl({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="grid max-h-40 grid-cols-7 gap-1 overflow-y-auto rounded-md border border-border p-1.5">
      <button type="button" onClick={() => onChange('')} title="No icon" aria-label="No icon" aria-pressed={!value} className={cx('flex aspect-square items-center justify-center rounded text-muted-foreground hover:bg-muted', !value && 'bg-primary/10 text-primary')}>
        <X className="size-4" />
      </button>
      {ICON_OPTIONS.map((o) => {
        const Icon = ICONS[o.value]
        if (!Icon) return null
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} title={o.label} aria-label={o.label} aria-pressed={value === o.value} className={cx('flex aspect-square items-center justify-center rounded hover:bg-muted', value === o.value && 'bg-primary/10 text-primary')}>
            <Icon className="size-4" />
          </button>
        )
      })}
    </div>
  )
}

function RichTextDialogField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <div className="pb-rich max-h-32 overflow-hidden rounded-md border border-border bg-background p-2 text-xs text-muted-foreground [&_*]:!text-xs" dangerouslySetInnerHTML={{ __html: value }} />
      <p className="text-[11px] text-muted-foreground">Tip: double-click the text on the page to edit it in place.</p>
      <Btn size="sm" onClick={() => setOpen(true)}>Open full editor</Btn>
      <Dialog open={open} onClose={() => setOpen(false)} title="Edit text" size="lg" footer={<Btn variant="primary" onClick={() => setOpen(false)}>Done</Btn>}>
        <div className="pb-page" style={{ fontSize: 16 }}>
          <RichTextEditor html={value} onChange={onChange} autofocus stickyToolbar={false} />
        </div>
      </Dialog>
    </>
  )
}

function ListControl({ field, value, onChange }: { field: Extract<FieldDef, { type: 'list' }>; value: Record<string, any>[]; onChange: (v: Record<string, any>[]) => void }) {
  const [open, setOpen] = useState<string | null>(null)
  const items = Array.isArray(value) ? value : []
  const update = (i: number, patch: Record<string, any>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)))
  const move = (i: number, d: number) => {
    const next = [...items]
    const [it] = next.splice(i, 1)
    next.splice(i + d, 0, it)
    onChange(next)
  }
  return (
    <div className="flex flex-col gap-1.5">
      {items.map((item, i) => {
        const id = item.id ?? String(i)
        const title = String(item[field.titleKey] ?? '') || `${field.itemLabel} ${i + 1}`
        const expanded = open === id
        return (
          <div key={id} className="rounded-md border border-border bg-background">
            <div className="flex items-center gap-1 px-1.5 py-1">
              <button type="button" className="flex min-w-0 flex-1 items-center gap-1 text-left text-xs font-medium" onClick={() => setOpen(expanded ? null : id)} aria-expanded={expanded}>
                <ChevronRight className={cx('size-3.5 shrink-0 transition', expanded && 'rotate-90')} />
                {item.src ? <img src={item.src} alt="" className="size-6 shrink-0 rounded object-cover" /> : null}
                <span className="truncate">{title}</span>
              </button>
              <IconBtn label="Move up" className="size-6" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp /></IconBtn>
              <IconBtn label="Move down" className="size-6" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDown /></IconBtn>
              <IconBtn label="Duplicate" className="size-6" onClick={() => onChange([...items.slice(0, i + 1), { ...structuredClone(item), id: uid() }, ...items.slice(i + 1)])}><Copy /></IconBtn>
              <IconBtn label="Remove" className="size-6 hover:text-red-600" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 /></IconBtn>
            </div>
            {expanded && (
              <div className="flex flex-col gap-2.5 border-t border-border p-2.5">
                {field.itemFields.map((f) =>
                  f.showIf && !f.showIf(item) ? null : (
                    <FieldControl key={f.key} field={f} value={item[f.key]} props={item} onChange={(v) => update(i, { [f.key]: v })} onPatch={(p) => update(i, p)} />
                  )
                )}
              </div>
            )}
          </div>
        )
      })}
      <Btn
        size="sm"
        onClick={() => {
          const item = field.newItem()
          onChange([...items, item])
          setOpen(item.id)
        }}
      >
        <Plus className="size-3.5" /> Add {field.itemLabel.toLowerCase()}
      </Btn>
      {field.key === 'images' && <BulkImageAdd onAdd={(urls) => onChange([...items, ...urls.map((u) => ({ ...field.newItem(), src: u.url, alt: u.alt ?? '' }))])} />}
    </div>
  )
}

function BulkImageAdd({ onAdd }: { onAdd: (urls: { url: string; alt?: string }[]) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Btn size="sm" variant="subtle" onClick={() => setOpen(true)}><ImageIcon className="size-3.5" /> Add from library</Btn>
      <MediaPickerDialog open={open} onClose={() => setOpen(false)} onSelect={(m) => onAdd([m])} title="Add an image to the gallery" />
    </>
  )
}

export function FieldControl({ field, value, props, onChange, onPatch }: { field: FieldDef; value: any; props: Record<string, any>; onChange: (v: any) => void; onPatch?: (p: Record<string, any>) => void }) {
  const id = `f-${field.key}`
  const hint = field.hint
  switch (field.type) {
    case 'text':
    case 'date':
      return (
        <FieldRow label={field.label} hint={hint} htmlFor={id}>
          <input id={id} type={field.type === 'date' ? 'datetime-local' : 'text'} className={inputClass} value={value ?? ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
          {field.key === 'alt' && props.src && !value && <p className="text-[11px] text-amber-700">This image has no alt text. Describe it for people using screen readers.</p>}
        </FieldRow>
      )
    case 'textarea':
      return (
        <FieldRow label={field.label} hint={hint} htmlFor={id}>
          <textarea id={id} rows={field.rows ?? 3} className={cx(inputClass, 'resize-y leading-relaxed')} value={value ?? ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
        </FieldRow>
      )
    case 'html':
      return (
        <FieldRow label={field.label} hint={hint} htmlFor={id}>
          <textarea id={id} rows={10} spellCheck={false} className={cx(inputClass, 'resize-y font-mono text-xs')} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
        </FieldRow>
      )
    case 'number':
      return (
        <FieldRow label={field.label} hint={hint} htmlFor={id}>
          <input id={id} type="number" min={field.min} max={field.max} className={inputClass} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
        </FieldRow>
      )
    case 'toggle':
      return (
        <div>
          <Toggle checked={!!value} onChange={onChange} label={field.label} />
          {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
        </div>
      )
    case 'select':
      return (
        <FieldRow label={field.label} hint={hint} htmlFor={id}>
          <select id={id} className={inputClass} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </FieldRow>
      )
    case 'segmented':
      return (
        <FieldRow label={field.label} hint={hint}>
          <Segmented label={field.label} value={value} onChange={onChange} options={field.options} size={field.options.length > 4 ? 'sm' : 'md'} />
        </FieldRow>
      )
    case 'image':
      return (
        <FieldRow label={field.label} hint={hint}>
          <ImageControl label={field.label} value={value ?? ''} onChange={onChange} onAlt={(alt) => onPatch && !props.alt && !props.imageAlt && onPatch({ [field.key === 'image' ? 'imageAlt' : 'alt']: alt })} />
        </FieldRow>
      )
    case 'video':
      return (
        <FieldRow label={field.label} hint={hint}>
          <VideoControl value={value ?? ''} onChange={onChange} />
        </FieldRow>
      )
    case 'color':
      return (
        <FieldRow label={field.label} hint={hint}>
          <ColorField label={field.label} value={value} onChange={onChange} />
        </FieldRow>
      )
    case 'icon':
      return (
        <FieldRow label={field.label} hint={hint}>
          <IconControl value={value ?? ''} onChange={onChange} />
        </FieldRow>
      )
    case 'link':
      return <LinkField label={field.label} value={value} onChange={onChange} />
    case 'richtext':
      return (
        <FieldRow label={field.label} hint={hint}>
          <RichTextDialogField value={value ?? ''} onChange={onChange} />
        </FieldRow>
      )
    case 'list':
      return (
        <FieldRow label={field.label} hint={hint}>
          <ListControl field={field} value={value} onChange={onChange} />
        </FieldRow>
      )
  }
}

type InspectorProps = {
  doc: PageDoc
  node: BuilderNode
  device: Device
  onSelect: (id: string) => void
  onProp: (key: string, value: unknown) => void
  onProps: (patch: Record<string, unknown>) => void
  onStyle: (device: Device, patch: Partial<Style>) => void
  onNode: (fn: (n: BuilderNode) => BuilderNode, key?: string) => void
  onEditGlobal?: (blockId: string) => void
  globalName?: string
}

export function Inspector({ doc, node, device, onSelect, onProp, onProps, onStyle, onNode, onEditGlobal, globalName }: InspectorProps) {
  const def = BLOCKS[node.type]
  const [tab, setTab] = useState<'content' | 'style' | 'advanced'>('content')
  const path = pathTo(doc, node.id)
  const fields = (def?.fields ?? []).filter((f) => !f.advanced && (!f.showIf || f.showIf(node.props)))
  const advFields = (def?.fields ?? []).filter((f) => f.advanced && (!f.showIf || f.showIf(node.props)))
  const hasContent = fields.length > 0 || node.type === 'global'
  const activeTab = !hasContent && tab === 'content' ? 'style' : tab

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 pb-2 pt-3">
        <nav aria-label="Selected block location" className="mb-1 flex flex-wrap items-center gap-0.5 text-[11px] text-muted-foreground">
          {path.map((n, i) => (
            <span key={n.id} className="flex items-center gap-0.5">
              {i > 0 && <ChevronRight className="size-3" aria-hidden="true" />}
              <button type="button" onClick={() => onSelect(n.id)} className={cx('rounded px-1 hover:bg-muted hover:text-foreground', n.id === node.id && 'font-semibold text-foreground')}>
                {n.type === 'section' && n.props.label ? n.props.label : BLOCKS[n.type]?.label ?? n.type}
              </button>
            </span>
          ))}
        </nav>
        <Segmented
          label="Settings tab"
          value={activeTab}
          onChange={setTab}
          options={[...(hasContent ? [{ value: 'content' as const, label: 'Content' }] : []), { value: 'style', label: 'Style' }, { value: 'advanced', label: 'Advanced' }]}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === 'content' && (
          <div className="flex flex-col gap-4 p-4">
            {node.type === 'global' ? (
              <div className="flex flex-col gap-2 text-sm">
                <p>
                  This is the global block <strong>{globalName ?? 'Unknown'}</strong>. Its content is shared by every page that uses it.
                </p>
                {onEditGlobal && node.props.blockId && <Btn variant="primary" onClick={() => onEditGlobal(node.props.blockId)}>Edit global block</Btn>}
              </div>
            ) : (
              fields.map((f) => <FieldControl key={f.key} field={f} value={node.props[f.key]} props={node.props} onChange={(v) => onProp(f.key, v)} onPatch={onProps} />)
            )}
          </div>
        )}
        {activeTab === 'style' && (
          <>
            <DeviceHint device={device} />
            <StyleControls node={node} device={device} onStyle={onStyle} onNode={(fn) => onNode(fn)} groups={def?.styleGroups ?? ['spacing']} />
          </>
        )}
        {activeTab === 'advanced' && (
          <div className="flex flex-col gap-4 p-4">
            {advFields.map((f) => (
              <FieldControl key={f.key} field={f} value={node.props[f.key]} props={node.props} onChange={(v) => onProp(f.key, v)} onPatch={onProps} />
            ))}
            <FieldRow label="Anchor ID" hint="Lets links jump to this block, e.g. #contact. Letters, numbers, - and _ only." htmlFor="adv-id">
              <input
                id="adv-id"
                className={inputClass}
                value={node.advanced?.htmlId ?? ''}
                placeholder="e.g. contact"
                onChange={(e) => onNode((n) => ({ ...n, advanced: { ...n.advanced, htmlId: e.target.value.replace(/[^A-Za-z0-9_-]/g, '') } }), `${node.id}:adv:id`)}
              />
            </FieldRow>
            <FieldRow label="CSS class" hint="For developers: extra class names added to this block." htmlFor="adv-class">
              <input
                id="adv-class"
                className={cx(inputClass, 'font-mono text-xs')}
                value={node.advanced?.className ?? ''}
                onChange={(e) => onNode((n) => ({ ...n, advanced: { ...n.advanced, className: e.target.value.replace(/[^A-Za-z0-9_ -]/g, '') } }), `${node.id}:adv:class`)}
              />
            </FieldRow>
            <FieldRow label="Custom CSS" hint="For developers: CSS declarations applied to this block only, e.g. letter-spacing: 2px;" htmlFor="adv-css">
              <textarea
                id="adv-css"
                rows={5}
                spellCheck={false}
                className={cx(inputClass, 'font-mono text-xs')}
                value={node.advanced?.css ?? ''}
                placeholder="letter-spacing: 2px;"
                onChange={(e) => onNode((n) => ({ ...n, advanced: { ...n.advanced, css: e.target.value.slice(0, 2000) } }), `${node.id}:adv:css`)}
              />
            </FieldRow>
            <Toggle checked={!!node.hidden} onChange={(v) => onNode((n) => ({ ...n, hidden: v }))} label="Hide this block on the website" />
            <p className="text-[11px] text-muted-foreground">Block type: {def?.label ?? node.type}</p>
          </div>
        )}
      </div>
    </div>
  )
}
