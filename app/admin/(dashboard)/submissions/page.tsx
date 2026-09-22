import { Inbox } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SubmissionsList } from '@/components/builder/submissions-list'
import { hasAny, requireAdmin } from '@/lib/builder/admin-data'
import type { Submission } from '@/lib/builder/submissions'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { unwrap } from '@/lib/cms/data-error'

export default async function SubmissionsPage() {
  const admin = await requireAdmin()
  if (!hasAny(admin.profile, ['pages', 'contact'])) return <NoSectionAccess label="Form submissions" />
  const insforge = await createInsForgeServerClient()
  const [subsRes, pagesRes] = await Promise.all([
    insforge.database.from('cms_form_submissions').select('id, page_id, form_name, data, is_read, created_at').order('created_at', { ascending: false }).limit(500),
    insforge.database.from('cms_pages').select('id, title').limit(1000),
  ])
  const data = unwrap(subsRes, 'form submissions')
  const pages = unwrap(pagesRes, 'page titles')
  const titles = Object.fromEntries(((pages ?? []) as { id: string; title: string }[]).map((p) => [p.id, p.title]))
  return (
    <div className="flex flex-col">
      <PageHeader group="Content" title={'Form submissions'} description={'Messages sent through forms on your pages.'} icon={<Inbox />} />
      <SubmissionsList submissions={(data ?? []) as Submission[]} pageTitles={titles} />
    </div>
  )
}
