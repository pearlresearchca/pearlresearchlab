import { Settings } from 'lucide-react'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SiteSettingsEditor } from '@/components/builder/site-settings-editor'
import { SITE_URL, hasAny, requireAdmin } from '@/lib/builder/admin-data'
import { getSiteConfig } from '@/lib/builder/queries'

export default async function SiteSettingsPage() {
  const admin = await requireAdmin()
  if (!hasAny(admin.profile, ['global', 'seo'])) return <NoSectionAccess label="Site settings" />
  const config = await getSiteConfig()
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Settings className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Site settings</h1>
          <p className="text-sm text-muted-foreground">Site name, logo, default SEO, contact details and social media links.</p>
        </div>
      </div>
      <SiteSettingsEditor initial={config.site} siteUrl={SITE_URL} />
    </div>
  )
}
