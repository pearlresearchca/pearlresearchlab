'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { createInsForgeAdminClient } from '@/lib/insforge/server'
import { withErrorHandling, check, type ActionResult } from '@/lib/cms/action-result'
import { getSiteConfig } from '@/lib/builder/queries'
import { SITE_URL } from '@/lib/builder/admin-data'
import { isGmailConfigured, sendMail } from '@/lib/email/gmail'
import { escapeHtml } from '@/lib/email/templates'
import { getNotificationSettings, teamRecipients, type NotificationSettings } from '@/lib/email/form-notifications'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

async function requireAdminRole() {
  const me = await getCurrentAdmin()
  if (me?.profile?.role !== 'admin') throw new Error('Only admins can change email settings.')
  return me
}

export async function saveNotificationSettingsAction(input: NotificationSettings): Promise<ActionResult> {
  return withErrorHandling(async () => {
    await requireAdminRole()
    const emails = [...new Set((input.teamEmails ?? []).map((e) => String(e).trim().toLowerCase()).filter(Boolean))]
    const bad = emails.find((e) => !EMAIL.test(e))
    if (bad) throw new Error(`“${bad}” doesn’t look like an email address.`)
    if (emails.length > 10) throw new Error('Add at most 10 notification addresses.')
    const value: NotificationSettings = { teamEmails: emails, notifyTeam: !!input.notifyTeam, sendThankYou: !!input.sendThankYou }

    const admin = createInsForgeAdminClient()
    const { data: existing } = await admin.database.from('cms_settings').select('key').eq('key', 'notifications').maybeSingle()
    check(
      existing
        ? await admin.database.from('cms_settings').update({ value }).eq('key', 'notifications')
        : await admin.database.from('cms_settings').insert([{ key: 'notifications', value }])
    )
    revalidatePath('/admin/submissions')
  })
}

export async function sendTestEmailAction(): Promise<ActionResult> {
  return withErrorHandling(async () => {
    const me = await requireAdminRole()
    if (!isGmailConfigured()) throw new Error('Gmail isn’t connected yet — add SMTP_USER and SMTP_PASSWORD first.')
    const [settings, config] = await Promise.all([getNotificationSettings(), getSiteConfig()])
    const to = teamRecipients(settings, config.site)
    if (to.length === 0) throw new Error('Add at least one notification address first.')
    const name = me.profile?.full_name || me.email
    const r = await sendMail({
      to,
      subject: `Test email from the ${config.site.shortName || config.site.siteName} website`,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#132d2c;max-width:520px;margin:24px auto;padding:28px;border:1px solid #dfe8e6;border-radius:16px;"><h2 style="font-family:Georgia,serif;font-weight:normal;margin:0 0 12px;">Email is working ✓</h2><p style="margin:0 0 12px;">${escapeHtml(name)} sent this test from the admin. New form submissions will be emailed to this address.</p><p style="margin:0;"><a href="${SITE_URL}/admin/submissions" style="color:#146b68;">Open Form submissions</a></p></div>`,
      text: `Email is working. ${name} sent this test from the admin. New form submissions will be emailed to this address.`,
      fromName: `${config.site.shortName || config.site.siteName} website`,
    })
    if (!r.ok) throw new Error(r.error)
  })
}
