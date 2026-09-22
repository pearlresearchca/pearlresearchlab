'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type Dispatch } from 'react'
import { ArrowDown, ArrowUp, ArrowUpLeft, BookmarkPlus, Copy, CopyPlus, EyeOff, Eye, GripVertical, Pencil, Trash2 } from 'lucide-react'
import { PageBody } from '@/components/builder-render/render'
import type { EditorBridge, RenderData } from '@/components/builder-render/context'
import { BLOCKS } from '@/lib/builder/blocks'
import { findNode, findParent, ROOT_ID } from '@/lib/builder/tree'
import { DEVICE_WIDTHS } from '@/lib/builder/styles'
import { googleFontsHref, themeCss } from '@/lib/builder/theme'
import { sanitizeHtmlClient } from '@/lib/builder/sanitize-client'
import type { BuilderNode, ThemeSettings } from '@/lib/builder/types'
import { RichTextEditor } from './rich-text-editor'
import { MediaPickerDialog } from './media'
import { computeDrop, endDrag, getDrag, startDrag, type DropTarget } from './dnd'
import { setProp, setStyle, type Action, type BuilderState } from './store'
import { cx } from './ui'

type Box = { x: number; y: number; w: number; h: number }

function InlineText({ node, field, tag, className, extra, onCommit, onExit }: { node: BuilderNode; field: string; tag: string; className: string; extra: Record<string, unknown>; onCommit: (v: string) => void; onExit: () => void }) {
  const ref = useRef<HTMLElement>(null)
  const initial = String(node.props[field] ?? '')
  const multiline = node.type === 'paragraph' || node.type === 'quote' || node.type === 'heading'

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.textContent = initial
    el.focus()
    // Put the caret at the end.
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    // Only on mount: the element owns its text while editing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const Tag = tag as 'p'
  const { className: _c, ...rest } = extra as { className?: string }
  return (
    <Tag
      {...rest}
      ref={ref as React.Ref<HTMLParagraphElement>}
      className={className}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-label={`Edit ${BLOCKS[node.type]?.label ?? 'text'}`}
      aria-multiline={multiline}
      onBlur={() => {
        const text = ref.current?.innerText ?? ''
        if (text !== initial) onCommit(node.type === 'heading' ? text.replace(/\n+/g, ' ').trim() : text)
        onExit()
      }}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Escape') {
          if (ref.current) ref.current.textContent = initial
          ref.current?.blur()
        }
        if (e.key === 'Enter' && (!multiline || node.type === 'heading') && !e.shiftKey) {
          e.preventDefault()
          ref.current?.blur()
        }
      }}
      onPaste={(e) => {
        e.preventDefault()
        document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
      }}
    />
  )
}

