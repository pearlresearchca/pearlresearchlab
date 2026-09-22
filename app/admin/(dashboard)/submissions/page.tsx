import { Inbox } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SubmissionsList } from '@/components/builder/submissions-list'
import { hasAny, requireAdmin } from '@/lib/builder/admin-data'
import type { Submission } from '@/lib/builder/submissions'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { unwrap } from '@/lib/cms/data-error'
import { getSiteConfig } from '@/lib/builder/queries'
import { gmailAddress, isGmailConfigured } from '@/lib/email/gmail'
import { getNotificationSettings, teamRecipients } from '@/lib/email/form-notifications'

export default async function SubmissionsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const admin = await requireAdmin()
  if (!hasAny(admin.profile, ['pages', 'contact'])) return <NoSectionAccess label="Form submissions" />
  const isAdmin = admin.profile?.role === 'admin'
  const { id } = await searchParams
  const insforge = await createInsForgeServerClient()
  const [subsRes, pagesRes, settings, config] = await Promise.all([
    insforge.database.from('cms_form_submissions').select('id, page_id, form_name, data, is_read, created_at, email_log').order('created_at', { ascending: false }).limit(500),
    insforge.database.from('cms_pages').select('id, title').limit(1000),
    isAdmin ? getNotificationSettings() : Promise.resolve(null),
    getSiteConfig(),
  ])
  const data = unwrap(subsRes, 'form submissions')
  const pages = unwrap(pagesRes, 'page titles')
  const titles = Object.fromEntries(((pages ?? []) as { id: string; title: string }[]).map((p) => [p.id, p.title]))

  // Only admins manage who gets emailed; the account address is shown, never the password.
  const email = settings
    ? {
        gmailConfigured: isGmailConfigured(),
        gmailAccount: gmailAddress(),
        fallbackRecipient: teamRecipients({ ...settings, teamEmails: [] }, config.site)[0] ?? '',
        settings,
      }
    : null

  return (
    <div className="flex flex-col">
      <PageHeader group="Shared content" title="Form submissions" description="Messages people send through forms on your website." icon={<Inbox />} />
      <SubmissionsList submissions={(data ?? []) as Submission[]} pageTitles={titles} initialId={id} email={email} />
    </div>
  )
}
