import { Inbox } from 'lucide-react'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SubmissionsList } from '@/components/builder/submissions-list'
import { hasAny, requireAdmin } from '@/lib/builder/admin-data'
import type { Submission } from '@/lib/builder/submissions'
import { createInsForgeServerClient } from '@/lib/insforge/server'

export default async function SubmissionsPage() {
  const admin = await requireAdmin()
  if (!hasAny(admin.profile, ['pages', 'contact'])) return <NoSectionAccess label="Form submissions" />
  const insforge = await createInsForgeServerClient()
  const [{ data }, { data: pages }] = await Promise.all([
    insforge.database.from('cms_form_submissions').select('id, page_id, form_name, data, is_read, created_at').order('created_at', { ascending: false }).limit(500),
    insforge.database.from('cms_pages').select('id, title').limit(1000),
  ])
  const titles = Object.fromEntries(((pages ?? []) as { id: string; title: string }[]).map((p) => [p.id, p.title]))
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Inbox className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Form submissions</h1>
          <p className="text-sm text-muted-foreground">Messages sent through forms on your pages.</p>
        </div>
      </div>
      <SubmissionsList submissions={(data ?? []) as Submission[]} pageTitles={titles} />
    </div>
  )
}
