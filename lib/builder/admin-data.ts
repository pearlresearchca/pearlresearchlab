import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess, type SectionKey } from '@/lib/cms/permissions'
import { getSiteConfig, listPages, listReusableBlocks, listTemplates, loadRenderData } from './queries'
import type { PageDoc } from './types'

export const SITE_URL = 'https://pearlresearchlab.vercel.app'

// Signed-in admin with a profile, or a redirect to login / no-access.
export async function requireAdmin() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/admin/login')
  if (!admin.profile) redirect('/admin/no-access')
  return { ...admin, profile: admin.profile }
}

export function hasAny(profile: { role: 'admin' | 'editor'; sections: string[] }, sections: SectionKey[]) {
  return sections.some((s) => canAccess(profile, s))
}

// Everything the builder needs besides the document itself. The canvas can
// show any block, so all site collections are loaded.
export async function loadBuilderContext(docs: PageDoc[]) {
  const [data, config, pages, blocks, templates] = await Promise.all([
    loadRenderData(docs, { everything: true }),
    getSiteConfig(),
    listPages(),
    listReusableBlocks(),
    listTemplates(),
  ])
  const { fonts: _fonts, ...renderData } = data
  return {
    data: renderData,
    theme: config.theme,
    themeVersion: config.versions.theme ?? 0,
    pages: pages.map((p) => ({ id: p.id, title: p.title, slug: p.slug, status: p.status })),
    savedBlocks: blocks,
    templates,
  }
}
