import { Palette } from 'lucide-react'
import { NoSectionAccess } from '@/components/admin/no-access'
import { ThemeEditor } from '@/components/builder/theme-editor'
import { hasAny, requireAdmin } from '@/lib/builder/admin-data'
import { getSiteConfig } from '@/lib/builder/queries'

export default async function ThemePage() {
  const admin = await requireAdmin()
  if (!hasAny(admin.profile, ['design'])) return <NoSectionAccess label="Theme" />
  const config = await getSiteConfig()
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Palette className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Theme</h1>
          <p className="text-sm text-muted-foreground">Global colours, fonts and styles. Changes apply to every page, including the original ones.</p>
        </div>
      </div>
      <ThemeEditor initial={config.theme} />
    </div>
  )
}
