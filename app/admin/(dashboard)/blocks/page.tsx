import { Blocks } from 'lucide-react'
import { NoSectionAccess } from '@/components/admin/no-access'
import { BlocksManager } from '@/components/builder/blocks-manager'
import { hasAny, requireAdmin } from '@/lib/builder/admin-data'
import { listReusableBlocks, listTemplates } from '@/lib/builder/queries'

export default async function BlocksPage() {
  const admin = await requireAdmin()
  if (!hasAny(admin.profile, ['pages'])) return <NoSectionAccess label="Reusable blocks" />
  const [blocks, templates] = await Promise.all([listReusableBlocks(), listTemplates()])
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Blocks className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reusable blocks &amp; templates</h1>
          <p className="text-sm text-muted-foreground">Sections and page layouts you’ve saved to reuse. Global blocks update everywhere they’re used.</p>
        </div>
      </div>
      <BlocksManager blocks={blocks} templates={templates} />
    </div>
  )
}
