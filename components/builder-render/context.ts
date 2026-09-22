import type { ReactNode } from 'react'
import type { AboutValue, Partner, Project, ProjectSection, ResearchArea, TeamMember } from '@/lib/cms/types'
import type { BuilderNode, SiteSettings } from '@/lib/builder/types'

// Everything a block might need to render, loaded up-front on the server so
// render components stay synchronous and work identically in the builder
// canvas (client) and on the public site (server).
export type RenderData = {
  pageSlugs: Record<string, string>
  site: SiteSettings
  researchAreas?: ResearchArea[]
  team?: TeamMember[]
  projects?: { project: Project; sections: ProjectSection[] }[]
  partners?: Record<string, Partner[]>
  values?: AboutValue[]
  globalBlocks?: Record<string, { name: string; block: BuilderNode }>
}

// Hooks the builder canvas plugs into the renderer. Absent on the public site.
export type EditorBridge = {
  editingId: string | null
  inlineText: (node: BuilderNode, key: string, tag: string, className: string, extra?: Record<string, unknown>) => ReactNode
  richText: (node: BuilderNode, className: string) => ReactNode
  emptyContainer: (node: BuilderNode) => ReactNode
}

export type RenderContext = {
  data: RenderData
  pageId?: string
  editor?: EditorBridge
  // Sanitizes rich/custom HTML (sanitize-html on the server, DOMPurify in the builder).
  html: (type: string, html: string) => string
  // Global blocks may not include themselves.
  globalStack?: string[]
}
