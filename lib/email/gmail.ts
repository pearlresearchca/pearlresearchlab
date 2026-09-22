import nodemailer, { type Transporter } from 'nodemailer'

// Sends email through a Gmail (or Google Workspace) account using an App
// Password — see .env.example. Server-only: the credentials never reach the
// browser.

export type MailResult = { ok: true; id?: string } | { ok: false; error: string }

let transporter: Transporter | null = null

// SMTP_USER / SMTP_PASSWORD (GMAIL_USER / GMAIL_APP_PASSWORD also accepted).
const user = () => process.env.SMTP_USER || process.env.GMAIL_USER || ''
const password = () => (process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '')

export function isGmailConfigured(): boolean {
  return !!(user() && password())
}

export function gmailAddress(): string {
  return user()
}

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: user(), pass: password() },
      // Fail fast so a slow mail server never holds up anything else.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    })
  }
  return transporter
}

export async function sendMail(opts: { to: string[]; subject: string; html: string; text: string; replyTo?: string; fromName: string }): Promise<MailResult> {
  if (!isGmailConfigured()) return { ok: false, error: 'Gmail is not connected (SMTP_USER / SMTP_PASSWORD are not set).' }
  if (opts.to.length === 0) return { ok: false, error: 'No recipients.' }
  try {
    const info = await getTransporter().sendMail({
      from: { name: opts.fromName.replace(/["<>]/g, ''), address: user() },
      to: opts.to,
      replyTo: opts.replyTo,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
    })
    return { ok: true, id: info.messageId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // The most common setup mistake, explained in plain words.
    if (/535|Username and Password not accepted|BadCredentials/i.test(message)) {
      return { ok: false, error: 'Gmail rejected the login. Check SMTP_USER and that SMTP_PASSWORD is a 16-character App Password (not your normal password).' }
    }
    return { ok: false, error: message.slice(0, 300) }
  }
}
