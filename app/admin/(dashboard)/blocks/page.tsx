import { Blocks } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { NoSectionAccess } from '@/components/admin/no-access'
import { BlocksManager } from '@/components/builder/blocks-manager'
import { hasAny, requireAdmin } from '@/lib/builder/admin-data'
import { listReusableBlocks, listTemplates } from '@/lib/builder/queries'

export default async function BlocksPage() {
  const admin = await requireAdmin()
  if (!hasAny(admin.profile, ['pages'])) return <NoSectionAccess label="Reusable blocks" />
  const [blocks, templates] = await Promise.all([listReusableBlocks(), listTemplates()])
  return (
    <div className="flex flex-col">
      <PageHeader group="Content" title={'Reusable blocks & templates'} description={'Sections and page layouts you’ve saved to reuse. Global blocks update everywhere they’re used.'} icon={<Blocks />} />
      <BlocksManager blocks={blocks} templates={templates} />
    </div>
  )
}
