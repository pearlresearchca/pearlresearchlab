import Link from 'next/link'
import { LayoutTemplate, PenLine } from 'lucide-react'
import { createInsForgeServerClient } from '@/lib/insforge/server'

// Explains the two ways a core page can be edited: this quick text form, or
// the page builder for layout and design — and whether the builder version
// is what visitors currently see.
export async function CorePageNotice({ legacyKey, label }: { legacyKey: string; label: string }) {
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database.from('cms_pages').select('id, status').eq('legacy_key', legacyKey).maybeSingle()
  const page = data as { id: string; status: string } | null
  const live = page?.status === 'published'

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-primary/20 bg-primary/[.04] p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <PenLine className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-semibold text-foreground">Quick text editing</p>
        <p className="text-muted-foreground">
          {live
            ? `Visitors currently see the page-builder design of the ${label} page, so changes here won’t appear on the site. Edit the text in the page builder instead.`
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
