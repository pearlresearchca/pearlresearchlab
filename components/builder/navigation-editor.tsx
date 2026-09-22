'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, ChevronRight, ExternalLink, Eye, EyeOff, GripVertical, IndentDecrease, IndentIncrease, Plus, Trash2 } from 'lucide-react'
import { saveSettingAction } from '@/lib/builder/actions'
import { uid } from '@/lib/builder/tree'
import type { NavItem } from '@/lib/builder/types'
import type { PageOption } from './link-field'
import { Btn, IconBtn, Spinner, Toggle, cx, inputClass } from './ui'

const MAX_DEPTH = 2 // top level + two nested levels

type Path = number[]

function getAt(items: NavItem[], path: Path): NavItem {
  let list = items
  let node: NavItem | undefined
  for (const i of path) {
    node = list[i]
    list = node.children ?? []
  }
  return node!
}

function listAt(items: NavItem[], parent: Path): NavItem[] {
  return parent.length ? getAt(items, parent).children ?? [] : items
}

function clone(items: NavItem[]) {
  return structuredClone(items)
}

function remove(items: NavItem[], path: Path): { items: NavItem[]; node: NavItem } {
  const next = clone(items)
  const parent = path.slice(0, -1)
  const list = parent.length ? (getAt(next, parent).children ??= []) : next
  const [node] = list.splice(path[path.length - 1], 1)
  return { items: next, node }
}

function insert(items: NavItem[], parent: Path, index: number, node: NavItem): NavItem[] {
  const next = clone(items)
  const list = parent.length ? (getAt(next, parent).children ??= []) : next
  list.splice(index, 0, node)
  return next
}

function depthOf(node: NavItem): number {
  return node.children?.length ? 1 + Math.max(...node.children.map(depthOf)) : 0
}

const BUILTIN = ['/', '/about', '/research', '/projects', '/team', '/contact']

