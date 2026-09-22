import { createInsForgeAdminClient } from '@/lib/insforge/server'
import { SITE_URL } from '@/lib/builder/admin-data'
import type { SiteSettings } from '@/lib/builder/types'
import { gmailAddress, sendMail, type MailResult } from './gmail'
import { escapeHtml, renderTemplate } from './templates'

// Emails sent after a website form is submitted:
//   • team   — a notification to the addresses in Form submissions → Email settings
//   • sender — a thank-you copy to the person who filled in the form
// Delivery problems never affect the submission itself; the outcome is saved
// on the submission (email_log) and shown in the admin.

export type NotificationSettings = {
  teamEmails: string[]
  notifyTeam: boolean
  sendThankYou: boolean
}

export const DEFAULT_NOTIFICATIONS: NotificationSettings = { teamEmails: [], notifyTeam: true, sendThankYou: true }

export type SubmittedValue = { label: string; kind: string; value: string; fileName?: string }

export type EmailLogEntry = { status: 'sent' | 'failed' | 'skipped'; at: string; to?: string[]; error?: string }
export type EmailLog = { team?: EmailLogEntry; sender?: EmailLogEntry }

type Admin = ReturnType<typeof createInsForgeAdminClient>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function getNotificationSettings(admin: Admin = createInsForgeAdminClient()): Promise<NotificationSettings> {
  const { data } = await admin.database.from('cms_settings').select('value').eq('key', 'notifications').maybeSingle()
  const value = (data as { value?: Partial<NotificationSettings> } | null)?.value ?? {}
  return {
    teamEmails: Array.isArray(value.teamEmails) ? value.teamEmails.filter((e) => EMAIL.test(e)) : [],
    notifyTeam: value.notifyTeam !== false,
    sendThankYou: value.sendThankYou !== false,
  }
}

// Who receives team notifications: the configured list, else the site's
// public contact email, else the Gmail account itself.
export function teamRecipients(settings: NotificationSettings, site: Pick<SiteSettings, 'contactEmail'>): string[] {
  if (settings.teamEmails.length) return settings.teamEmails
  if (site.contactEmail && EMAIL.test(site.contactEmail)) return [site.contactEmail]
  return gmailAddress() ? [gmailAddress()] : []
}

const cell = 'padding:11px 16px;border-bottom:1px solid #eef3f1;vertical-align:top;font-family:Arial,Helvetica,sans-serif;'

function rows(values: SubmittedValue[]): string {
  return values
    .map((v, i) => {
      const last = i === values.length - 1 ? 'border-bottom:0;' : ''
      const shown = v.fileName ? `📎 ${escapeHtml(v.fileName)} <span style="color:#7a8a88;">(download it in the admin)</span>` : escapeHtml(v.value).replace(/\n/g, '<br />')
      return `<tr><td width="38%" style="${cell}${last}font-size:13px;color:#5b6b69;">${escapeHtml(v.label)}</td><td style="${cell}${last}font-size:14px;color:#132d2c;">${shown}</td></tr>`
    })
    .join('')
}

function plainText(values: SubmittedValue[]): string {
  return values.map((v) => `${v.label}: ${v.fileName ?? v.value}`).join('\n')
}

function absolute(url: string | undefined): string {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return url.startsWith('/') ? SITE_URL + url : ''
}

