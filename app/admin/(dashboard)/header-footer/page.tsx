import { PanelsTopLeft } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { NoSectionAccess } from '@/components/admin/no-access'
import { HeaderFooterEditor } from '@/components/builder/header-footer-editor'
import { hasAny, requireAdmin } from '@/lib/builder/admin-data'
import { getSiteConfig } from '@/lib/builder/queries'

export default async function HeaderFooterPage() {
  const admin = await requireAdmin()
  if (!hasAny(admin.profile, ['design'])) return <NoSectionAccess label="Header & footer" />
  const config = await getSiteConfig()
  return (
    <div className="flex flex-col">
      <PageHeader group="Website" title={'Header & footer'} description={'Shown on every page. Logo, contact details and social links come from Site settings.'} icon={<PanelsTopLeft />} />
      <HeaderFooterEditor header={config.header} footer={config.footer} versions={config.versions} />
    </div>
  )
}
