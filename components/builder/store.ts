'use client'

import type { BuilderNode, Device, PageDoc, Style } from '@/lib/builder/types'
import { cloneWithNewIds, duplicateNode, findNode, findParent, insertNode, moveNode, removeNode, updateNode } from '@/lib/builder/tree'

// Builder state with an undo/redo history. Documents are immutable (updates
// share structure), so keeping ~80 snapshots stays cheap. Rapid edits to the
// same field (typing) are merged into one history step.

const HISTORY_LIMIT = 80
const COALESCE_MS = 800

export type BuilderState = {
  doc: PageDoc
  past: PageDoc[]
  future: PageDoc[]
  selectedId: string | null
  editingId: string | null
  device: Device
  lastKey: string | null
  lastAt: number
  // Increments on every document change (drives autosave).
  revision: number
}

export type Action =
  | { type: 'set-doc'; doc: PageDoc; resetHistory?: boolean; key?: string }
  | { type: 'update-node'; id: string; fn: (n: BuilderNode) => BuilderNode; key?: string }
  | { type: 'insert'; parentId: string; index: number; node: BuilderNode }
  | { type: 'move'; id: string; parentId: string; index: number }
  | { type: 'remove'; id: string }
  | { type: 'duplicate'; id: string }
  | { type: 'select'; id: string | null }
  | { type: 'edit'; id: string | null }
  | { type: 'device'; device: Device }
  | { type: 'undo' }
  | { type: 'redo' }

export function initState(doc: PageDoc): BuilderState {
  return { doc, past: [], future: [], selectedId: null, editingId: null, device: 'desktop', lastKey: null, lastAt: 0, revision: 0 }
}

function commit(state: BuilderState, doc: PageDoc, key: string | null = null, extra: Partial<BuilderState> = {}): BuilderState {
  if (doc === state.doc) return { ...state, ...extra }
  const now = Date.now()
  const merge = key !== null && key === state.lastKey && now - state.lastAt < COALESCE_MS
  return {
    ...state,
    ...extra,
    doc,
    past: merge ? state.past : [...state.past, state.doc].slice(-HISTORY_LIMIT),
    future: [],
    lastKey: key,
    lastAt: now,
    revision: state.revision + 1,
  }
}

export function reducer(state: BuilderState, action: Action): BuilderState {
  switch (action.type) {
    case 'set-doc':
      if (action.resetHistory) return { ...state, doc: action.doc, past: [], future: [], lastKey: null, revision: state.revision, selectedId: null, editingId: null }
      return commit(state, action.doc, action.key ?? null)
    case 'update-node':
      return commit(state, updateNode(state.doc, action.id, action.fn), action.key ?? null)
    case 'insert':
      return commit(state, insertNode(state.doc, action.parentId, action.index, action.node), null, { selectedId: action.node.id, editingId: null })
    case 'move':
      return commit(state, moveNode(state.doc, action.id, action.parentId, action.index))
    case 'remove': {
      const loc = findParent(state.doc, action.id)
      const doc = removeNode(state.doc, action.id)
      // Select a neighbour so keyboard users don't lose their place.
      let next: string | null = null
      if (loc) {
        const siblings = loc.parentId === '__root__' ? doc.sections : findNode(doc, loc.parentId)?.children ?? []
        next = siblings[Math.min(loc.index, siblings.length - 1)]?.id ?? (loc.parentId === '__root__' ? null : loc.parentId)
      }
      return commit(state, doc, null, { selectedId: next, editingId: null })
    }
    case 'duplicate': {
      const { doc, newId } = duplicateNode(state.doc, action.id)
      return commit(state, doc, null, { selectedId: newId ?? state.selectedId })
    }
    case 'select':
      return { ...state, selectedId: action.id, editingId: action.id === state.editingId ? state.editingId : null, lastKey: null }
    case 'edit':
      return { ...state, editingId: action.id, selectedId: action.id ?? state.selectedId, lastKey: null }
    case 'device':
      return { ...state, device: action.device }
    case 'undo': {
      const prev = state.past[state.past.length - 1]
      if (!prev) return state
      return { ...state, doc: prev, past: state.past.slice(0, -1), future: [state.doc, ...state.future].slice(0, HISTORY_LIMIT), lastKey: null, editingId: null, revision: state.revision + 1 }
    }
    case 'redo': {
      const next = state.future[0]
      if (!next) return state
      return { ...state, doc: next, past: [...state.past, state.doc].slice(-HISTORY_LIMIT), future: state.future.slice(1), lastKey: null, editingId: null, revision: state.revision + 1 }
    }
  }
}

// Helpers for editing a node's props/style in place.
export function setProp(id: string, key: string, value: unknown): Extract<Action, { type: 'update-node' }> {
  return { type: 'update-node', id, key: `${id}:p:${key}`, fn: (n) => ({ ...n, props: { ...n.props, [key]: value } }) }
}

export function setStyle(id: string, device: Device, patch: Partial<Style>, key?: string): Action {
  return {
    type: 'update-node',
    id,
    key: key ?? `${id}:s:${device}:${Object.keys(patch).join(',')}`,
    fn: (n) => {
      const current = { ...(n.style?.[device] ?? {}) } as Record<string, unknown>
      for (const [k, v] of Object.entries(patch)) {
        if (v === undefined || v === '' || v === null) delete current[k]
        else current[k] = v
      }
      const style = { ...(n.style ?? {}), [device]: current }
      if (Object.keys(current).length === 0) delete style[device]
      return { ...n, style: Object.keys(style).length ? style : undefined }
    },
  }
}

export function resetStyle(id: string, device: Device, keys: (keyof Style)[]): Action {
  const patch: Partial<Style> = {}
  for (const k of keys) (patch as Record<string, undefined>)[k] = undefined
  return setStyle(id, device, patch, `${id}:reset`)
}

// Clipboard payload for copy/paste of blocks between pages/tabs.
export const CLIPBOARD_KEY = 'pb-clipboard'
export function copyToClipboard(node: BuilderNode) {
  const payload = JSON.stringify({ __pb: 1, node })
  try {
    localStorage.setItem(CLIPBOARD_KEY, payload)
  } catch {
    // ignore
  }
  navigator.clipboard?.writeText(payload).catch(() => undefined)
}

export function readClipboard(): BuilderNode | null {
  try {
    const raw = localStorage.getItem(CLIPBOARD_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.__pb === 1 && parsed.node?.type) return cloneWithNewIds(parsed.node as BuilderNode)
  } catch {
    // ignore
  }
  return null
}