export async function sendFormEmails(args: {
  submissionId: string
  formName: string
  pageLabel: string
  values: SubmittedValue[]
  site: SiteSettings
  allowThankYou: boolean
}): Promise<EmailLog> {
  const admin = createInsForgeAdminClient()
  const settings = await getNotificationSettings(admin)
  const { site, values, formName } = args
  const now = () => new Date().toISOString()

  const senderEmail = values.find((v) => v.kind === 'email' && EMAIL.test(v.value))?.value
  const senderName = values.find((v) => /name/i.test(v.label) && !/organi[sz]ation|program|community/i.test(v.label))?.value || senderEmail || 'Someone'
  const firstName = senderName.split(/\s+/)[0]
  const message = values.find((v) => v.kind === 'textarea')
  const details = values.filter((v) => v !== message)
  const submittedAt = new Date().toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Halifax' })
  const logo = absolute(site.logoUrl)
  const shared = {
    siteName: site.siteName,
    shortName: site.shortName || site.siteName,
    siteUrl: SITE_URL,
    formName,
    submittedAt,
    year: new Date().getFullYear(),
    logoCell: logo
      ? `<td style="padding-right:12px;vertical-align:middle;"><img src="${escapeHtml(logo)}" width="44" height="44" alt="" style="display:block;border:0;border-radius:10px;" /></td>`
      : '',
  }

  const log: EmailLog = {}

  // --- Team notification
  const team = teamRecipients(settings, site)
  if (!settings.notifyTeam) log.team = { status: 'skipped', at: now(), error: 'Team notifications are turned off.' }
  else if (team.length === 0) log.team = { status: 'skipped', at: now(), error: 'No notification email address is set.' }
  else {
    const html = await renderTemplate('contact-admin', {
      ...shared,
      preheader: message ? message.value.slice(0, 140) : `New ${formName} submission`,
      senderName,
      senderFirstName: firstName,
      senderEmail: senderEmail ?? 'no email given',
      pageLabel: args.pageLabel,
      adminUrl: `${SITE_URL}/admin/submissions?id=${args.submissionId}`,
      replyHref: senderEmail ? `mailto:${encodeURIComponent(senderEmail)}?subject=${encodeURIComponent(`Re: your message to ${shared.shortName}`)}` : `${SITE_URL}/admin/submissions?id=${args.submissionId}`,
      messageBlock: message
        ? `<tr><td style="padding:22px 32px 0 32px;font-family:Arial,Helvetica,sans-serif;"><div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#5b6b69;font-weight:bold;margin-bottom:10px;">${escapeHtml(message.label)}</div><div style="border-left:3px solid #d9b84d;background-color:#fbfaf5;border-radius:0 12px 12px 0;padding:16px 18px;font-size:15px;line-height:1.65;color:#132d2c;">${escapeHtml(message.value).replace(/\n/g, '<br />')}</div></td></tr>`
        : '',
      fieldRows: rows(details),
    })
    const r: MailResult = await sendMail({
      to: team,
      subject: `New message from ${senderName} · ${formName}`,
      html,
      text: `New ${formName} submission (${submittedAt})\n\n${message ? `${message.label}:\n${message.value}\n\n` : ''}${plainText(details)}\n\nOpen in admin: ${SITE_URL}/admin/submissions?id=${args.submissionId}`,
      replyTo: senderEmail,
      fromName: `${shared.shortName} website`,
    })
    log.team = r.ok ? { status: 'sent', at: now(), to: team } : { status: 'failed', at: now(), to: team, error: r.error }
  }

  // --- Thank-you to the sender
  if (!settings.sendThankYou || !args.allowThankYou) log.sender = { status: 'skipped', at: now(), error: 'Thank-you emails are turned off.' }
  else if (!senderEmail) log.sender = { status: 'skipped', at: now(), error: 'The form has no email address to reply to.' }
  else {
    const contactLines = [site.address?.replace(/\n/g, ', '), site.contactEmail, site.phone]
      .filter(Boolean)
      .map((line) => `<div>${escapeHtml(line)}</div>`)
      .join('')
    const html = await renderTemplate('contact-confirmation', {
      ...shared,
      preheader: `Thanks, ${firstName} — we’ve received your message and will be in touch soon.`,
      firstName,
      summaryRows: rows(values),
      contactLines,
    })
    const r = await sendMail({
      to: [senderEmail],
      subject: `Thank you for contacting ${shared.shortName}`,
      html,
      text: `Hi ${firstName},\n\nThank you for reaching out to ${site.siteName}. We’ve received your message and usually reply within 3–5 business days.\n\nA copy of your message:\n${plainText(values)}\n\n${site.siteName}\n${SITE_URL}`,
      replyTo: team[0] || site.contactEmail || undefined,
      fromName: site.siteName,
    })
    log.sender = r.ok ? { status: 'sent', at: now(), to: [senderEmail] } : { status: 'failed', at: now(), to: [senderEmail], error: r.error }
  }

  const { error } = await admin.database.from('cms_form_submissions').update({ email_log: log }).eq('id', args.submissionId)
  if (error) console.error('[forms] could not save email log', error)
  if (log.team?.status === 'failed' || log.sender?.status === 'failed') console.error('[forms] email delivery problem', log)
  return log
}
