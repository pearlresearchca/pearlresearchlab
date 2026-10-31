'use client'

import { canContain } from '@/lib/builder/blocks'
import { findNode, findParent, isAncestor, ROOT_ID } from '@/lib/builder/tree'
import type { BuilderNode, PageDoc } from '@/lib/builder/types'

// Drag state is kept in a module variable because dataTransfer contents are
// unreadable during dragover (only on drop).
export type DragPayload =
  | { kind: 'node'; id: string; type: string }
  | { kind: 'new'; type: string; create: () => BuilderNode; label: string }

let current: DragPayload | null = null

export function startDrag(e: React.DragEvent, payload: DragPayload) {
  current = payload
  e.dataTransfer.effectAllowed = payload.kind === 'node' ? 'move' : 'copy'
  e.dataTransfer.setData('text/plain', payload.kind === 'node' ? payload.id : payload.type)
}

export function getDrag() {
  return current
}

export function endDrag() {
  current = null
}

export type DropTarget = {
  parentId: string
  index: number
  // Indicator geometry relative to the canvas scroll container.
  rect: { x: number; y: number; w: number; h: number }
  mode: 'line-h' | 'line-v' | 'box' | 'side'
  // Set when dropping on the left/right edge of a block: the two blocks end
  // up side by side instead of stacked.
  beside?: { targetId: string; side: 'left' | 'right' }
}

// Blocks that can't have something placed beside them (page-level bands and
// the column cells themselves).
export const NO_BESIDE = new Set(['section', 'column', 'global'])

// Dropping near the left or right edge of a block in a stacked layout puts the
// dragged block next to it.
function besideTarget(doc: PageDoc, root: HTMLElement, el: HTMLElement | null, clientX: number, payload: DragPayload, rel: (r: DOMRect) => DropTarget['rect']): DropTarget | null {
  if (!el || NO_BESIDE.has(payload.type) || !canContain('column', payload.type)) return null
  const id = el.dataset.nodeId!
  const node = findNode(doc, id)
  if (!node || NO_BESIDE.has(node.type)) return null
  if (payload.kind === 'node' && (payload.id === id || isAncestor(doc, payload.id, id))) return null
  const loc = findParent(doc, id)
  if (!loc || loc.parentId === ROOT_ID) return null
  // Already in a row (columns, a row container, a grid): normal drops do that.
  const parentEl = root.querySelector(`[data-node-id="${loc.parentId}"]`) as HTMLElement | null
  const layoutEl = parentEl?.matches('.pb-section') ? (parentEl.querySelector(':scope > .pb-inner') as HTMLElement | null) : parentEl
  if (!layoutEl || isHorizontal(layoutEl)) return null
  const r = el.getBoundingClientRect()
  const zone = Math.min(120, Math.max(32, r.width * 0.22))
  const side = clientX < r.left + zone ? 'left' : clientX > r.right - zone ? 'right' : null
  if (!side) return null
  const b = rel(r)
  return { parentId: loc.parentId, index: loc.index, rect: { x: side === 'left' ? b.x - 3 : b.x + b.w - 3, y: b.y, w: 6, h: b.h }, mode: 'side', beside: { targetId: id, side } }
}

function isHorizontal(el: Element): boolean {
  const cs = getComputedStyle(el)
  if (cs.display.includes('grid')) return cs.gridTemplateColumns.split(' ').filter(Boolean).length > 1
  if (cs.display.includes('flex')) return cs.flexDirection.startsWith('row')
  return false
}

// Figures out where a dragged item would land for the pointer position:
// the deepest container under the pointer that accepts the dragged type, and
// the index among that container's children.
export function computeDrop(doc: PageDoc, root: HTMLElement, scroller: HTMLElement, clientX: number, clientY: number, target: EventTarget | null, payload: DragPayload): DropTarget | null {
  const type = payload.type
  const origin = scroller.getBoundingClientRect()
  const rel = (r: DOMRect) => ({ x: r.left - origin.left + scroller.scrollLeft, y: r.top - origin.top + scroller.scrollTop, w: r.width, h: r.height })

  let el = (target instanceof Element ? target : null)?.closest('[data-node-id]') as HTMLElement | null
  const side = besideTarget(doc, root, el, clientX, payload, rel)
  if (side) return side
  const candidates: { id: string; el: HTMLElement | null }[] = []
  while (el && root.contains(el)) {
    candidates.push({ id: el.dataset.nodeId!, el })
    el = el.parentElement?.closest('[data-node-id]') as HTMLElement | null
  }
  candidates.push({ id: ROOT_ID, el: root })

  for (const c of candidates) {
    const node = c.id === ROOT_ID ? null : findNode(doc, c.id)
    if (c.id !== ROOT_ID && (!node || node.type === 'global')) continue
    const parentType = node ? node.type : null
    if (!canContain(parentType, type)) continue
    if (payload.kind === 'node' && (payload.id === c.id || (c.id !== ROOT_ID && isAncestor(doc, payload.id, c.id)))) continue

    const children = node ? node.children ?? [] : doc.sections
    // Section children live inside .pb-inner; use it for layout direction.
    const layoutEl = c.el && node?.type === 'section' ? (c.el.querySelector(':scope > .pb-inner') as HTMLElement) ?? c.el : c.el!
    if (children.length === 0) {
      return { parentId: c.id, index: 0, rect: rel(layoutEl.getBoundingClientRect()), mode: 'box' }
    }
    const horizontal = c.id !== ROOT_ID && isHorizontal(layoutEl)
    const rects = children.map((ch) => root.querySelector(`[data-node-id="${ch.id}"]`)?.getBoundingClientRect() ?? null)
    let index = children.length
    for (let i = 0; i < children.length; i++) {
      const r = rects[i]
      if (!r) continue
      if (horizontal) {
        if (clientY < r.top || (clientY <= r.bottom && clientX < r.left + r.width / 2)) {
          index = i
          break
        }
      } else if (clientY < r.top + r.height / 2) {
        index = i
        break
      }
    }
    const ref = rects[Math.min(index, children.length - 1)]
    if (!ref) return { parentId: c.id, index, rect: rel(layoutEl.getBoundingClientRect()), mode: 'box' }
    const r = rel(ref)
    if (horizontal) {
      const x = index < children.length ? r.x - 2 : r.x + r.w + 2
      return { parentId: c.id, index, rect: { x, y: r.y, w: 3, h: r.h }, mode: 'line-v' }
    }
    const y = index < children.length ? r.y - 2 : r.y + r.h + 2
    return { parentId: c.id, index, rect: { x: r.x, y, w: r.w, h: 3 }, mode: 'line-h' }
  }
  return null
}
