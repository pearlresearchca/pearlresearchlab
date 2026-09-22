import { Settings } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SiteSettingsEditor } from '@/components/builder/site-settings-editor'
import { SITE_URL, hasAny, requireAdmin } from '@/lib/builder/admin-data'
import { getSiteConfig } from '@/lib/builder/queries'

export default async function SiteSettingsPage() {
  const admin = await requireAdmin()
  if (!hasAny(admin.profile, ['global', 'seo'])) return <NoSectionAccess label="Site settings" />
  const config = await getSiteConfig()
  return (
    <div className="flex flex-col">
      <PageHeader group="Website" title={'Site settings'} description={'Site name, logo, default SEO, contact details and social media links.'} icon={<Settings />} />
      <SiteSettingsEditor initial={config.site} siteUrl={SITE_URL} version={config.versions.site ?? 0} />
    </div>
  )
}
