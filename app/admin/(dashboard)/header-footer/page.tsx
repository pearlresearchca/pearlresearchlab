import { PanelsTopLeft } from 'lucide-react'
import { NoSectionAccess } from '@/components/admin/no-access'
import { HeaderFooterEditor } from '@/components/builder/header-footer-editor'
import { hasAny, requireAdmin } from '@/lib/builder/admin-data'
import { getSiteConfig } from '@/lib/builder/queries'

export default async function HeaderFooterPage() {
  const admin = await requireAdmin()
  if (!hasAny(admin.profile, ['design'])) return <NoSectionAccess label="Header & footer" />
  const config = await getSiteConfig()
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <PanelsTopLeft className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Header &amp; footer</h1>
          <p className="text-sm text-muted-foreground">Shown on every page. Logo, contact details and social links come from Site settings.</p>
        </div>
      </div>
      <HeaderFooterEditor header={config.header} footer={config.footer} />
    </div>
  )
}
