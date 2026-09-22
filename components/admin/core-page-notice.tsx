import Link from 'next/link'
import { ChevronDown, LayoutTemplate, PenLine, TriangleAlert } from 'lucide-react'
import { createInsForgeServerClient } from '@/lib/insforge/server'

type BuilderPage = { id: string; status: string } | null

export async function getBuilderPage(legacyKey: string): Promise<BuilderPage> {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database.from('cms_pages').select('id, status').eq('legacy_key', legacyKey).maybeSingle()
  return data as BuilderPage
}

// Explains the two ways a core page can be edited: this quick text form, or
// the page builder for layout and design — and whether the builder version
// is what visitors currently see.
export async function CorePageNotice({ legacyKey, label, page }: { legacyKey: string; label: string; page?: BuilderPage }) {
  if (page === undefined) page = await getBuilderPage(legacyKey)
  const live = page?.status === 'published'

  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-2xl border p-4 ${
        live ? 'border-amber-300 bg-amber-50' : 'border-primary/20 bg-primary/[.04]'
      }`}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
          live ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'
        }`}
      >
        {live ? <TriangleAlert className="size-5" aria-hidden="true" /> : <PenLine className="size-5" aria-hidden="true" />}
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-foreground">
          {live ? `The live ${label} page is managed in the page builder` : 'Quick text editing'}
        </p>
        <p className="text-muted-foreground">
          {live
            ? `Visitors see the page-builder design of the ${label} page, so changes here won’t appear on the site. Edit the text in the page builder instead.`
            : `Change the wording and images of the ${label} page here. To change its layout, sections or design, open it in the page builder.`}
        </p>
      </div>
      <Link
        href={page ? `/admin/builder/${page.id}` : '/admin/pages'}
        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
      >
        <LayoutTemplate className="size-4" aria-hidden="true" /> {page ? 'Open in page builder' : 'Set up in page builder'}
      </Link>
    </div>
  )
}

// While the builder version is live the quick-text form only feeds the
// fallback page, so it is folded away instead of looking like the live editor.
export function CorePageFallback({ live, children }: { live: boolean; children: React.ReactNode }) {
  if (!live) return <>{children}</>
  return (
    <details className="group rounded-2xl border border-dashed border-border bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 text-sm [&::-webkit-details-marker]:hidden">
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="font-semibold text-foreground">Backup text</span>
          <span className="block text-muted-foreground">Only used if the page-builder version is unpublished. Editing it doesn’t change the live page.</span>
        </span>
      </summary>
      <div className="border-t border-border p-4">{children}</div>
    </details>
  )
}