// Drag handles for resizing images, videos, embeds and spacers directly on
// the canvas. Width is stored as a percentage of the parent (so it stays
// responsive); height in px. Written to the device currently being edited.
function ResizeHandles({ node, box, zoom, device, dispatch }: { node: BuilderNode; box: Box; zoom: number; device: BuilderState['device']; dispatch: Dispatch<Action> }) {
  const [label, setLabel] = useState<string | null>(null)
  const canWidth = node.type === 'image' || node.type === 'video' || node.type === 'embed'
  const canHeight = node.type === 'image' || node.type === 'spacer' || node.type === 'embed'

  function start(e: React.PointerEvent, mode: 'w' | 'h' | 'wh') {
    e.preventDefault()
    e.stopPropagation()
    const el = document.querySelector<HTMLElement>(`.pb-editing [data-node-id="${node.id}"]`)
    if (!el) return
    const rect = el.getBoundingClientRect()
    const parentW = el.parentElement?.getBoundingClientRect().width ?? rect.width
    const frame = node.type === 'image' ? (el.querySelector('.pb-img-frame') as HTMLElement | null) : el
    const startH = (frame ?? el).getBoundingClientRect().height
    const x0 = e.clientX
    const y0 = e.clientY
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    let raf = 0
    const move = (ev: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const parts: string[] = []
        if (mode !== 'h' && canWidth) {
          const pct = Math.max(10, Math.min(100, Math.round(((rect.width + (ev.clientX - x0)) / parentW) * 100)))
          dispatch(setStyle(node.id, device, { width: `${pct}%`, maxWidth: undefined }, `${node.id}:resize`))
          parts.push(`${pct}% wide`)
        }
        if (mode !== 'w' && canHeight) {
          const px = Math.max(24, Math.round((startH + (ev.clientY - y0)) / zoom))
          if (node.type === 'image' || node.type === 'embed') dispatch({ ...setProp(node.id, 'height', `${px}px`), key: `${node.id}:resize` })
          else dispatch(setStyle(node.id, device, { height: `${px}px` }, `${node.id}:resize`))
          parts.push(`${px}px tall`)
        }
        setLabel(parts.join(' · '))
      })
    }
    const up = () => {
      cancelAnimationFrame(raf)
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', up)
      target.removeEventListener('pointercancel', up)
      setLabel(null)
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', up)
    target.addEventListener('pointercancel', up)
  }

  const handle = 'pointer-events-auto absolute z-10 rounded-full border-2 border-white bg-primary shadow-md touch-none'
  return (
    <>
      {canWidth && <span role="slider" aria-label="Drag to change width" aria-valuetext={label ?? undefined} tabIndex={-1} onPointerDown={(e) => start(e, 'w')} className={cx(handle, 'right-[-7px] top-1/2 h-8 w-3 -translate-y-1/2 cursor-ew-resize')} />}
      {canHeight && <span role="slider" aria-label="Drag to change height" tabIndex={-1} onPointerDown={(e) => start(e, 'h')} className={cx(handle, 'bottom-[-7px] left-1/2 h-3 w-8 -translate-x-1/2 cursor-ns-resize')} />}
      {canWidth && canHeight && <span role="slider" aria-label="Drag to resize" tabIndex={-1} onPointerDown={(e) => start(e, 'wh')} className={cx(handle, 'bottom-[-7px] right-[-7px] size-3.5 cursor-nwse-resize')} />}
      {label && <span className="pointer-events-none absolute -bottom-9 right-0 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white shadow-lg">{label}</span>}
      {box.w < 0 && null}
    </>
  )
}

