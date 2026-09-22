import { Palette } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { NoSectionAccess } from '@/components/admin/no-access'
import { ThemeEditor } from '@/components/builder/theme-editor'
import { hasAny, requireAdmin } from '@/lib/builder/admin-data'
import { getSiteConfig } from '@/lib/builder/queries'

export default async function ThemePage() {
  const admin = await requireAdmin()
  if (!hasAny(admin.profile, ['design'])) return <NoSectionAccess label="Theme" />
  const config = await getSiteConfig()
  return (
    <div className="flex flex-col">
      <PageHeader group="Website" title={'Theme'} description={'Global colours, fonts and styles. Changes apply to every page, including the original ones.'} icon={<Palette />} />
      <ThemeEditor initial={config.theme} version={config.versions.theme ?? 0} />
    </div>
  )
}