export function NavigationEditor({ initial, pages, version }: { initial: NavItem[]; pages: PageOption[]; version: number }) {
  const router = useRouter()
  // Version of the saved menu this editor started from (conflict detection).
  const versionRef = useRef(version)
  const [items, setItems] = useState<NavItem[]>(initial)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const [drag, setDrag] = useState<Path | null>(null)
  const [dropAt, setDropAt] = useState<{ path: Path; pos: 'before' | 'after' | 'inside' } | null>(null)

  function update(next: NavItem[]) {
    setItems(next)
    setDirty(true)
  }

  function patch(path: Path, p: Partial<NavItem>) {
    const next = clone(items)
    Object.assign(getAt(next, path), p)
    update(next)
  }

  function move(from: Path, toParent: Path, toIndex: number) {
    // Refuse moves into the item itself or beyond the depth limit.
    if (toParent.length >= from.length && from.every((v, i) => toParent[i] === v)) return
    const node = getAt(items, from)
    if (toParent.length + depthOf(node) > MAX_DEPTH) return toast.error('Menus can be nested at most three levels deep.')
    const { items: without } = remove(items, from)
    // Adjust the target path/index for the removed item.
    const sameParent = from.length - 1 === toParent.length && from.slice(0, -1).every((v, i) => toParent[i] === v)
    let parent = [...toParent]
    if (!sameParent && from.length <= parent.length && from.slice(0, -1).every((v, i) => parent[i] === v) && from[from.length - 1] < parent[from.length - 1]) {
      parent[from.length - 1] -= 1
    }
    const index = sameParent && from[from.length - 1] < toIndex ? toIndex - 1 : toIndex
    update(insert(without, parent, index, node))
  }

  function addItem(kind: 'page' | 'url') {
    const item: NavItem = kind === 'page' ? { id: uid(), label: 'New page', kind: 'page', url: '/' } : { id: uid(), label: 'New link', kind: 'url', url: 'https://' }
    update([...items, item])
    setOpen(item.id)
  }

  async function save() {
    setSaving(true)
    const r = await saveSettingAction('navigation', { items }, versionRef.current)
    setSaving(false)
    if ('error' in r) return toast.error(r.error)
    versionRef.current = r.version
    toast.success('Navigation saved — the menu is updated on every page')
    setDirty(false)
    router.refresh()
  }

  const render = (list: NavItem[], parent: Path) =>
    list.map((item, i) => {
      const path = [...parent, i]
      const key = path.join('.')
      const expanded = open === item.id
      const marker = dropAt && dropAt.path.join('.') === key ? dropAt.pos : null
      const pageTitle = item.kind === 'page' ? pages.find((p) => p.id === item.pageId)?.title : null
      return (
        <li key={item.id}>
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move'
              e.dataTransfer.setData('text/plain', item.id)
              setDrag(path)
            }}
            onDragEnd={() => {
              setDrag(null)
              setDropAt(null)
            }}
            onDragOver={(e) => {
              if (!drag) return
              e.preventDefault()
              const r = e.currentTarget.getBoundingClientRect()
              const y = (e.clientY - r.top) / r.height
              setDropAt({ path, pos: y < 0.3 ? 'before' : y > 0.7 ? 'after' : 'inside' })
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (!drag || !dropAt) return
              if (dropAt.pos === 'inside') move(drag, path, (item.children ?? []).length)
              else move(drag, parent, dropAt.pos === 'before' ? i : i + 1)
              setDrag(null)
              setDropAt(null)
            }}
            className={cx('relative flex items-center gap-2 rounded-lg border bg-surface px-2 py-2 text-sm', marker === 'inside' ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-border', item.hidden && 'opacity-60')}
          >
            {marker === 'before' && <span className="absolute inset-x-0 -top-1 h-0.5 bg-blue-500" />}
            {marker === 'after' && <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-blue-500" />}
            <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden="true" />
            <button type="button" onClick={() => setOpen(expanded ? null : item.id)} aria-expanded={expanded} className="flex min-w-0 flex-1 items-center gap-2 text-left">
              <ChevronRight className={cx('size-4 shrink-0 transition', expanded && 'rotate-90')} />
              <span className="truncate font-medium">{item.label}</span>
              <span className="truncate font-mono text-xs text-muted-foreground">{item.kind === 'page' ? (pageTitle ? `→ ${pageTitle}` : item.url) : item.url}</span>
              {item.newTab && <ExternalLink className="size-3 text-muted-foreground" aria-label="Opens in new tab" />}
            </button>
            <IconBtn label="Move up" disabled={i === 0} onClick={() => move(path, parent, i - 1)}><ArrowUp /></IconBtn>
            <IconBtn label="Move down" disabled={i === list.length - 1} onClick={() => move(path, parent, i + 2)}><ArrowDown /></IconBtn>
            <IconBtn label="Nest under the item above" disabled={i === 0 || parent.length + 1 + depthOf(item) > MAX_DEPTH} onClick={() => move(path, [...parent, i - 1], (list[i - 1].children ?? []).length)}><IndentIncrease /></IconBtn>
            <IconBtn label="Move out one level" disabled={parent.length === 0} onClick={() => move(path, parent.slice(0, -1), parent[parent.length - 1] + 1)}><IndentDecrease /></IconBtn>
            <IconBtn label={item.hidden ? 'Show in menu' : 'Hide from menu'} onClick={() => patch(path, { hidden: !item.hidden })}>{item.hidden ? <EyeOff /> : <Eye />}</IconBtn>
            <IconBtn label="Remove" className="hover:text-red-600" onClick={() => update(remove(items, path).items)}><Trash2 /></IconBtn>
          </div>
          {expanded && (
            <div className="mb-2 ml-8 mt-1 grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs font-medium">
                Label
                <input className={inputClass} value={item.label} onChange={(e) => patch(path, { label: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium">
                Links to
                <select className={inputClass} value={item.kind} onChange={(e) => patch(path, e.target.value === 'page' ? { kind: 'page', url: '/', pageId: undefined } : { kind: 'url', pageId: undefined, url: 'https://' })}>
                  <option value="page">A page on this site</option>
                  <option value="url">A web address (external)</option>
                </select>
              </label>
              {item.kind === 'page' ? (
                <label className="flex flex-col gap-1 text-xs font-medium sm:col-span-2">
                  Page
                  <select
                    className={inputClass}
                    value={item.pageId ? `id:${item.pageId}` : `url:${item.url}`}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v.startsWith('id:')) {
                        const p = pages.find((x) => x.id === v.slice(3))
                        patch(path, { pageId: v.slice(3), url: '/' + (p?.slug ?? '') })
                      } else patch(path, { pageId: undefined, url: v.slice(4) })
                    }}
                  >
                    <optgroup label="Site pages">{BUILTIN.map((u) => <option key={u} value={`url:${u}`}>{u === '/' ? 'Home (/)' : u}</option>)}</optgroup>
                    {pages.length > 0 && <optgroup label="Builder pages">{pages.map((p) => <option key={p.id} value={`id:${p.id}`}>{p.title} (/{p.slug}){p.status !== 'published' ? ` — ${p.status}` : ''}</option>)}</optgroup>}
                  </select>
                </label>
              ) : (
                <label className="flex flex-col gap-1 text-xs font-medium sm:col-span-2">
                  Web address
                  <input className={inputClass} value={item.url ?? ''} placeholder="https://example.com" onChange={(e) => patch(path, { url: e.target.value })} />
                </label>
              )}
              <div className="sm:col-span-2">
                <Toggle checked={!!item.newTab} onChange={(v) => patch(path, { newTab: v })} label="Open in a new tab" />
              </div>
            </div>
          )}
          {item.children && item.children.length > 0 && <ul className="ml-6 mt-1.5 flex flex-col gap-1.5 border-l-2 border-border pl-3">{render(item.children, path)}</ul>}
        </li>
      )
    })

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-border bg-surface p-5">
        {items.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">The menu is empty.</p> : <ul className="flex flex-col gap-1.5">{render(items, [])}</ul>}
        <div className="mt-4 flex flex-wrap gap-2">
          <Btn onClick={() => addItem('page')}><Plus className="size-4" /> Add page link</Btn>
          <Btn onClick={() => addItem('url')}><Plus className="size-4" /> Add external link</Btn>
        </div>
      </div>
      <div className="sticky bottom-4 flex items-center justify-end gap-3 rounded-lg border border-border bg-surface/95 p-3 shadow-lg backdrop-blur">
        {dirty && <span className="text-sm text-amber-700">You have unsaved changes</span>}
        <Btn onClick={() => { setItems(initial); setDirty(false) }} disabled={!dirty}>Discard</Btn>
        <Btn variant="primary" onClick={save} disabled={saving || !dirty}>{saving ? <><Spinner /> Saving…</> : 'Save navigation'}</Btn>
      </div>
      <p className="text-xs text-muted-foreground">The “Explore” column in the footer uses the first items of this menu. The header button is set under Header &amp; footer.</p>
      {listAt(items, []).length > 7 && <p className="text-xs text-amber-700">Tip: more than 7 top-level items can crowd the menu on smaller screens. Consider grouping some into a dropdown.</p>}
    </div>
  )
}
