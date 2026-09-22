import type { BuilderNode, PageDoc } from './types'

// Short, CSS-class-safe ids (they're used as `.n-<id>` selectors).
export function uid(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return 'x' + Array.from(bytes, (b) => (b % 36).toString(36)).join('')
}

export function cloneWithNewIds<T extends BuilderNode>(node: T): T {
  return {
    ...structuredClone(node),
    id: uid(),
    children: node.children?.map((c) => cloneWithNewIds(c)),
    props: remapItemIds(structuredClone(node.props)),
  }
}

// List props (accordion items, gallery images, ...) carry their own ids for
// stable React keys; give copies fresh ones too.
function remapItemIds(props: Record<string, any>): Record<string, any> {
  for (const [key, value] of Object.entries(props)) {
    if (Array.isArray(value)) {
      props[key] = value.map((item) => (item && typeof item === 'object' && 'id' in item ? { ...item, id: uid() } : item))
    }
  }
  return props
}

export function cloneDocWithNewIds(doc: PageDoc): PageDoc {
  return { version: 1, sections: doc.sections.map((s) => cloneWithNewIds(s)) }
}

// A synthetic root lets every tree operation treat top-level sections like
// any other children list.
export const ROOT_ID = '__root__'

type Root = { id: string; children: BuilderNode[] }

function asRoot(doc: PageDoc): Root {
  return { id: ROOT_ID, children: doc.sections }
}

export function findNode(doc: PageDoc, id: string): BuilderNode | null {
  let found: BuilderNode | null = null
  walk(doc.sections, (n) => {
    if (n.id === id) {
      found = n
      return false
    }
  })
  return found
}

export function walk(nodes: BuilderNode[], fn: (node: BuilderNode, parent: BuilderNode | null) => void | false, parent: BuilderNode | null = null): boolean {
  for (const n of nodes) {
    if (fn(n, parent) === false) return false
    if (n.children && walk(n.children, fn, n) === false) return false
  }
  return true
}

export function findParent(doc: PageDoc, id: string): { parentId: string; index: number } | null {
  const search = (list: BuilderNode[], parentId: string): { parentId: string; index: number } | null => {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === id) return { parentId, index: i }
      const children = list[i].children
      if (children) {
        const hit = search(children, list[i].id)
        if (hit) return hit
      }
    }
    return null
  }
  return search(doc.sections, ROOT_ID)
}

// Path of ancestor ids from the top-level section down to (and including) id.
export function pathTo(doc: PageDoc, id: string): BuilderNode[] {
  const path: BuilderNode[] = []
  const search = (list: BuilderNode[]): boolean => {
    for (const n of list) {
      path.push(n)
      if (n.id === id) return true
      if (n.children && search(n.children)) return true
      path.pop()
    }
    return false
  }
  search(doc.sections)
  return path
}

function mapChildren(root: Root, parentId: string, fn: (children: BuilderNode[]) => BuilderNode[]): Root {
  if (root.id === parentId) return { ...root, children: fn(root.children) }
  const recur = (list: BuilderNode[]): BuilderNode[] => {
    let changed = false
    const next = list.map((n) => {
      if (n.id === parentId) {
        changed = true
        return { ...n, children: fn(n.children ?? []) }
      }
      if (n.children) {
        const c = recur(n.children)
        if (c !== n.children) {
          changed = true
          return { ...n, children: c }
        }
      }
      return n
    })
    return changed ? next : list
  }
  return { ...root, children: recur(root.children) }
}

export function updateNode(doc: PageDoc, id: string, fn: (node: BuilderNode) => BuilderNode): PageDoc {
  const recur = (list: BuilderNode[]): BuilderNode[] => {
    let changed = false
    const next = list.map((n) => {
      if (n.id === id) {
        changed = true
        return fn(n)
      }
      if (n.children) {
        const c = recur(n.children)
        if (c !== n.children) {
          changed = true
          return { ...n, children: c }
        }
      }
      return n
    })
    return changed ? next : list
  }
  return { ...doc, sections: recur(doc.sections) }
}

export function insertNode(doc: PageDoc, parentId: string, index: number, node: BuilderNode): PageDoc {
  const root = mapChildren(asRoot(doc), parentId, (children) => {
    const next = [...children]
    next.splice(Math.max(0, Math.min(index, next.length)), 0, node)
    return next
  })
  return { ...doc, sections: root.children }
}

export function removeNode(doc: PageDoc, id: string): PageDoc {
  const loc = findParent(doc, id)
  if (!loc) return doc
  const root = mapChildren(asRoot(doc), loc.parentId, (children) => children.filter((c) => c.id !== id))
  return { ...doc, sections: root.children }
}

export function isAncestor(doc: PageDoc, ancestorId: string, id: string): boolean {
  return pathTo(doc, id).some((n) => n.id === ancestorId && n.id !== id)
}

export function moveNode(doc: PageDoc, id: string, parentId: string, index: number): PageDoc {
  if (id === parentId || isAncestor(doc, id, parentId)) return doc
  const node = findNode(doc, id)
  const loc = findParent(doc, id)
  if (!node || !loc) return doc
  // Removing first shifts later siblings of the same list up by one.
  const adjusted = loc.parentId === parentId && loc.index < index ? index - 1 : index
  return insertNode(removeNode(doc, id), parentId, adjusted, node)
}

export function duplicateNode(doc: PageDoc, id: string): { doc: PageDoc; newId: string | null } {
  const node = findNode(doc, id)
  const loc = findParent(doc, id)
  if (!node || !loc) return { doc, newId: null }
  const copy = cloneWithNewIds(node)
  return { doc: insertNode(doc, loc.parentId, loc.index + 1, copy), newId: copy.id }
}

export function countNodes(doc: PageDoc): number {
  let n = 0
  walk(doc.sections, () => {
    n++
  })
  return n
}

export function normalizeDoc(value: unknown): PageDoc {
  if (value && typeof value === 'object' && Array.isArray((value as PageDoc).sections)) {
    return { version: 1, sections: (value as PageDoc).sections }
  }
  return { version: 1, sections: [] }
}
