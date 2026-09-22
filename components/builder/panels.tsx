'use client'

import { useMemo, useState, type Dispatch } from 'react'
import {
  BarChart3, ChevronRight, ClipboardList, Code2, CodeXml, Columns3, Contact, CreditCard, Eye, EyeOff, FileText, FlaskConical, FolderKanban, Gem, Globe,
  GripVertical, Handshake, Heading, Image as ImageIcon, Images, LayoutGrid, Link, ListChecks, ListCollapse, Mail, Megaphone, MessageSquareQuote,
  Minus, MoveVertical, PanelLeft, PanelRight, PanelTop, Pilcrow, Quote, RectangleHorizontal, RectangleVertical, Rows3, Search, Share2, Sparkles,
  Square, Star, Trash2, Users, Video, type LucideIcon,
} from 'lucide-react'
import { BLOCK_LIST, BLOCKS, CATEGORY_LABELS, canContain, makeNode, type Category } from '@/lib/builder/blocks'
import { SECTION_PRESETS } from '@/lib/builder/presets'
import { cloneWithNewIds, isAncestor, pathTo, ROOT_ID } from '@/lib/builder/tree'
import type { BuilderNode, PageDoc, ReusableBlock } from '@/lib/builder/types'
import { endDrag, getDrag, startDrag } from './dnd'
import type { Action } from './store'
import { cx, inputClass, Segmented } from './ui'

const PANEL_ICONS: Record<string, LucideIcon> = {
  BarChart3, ClipboardList, Code2, CodeXml, Columns3, Contact, CreditCard, FileText, FlaskConical, FolderKanban, Gem, Globe, Handshake, Heading, Image: ImageIcon,
  Images, LayoutGrid, Link, ListChecks, ListCollapse, Mail, Megaphone, MessageSquareQuote, Minus, MoveVertical, PanelLeft, PanelRight, PanelTop,
  Pilcrow, Quote, RectangleHorizontal, RectangleVertical, Rows3, Share2, Sparkles, Square, Star, Users, Video,
}

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = PANEL_ICONS[name] ?? Square
  return <C className={className} aria-hidden="true" />
}

export type InsertTarget = { parentId: string; index: number } | null

// Where a click-to-add should go: inside the selected container, else right
// after the selection (walking up until a parent accepts the type), else at
// the end of the page.
export function resolveInsert(doc: PageDoc, selectedId: string | null, type: string, explicit: InsertTarget): { parentId: string; index: number } | null {
  if (explicit) {
    const parent = explicit.parentId === ROOT_ID ? null : pathTo(doc, explicit.parentId).pop() ?? null
    if (canContain(parent ? parent.type : null, type)) return explicit
  }
  if (selectedId) {
    const path = pathTo(doc, selectedId)
    const sel = path[path.length - 1]
    if (sel?.children && canContain(sel.type, type)) return { parentId: sel.id, index: sel.children.length }
    for (let i = path.length - 1; i >= 0; i--) {
      const parent = i === 0 ? null : path[i - 1]
      if (canContain(parent ? parent.type : null, type)) {
        const list = parent ? parent.children ?? [] : doc.sections
        return { parentId: parent ? parent.id : ROOT_ID, index: list.findIndex((n) => n.id === path[i].id) + 1 }
      }
    }
  }
  if (canContain(null, type)) return { parentId: ROOT_ID, index: doc.sections.length }
  const last = doc.sections[doc.sections.length - 1]
  if (last?.type === 'section') return { parentId: last.id, index: last.children?.length ?? 0 }
  return null
}

type PaletteProps = {
  doc: PageDoc
  selectedId: string | null
  target: InsertTarget
  dispatch: Dispatch<Action>
  saved: ReusableBlock[]
  onDeleteSaved?: (id: string) => void
  onAdded?: () => void
  allowSections: boolean
}