export function Canvas({
  state,
  dispatch,
  data,
  theme,
  pageId,
  onRequestAdd,
  onSaveReusable,
  onCopy,
  empty,
  toolbarSlot,
}: {
  toolbarSlot?: HTMLElement | null
  state: BuilderState
  dispatch: Dispatch<Action>
  data: RenderData
  theme: ThemeSettings
  pageId: string
  onRequestAdd: (parentId: string, index: number) => void
  onSaveReusable: (node: BuilderNode) => void
  onCopy: (node: BuilderNode) => void
  empty?: React.ReactNode
}) {
  const { doc, selectedId, editingId, device } = state
  const scrollerRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [boxes, setBoxes] = useState<{ hover: Box | null; selected: Box | null }>({ hover: null, selected: null })
  const [drop, setDrop] = useState<DropTarget | null>(null)
  const [dragging, setDragging] = useState(false)
  const [pickFor, setPickFor] = useState<string | null>(null)

  const measure = useCallback(() => {
    const scroller = scrollerRef.current
    const page = pageRef.current
    if (!scroller || !page) return
    const origin = scroller.getBoundingClientRect()
    const box = (id: string | null): Box | null => {
      if (!id) return null
      const el = page.querySelector(`[data-node-id="${id}"]`)
      if (!el) return null
      const r = el.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return null
      return { x: r.left - origin.left + scroller.scrollLeft, y: r.top - origin.top + scroller.scrollTop, w: r.width, h: r.height }
    }
    setBoxes({ hover: hoverId !== selectedId ? box(hoverId) : null, selected: box(selectedId) })
  }, [hoverId, selectedId])

  useLayoutEffect(() => {
    measure()
  }, [measure, doc, device, editingId])

  useEffect(() => {
    const page = pageRef.current
    if (!page) return
    const ro = new ResizeObserver(() => measure())
    ro.observe(page)
    // Images finishing loading change layout without resizing the page root.
    const onLoad = () => measure()
    page.addEventListener('load', onLoad, true)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      page.removeEventListener('load', onLoad, true)
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  // Keep the selected block in view when selected from the layers panel.
  useEffect(() => {
    if (!selectedId) return
    const el = pageRef.current?.querySelector(`[data-node-id="${selectedId}"]`)
    if (!el) return
    const r = el.getBoundingClientRect()
    const s = scrollerRef.current!.getBoundingClientRect()
    if (r.bottom < s.top || r.top > s.bottom) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [selectedId])

  const bridge: EditorBridge = useMemo(
    () => ({
      editingId,
      inlineText: (node, key, tag, className, extra = {}) => (
        <InlineText key={node.id} node={node} field={key} tag={tag} className={className} extra={extra} onCommit={(v) => dispatch(setProp(node.id, key, v))} onExit={() => dispatch({ type: 'edit', id: null })} />
      ),
      richText: (node) => (
        <RichTextEditor key={node.id} html={String(node.props.html ?? '')} autofocus toolbarTarget={toolbarSlot} onChange={(html) => dispatch({ ...setProp(node.id, 'html', html), key: `${node.id}:rich` })} />
      ),
      pickImage: (id) => setPickFor(id),
      emptyContainer: (node) => (
        <div className="pb-empty-drop" data-empty-for={node.id}>
          <span>
            Drag a block here or{' '}
            <button
              type="button"
              className="font-semibold text-primary underline"
              onClick={(e) => {
                e.stopPropagation()
                onRequestAdd(node.id, 0)
              }}
            >
              add one
            </button>
          </span>
        </div>
      ),
    }),
    [editingId, dispatch, onRequestAdd, toolbarSlot]
  )

  const rc = useMemo(() => ({ data, pageId, editor: bridge, html: sanitizeHtmlClient }), [data, pageId, bridge])

  const selected = selectedId ? findNode(doc, selectedId) : null
  const selectedDef = selected ? BLOCKS[selected.type] : null
  const loc = selectedId ? findParent(doc, selectedId) : null
  const siblings = loc ? (loc.parentId === ROOT_ID ? doc.sections : findNode(doc, loc.parentId)?.children ?? []) : []

  const width = DEVICE_WIDTHS[device]
  // On desktop, lay the page out at a real desktop width and zoom it to fit
  // the canvas, so narrow editor windows still show the desktop design.
  const [available, setAvailable] = useState(1280)
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setAvailable(el.clientWidth))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const DESKTOP_WIDTH = 1280
  const zoom = device === 'desktop' && available < DESKTOP_WIDTH ? Math.max(0.5, available / DESKTOP_WIDTH) : 1
  const fonts = useMemo(() => {
    const set = new Set<string>([theme.typography.headingFont, theme.typography.bodyFont])
    const scan = (nodes: BuilderNode[]) =>
      nodes.forEach((n) => {
        for (const d of ['desktop', 'tablet', 'mobile'] as const) {
          const f = n.style?.[d]?.fontFamily
          if (f && !f.startsWith('var(')) set.add(f)
        }
        if (n.children) scan(n.children)
      })
    scan(doc.sections)
    return googleFontsHref(set)
  }, [doc, theme])

  function handleDragOver(e: React.DragEvent) {
    const payload = getDrag()
    if (!payload || !pageRef.current || !scrollerRef.current) return
    e.preventDefault()
    e.dataTransfer.dropEffect = payload.kind === 'node' ? 'move' : 'copy'
    const t = computeDrop(doc, pageRef.current, scrollerRef.current, e.clientX, e.clientY, e.target, payload)
    setDrop(t)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const payload = getDrag()
    const target = drop
    setDrop(null)
    setDragging(false)
    endDrag()
    if (!payload || !target) return
    if (payload.kind === 'node') dispatch({ type: 'move', id: payload.id, parentId: target.parentId, index: target.index })
    else dispatch({ type: 'insert', parentId: target.parentId, index: target.index, node: payload.create() })
  }

  return (
    <div
      ref={scrollerRef}
      className="relative h-full overflow-auto bg-[#e9eeed]"
      onScroll={measure}
      onDragOver={handleDragOver}
      onDragLeave={(e) => {
        if (!scrollerRef.current?.contains(e.relatedTarget as Node)) setDrop(null)
      }}
      onDrop={handleDrop}
    >
      {fonts && <link rel="stylesheet" href={fonts} />}
      <style dangerouslySetInnerHTML={{ __html: themeCss(theme, '.pb-canvas-theme') }} />
      <MediaPickerDialog
          open={pickFor !== null}
          onClose={() => setPickFor(null)}
          onSelect={({ url, alt }) => {
            if (!pickFor) return
            const id = pickFor
            dispatch({ type: 'update-node', id, fn: (n) => ({ ...n, props: { ...n.props, src: url, alt: n.props.alt || alt || '' } }) })
          }}
        />
      <div className={cx('mx-auto min-h-full bg-background shadow-sm transition-[width] duration-200', device !== 'desktop' && 'my-6 rounded-lg border border-border')} style={{ width: width ? `${width}px` : zoom < 1 ? `${DESKTOP_WIDTH}px` : '100%', maxWidth: zoom < 1 ? 'none' : '100%', zoom }}>
        <div
          ref={pageRef}
          className="pb-canvas-theme"
          style={{ background: 'var(--background)', color: 'var(--foreground)' }}
          onMouseOver={(e) => {
            if (!pageRef.current?.contains(e.target as Node)) return
            const el = (e.target as Element).closest('[data-node-id]') as HTMLElement | null
            setHoverId(el?.dataset.nodeId ?? null)
          }}
          onMouseLeave={() => setHoverId(null)}
          onClickCapture={(e) => {
            // Portaled UI (docked text toolbar, menus, dialogs) bubbles React
            // events through here too; only react to clicks on the page itself.
            if (!pageRef.current?.contains(e.target as Node)) return
            // Links and buttons on the canvas shouldn't navigate while editing.
            const a = (e.target as Element).closest('a, button[type="submit"], summary')
            if (a && !(e.target as Element).closest('.pb-rte, .pb-empty-drop')) e.preventDefault()
          }}
          onClick={(e) => {
            if (!pageRef.current?.contains(e.target as Node)) return
            if ((e.target as Element).closest('.pb-rte, [contenteditable="plaintext-only"]')) return
            const el = (e.target as Element).closest('[data-node-id]') as HTMLElement | null
            if (el) {
              e.stopPropagation()
              if (el.dataset.nodeId !== selectedId) dispatch({ type: 'select', id: el.dataset.nodeId! })
            } else dispatch({ type: 'select', id: null })
          }}
          onDoubleClick={(e) => {
            if (!pageRef.current?.contains(e.target as Node)) return
            const el = (e.target as Element).closest('[data-node-id]') as HTMLElement | null
            if (!el) return
            const node = findNode(doc, el.dataset.nodeId!)
            if (node && (BLOCKS[node.type]?.inlineText || node.type === 'richtext')) dispatch({ type: 'edit', id: node.id })
          }}
        >
          {doc.sections.length === 0 && empty ? empty : <PageBody doc={doc} rc={rc} className="pb-editing" />}
        </div>
      </div>

      {/* Overlay: outlines, toolbar and drop indicator. */}
      <div className="pointer-events-none absolute left-0 top-0 z-40" aria-hidden={!selected}>
        {boxes.hover && !dragging && (
          <div className="absolute border border-dashed border-primary/60" style={{ left: boxes.hover.x, top: boxes.hover.y, width: boxes.hover.w, height: boxes.hover.h }} />
        )}
        {boxes.selected && selected && (
          <div className="absolute border-2 border-primary" style={{ left: boxes.selected.x, top: boxes.selected.y, width: boxes.selected.w, height: boxes.selected.h }}>
            {editingId !== selected.id && !dragging && ['image', 'video', 'embed', 'spacer'].includes(selected.type) && (
              <ResizeHandles node={selected} box={boxes.selected} zoom={zoom} device={device} dispatch={dispatch} />
            )}
            {editingId !== selected.id && (
              <div
                className={cx('pointer-events-auto absolute flex items-center gap-0.5 rounded-md bg-primary px-1 py-0.5 text-white shadow-lg', boxes.selected.y < 36 ? 'top-1 left-1' : '-top-8 left-[-2px]')}
                role="toolbar"
                aria-label={`${selectedDef?.label ?? 'Block'} actions`}
              >
                <span
                  draggable
                  onDragStart={(e) => {
                    startDrag(e, { kind: 'node', id: selected.id, type: selected.type })
                    setDragging(true)
                  }}
                  onDragEnd={() => {
                    endDrag()
                    setDragging(false)
                    setDrop(null)
                  }}
                  className="flex cursor-grab items-center gap-1 rounded px-1 py-0.5 text-[11px] font-semibold hover:bg-white/15 active:cursor-grabbing"
                  title="Drag to move"
                >
                  <GripVertical className="size-3.5" aria-hidden="true" />
                  {selected.type === 'section' && selected.props.label ? selected.props.label : selectedDef?.label ?? selected.type}
                </span>
                {[
                  loc && loc.parentId !== ROOT_ID && { label: 'Select parent', icon: ArrowUpLeft, run: () => dispatch({ type: 'select', id: loc.parentId }) },
                  (selectedDef?.inlineText || selected.type === 'richtext') && { label: 'Edit text', icon: Pencil, run: () => dispatch({ type: 'edit', id: selected.id }) },
                  loc && loc.index > 0 && { label: 'Move up', icon: ArrowUp, run: () => dispatch({ type: 'move', id: selected.id, parentId: loc.parentId, index: loc.index - 1 }) },
                  loc && loc.index < siblings.length - 1 && { label: 'Move down', icon: ArrowDown, run: () => dispatch({ type: 'move', id: selected.id, parentId: loc.parentId, index: loc.index + 2 }) },
                  { label: 'Duplicate', icon: CopyPlus, run: () => dispatch({ type: 'duplicate', id: selected.id }) },
                  { label: 'Copy', icon: Copy, run: () => onCopy(selected) },
                  selected.type !== 'column' && selected.type !== 'global' && { label: 'Save as reusable block', icon: BookmarkPlus, run: () => onSaveReusable(selected) },
                  { label: selected.hidden ? 'Show on website' : 'Hide on website', icon: selected.hidden ? Eye : EyeOff, run: () => dispatch({ type: 'update-node', id: selected.id, fn: (n) => ({ ...n, hidden: !n.hidden }) }) },
                  { label: 'Delete', icon: Trash2, run: () => dispatch({ type: 'remove', id: selected.id }) },
                ]
                  .filter(Boolean)
                  .map((a) => {
                    const action = a as { label: string; icon: typeof Copy; run: () => void }
                    const Icon = action.icon
                    return (
                      <button key={action.label} type="button" title={action.label} aria-label={action.label} onClick={action.run} className="rounded p-1 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                        <Icon className="size-3.5" />
                      </button>
                    )
                  })}
              </div>
            )}
          </div>
        )}
        {drop && (
          <div
            className={cx('absolute rounded-sm', drop.mode === 'box' ? 'border-2 border-dashed border-blue-500 bg-blue-500/10' : 'bg-blue-500 shadow-[0_0_0_2px_rgba(59,130,246,.25)]')}
            style={{ left: drop.rect.x, top: drop.rect.y, width: Math.max(drop.rect.w, 3), height: Math.max(drop.rect.h, 3) }}
          />
        )}
      </div>
    </div>
  )
}