export function Palette({ doc, selectedId, target, dispatch, saved, onDeleteSaved, onAdded, allowSections }: PaletteProps) {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'blocks' | 'sections' | 'saved'>('blocks')

  function add(type: string, create: () => BuilderNode) {
    let node = create()
    let where = resolveInsert(doc, selectedId, type, target)
    // A block with no valid place yet: wrap it in a new section at the end.
    if (!where && type !== 'section') {
      node = makeNode('section', { children: [node] })
      where = { parentId: ROOT_ID, index: doc.sections.length }
    }
    if (!where) return
    dispatch({ type: 'insert', parentId: where.parentId, index: where.index, node })
    onAdded?.()
  }

  const q = query.trim().toLowerCase()
  const blocks = BLOCK_LIST.filter((b) => b.category !== 'hidden' && (!q || `${b.label} ${b.description ?? ''}`.toLowerCase().includes(q)))
  const presets = SECTION_PRESETS.filter((p) => !q || `${p.label} ${p.description}`.toLowerCase().includes(q))
  const savedList = saved.filter((b) => !q || b.name.toLowerCase().includes(q))
  const categories: Category[] = ['basic', 'layout', 'media', 'advanced', 'site']

  const item = (key: string, label: string, icon: string, type: string, create: () => BuilderNode, description?: string) => (
    <button
      key={key}
      type="button"
      draggable
      onDragStart={(e) => startDrag(e, { kind: 'new', type, create, label })}
      onDragEnd={endDrag}
      onClick={() => add(type, create)}
      title={description ? `${label} — ${description}` : label}
      className="group flex flex-col items-center gap-1.5 rounded-lg border border-border bg-surface px-1 py-2.5 text-center text-[11px] font-medium text-foreground transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:cursor-grabbing"
    >
      <Icon name={icon} className="size-5 text-muted-foreground group-hover:text-primary" />
      <span className="leading-tight">{label}</span>
    </button>
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input className={cx(inputClass, 'pl-8')} placeholder="Search blocks" aria-label="Search blocks" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Segmented
          size="sm"
          label="Add panel"
          value={tab}
          onChange={setTab}
          options={[{ value: 'blocks', label: 'Blocks' }, ...(allowSections ? [{ value: 'sections' as const, label: 'Sections' }] : []), { value: 'saved', label: `Saved (${saved.length})` }]}
        />
        <p className="text-[11px] text-muted-foreground">Click to add after the selected block, or drag onto the page.</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === 'blocks' &&
          categories.map((cat) => {
            const list = blocks.filter((b) => b.category === cat)
            if (!list.length) return null
            return (
              <div key={cat} className="mb-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{CATEGORY_LABELS[cat]}</p>
                <div className="grid grid-cols-3 gap-1.5">{list.map((b) => item(b.type, b.label, b.icon, b.type, () => makeNode(b.type), b.description))}</div>
              </div>
            )
          })}
        {tab === 'sections' && (
          <div className="grid grid-cols-2 gap-1.5">
            {presets.map((p) => item(p.key, p.label, p.icon, 'section', p.build, p.description))}
          </div>
        )}
        {tab === 'saved' && (
          <div className="flex flex-col gap-1.5">
            {savedList.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">Nothing saved yet. Select a block and choose “Save as reusable block”.</p>}
            {savedList.map((b) => {
              const type = b.is_global ? (b.block.type === 'section' ? 'global' : 'global') : b.block.type
              const create = () => (b.is_global ? makeNode('global', { props: { blockId: b.id } }) : cloneWithNewIds(b.block))
              return (
                <div key={b.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => startDrag(e, { kind: 'new', type: b.is_global && b.block.type === 'section' ? 'section' : type, create, label: b.name })}
                    onDragEnd={endDrag}
                    onClick={() => add(b.is_global && b.block.type === 'section' ? 'section' : type, create)}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-2 text-left text-xs hover:border-primary"
                  >
                    <Icon name={b.is_global ? 'Globe' : BLOCKS[b.block.type]?.icon ?? 'Square'} className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate font-medium">{b.name}</span>
                    {b.is_global && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800">Global</span>}
                  </button>
                  {onDeleteSaved && (
                    <button type="button" className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-600" aria-label={`Delete ${b.name}`} onClick={() => onDeleteSaved(b.id)}>
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Tree outline of the page. Supports selecting, hiding and drag-reordering.
export function Layers({ doc, selectedId, dispatch, globalNames }: { doc: PageDoc; selectedId: string | null; dispatch: Dispatch<Action>; globalNames: Record<string, string> }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [dropAt, setDropAt] = useState<{ parentId: string; index: number; nodeId: string; pos: 'before' | 'after' | 'inside' } | null>(null)

  const label = (n: BuilderNode) => {
    if (n.type === 'section' && n.props.label) return n.props.label as string
    if (n.type === 'global') return `Global: ${globalNames[n.props.blockId] ?? 'deleted block'}`
    const text = (n.props.text ?? n.props.label ?? n.props.title ?? '') as string
    const base = BLOCKS[n.type]?.label ?? n.type
    return text ? `${base}: ${String(text).slice(0, 28)}` : base
  }

  const parentMap = useMemo(() => {
    const m = new Map<string, { parentId: string; index: number; parentType: string | null }>()
    const rec = (list: BuilderNode[], parentId: string, parentType: string | null) =>
      list.forEach((n, i) => {
        m.set(n.id, { parentId, index: i, parentType })
        if (n.children) rec(n.children, n.id, n.type)
      })
    rec(doc.sections, ROOT_ID, null)
    return m
  }, [doc])

  function onDragOver(e: React.DragEvent, node: BuilderNode) {
    const payload = getDrag()
    if (!payload) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const y = (e.clientY - rect.top) / rect.height
    const info = parentMap.get(node.id)!
    const intoOk = !!node.children && canContain(node.type, payload.type) && (y > 0.3 && y < 0.7 || node.children.length === 0)
    let target: typeof dropAt = null
    if (intoOk && (y > 0.3 && y < 0.7)) target = { parentId: node.id, index: node.children!.length, nodeId: node.id, pos: 'inside' }
    else if (canContain(info.parentType, payload.type)) target = { parentId: info.parentId, index: y < 0.5 ? info.index : info.index + 1, nodeId: node.id, pos: y < 0.5 ? 'before' : 'after' }
    if (target && payload.kind === 'node' && (payload.id === target.parentId || (target.parentId !== ROOT_ID && isAncestor(doc, payload.id, target.parentId)))) target = null
    if (target) e.preventDefault()
    setDropAt(target)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const payload = getDrag()
    const t = dropAt
    setDropAt(null)
    endDrag()
    if (!payload || !t) return
    if (payload.kind === 'node') dispatch({ type: 'move', id: payload.id, parentId: t.parentId, index: t.index })
    else dispatch({ type: 'insert', parentId: t.parentId, index: t.index, node: payload.create() })
  }

  const render = (list: BuilderNode[], depth: number) =>
    list.map((n) => {
      const isOpen = !collapsed.has(n.id)
      const hasKids = !!n.children?.length
      const marker = dropAt?.nodeId === n.id ? dropAt.pos : null
      return (
        <li key={n.id} role="treeitem" aria-selected={selectedId === n.id} aria-expanded={hasKids ? isOpen : undefined}>
          <div
            draggable
            onDragStart={(e) => startDrag(e, { kind: 'node', id: n.id, type: n.type })}
            onDragEnd={() => {
              endDrag()
              setDropAt(null)
            }}
            onDragOver={(e) => onDragOver(e, n)}
            onDrop={onDrop}
            className={cx(
              'group relative flex items-center gap-1 rounded-md py-1 pr-1 text-xs',
              selectedId === n.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
              marker === 'inside' && 'ring-2 ring-blue-500',
              n.hidden && 'opacity-50'
            )}
            style={{ paddingLeft: depth * 12 + 4 }}
          >
            {marker === 'before' && <span className="absolute inset-x-0 -top-px h-0.5 bg-blue-500" />}
            {marker === 'after' && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-blue-500" />}
            <GripVertical className="size-3 shrink-0 cursor-grab text-muted-foreground/60" aria-hidden="true" />
            {hasKids ? (
              <button type="button" aria-label={isOpen ? 'Collapse' : 'Expand'} onClick={() => setCollapsed((s) => { const x = new Set(s); if (x.has(n.id)) x.delete(n.id); else x.add(n.id); return x })} className="rounded p-0.5 hover:bg-border/60">
                <ChevronRight className={cx('size-3 transition', isOpen && 'rotate-90')} />
              </button>
            ) : (
              <span className="w-4" />
            )}
            <button type="button" className="min-w-0 flex-1 truncate text-left" onClick={() => dispatch({ type: 'select', id: n.id })}>
              <Icon name={n.type === 'global' ? 'Globe' : BLOCKS[n.type]?.icon ?? 'Square'} className="mr-1.5 inline size-3.5 align-[-2px]" />
              {label(n)}
            </button>
            <button type="button" aria-label={n.hidden ? 'Show' : 'Hide'} onClick={() => dispatch({ type: 'update-node', id: n.id, fn: (x) => ({ ...x, hidden: !x.hidden }) })} className={cx('rounded p-0.5 hover:bg-border/60', !n.hidden && 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100')}>
              {n.hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
            </button>
          </div>
          {hasKids && isOpen && <ul role="group">{render(n.children!, depth + 1)}</ul>}
        </li>
      )
    })

  return (
    <div className="h-full overflow-y-auto p-2" onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setDropAt(null)}>
      {doc.sections.length === 0 ? <p className="p-4 text-center text-xs text-muted-foreground">The page is empty.</p> : <ul role="tree" aria-label="Page structure">{render(doc.sections, 0)}</ul>}
    </div>
  )
}
