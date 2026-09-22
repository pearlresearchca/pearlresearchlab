'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Loader2, Send, XCircle } from 'lucide-react'
import { saveNotificationSettingsAction, sendTestEmailAction } from '@/app/admin/(dashboard)/submissions/actions'
import type { NotificationSettings } from '@/lib/email/form-notifications'
import { Btn, Dialog, Toggle, inputClass } from './ui'

export type EmailSettingsProps = {
  gmailConfigured: boolean
  gmailAccount: string
  fallbackRecipient: string
  settings: NotificationSettings
}

export function EmailSettingsDialog({ open, onClose, gmailConfigured, gmailAccount, fallbackRecipient, settings }: EmailSettingsProps & { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [emails, setEmails] = useState(settings.teamEmails.join('\n'))
  const [notifyTeam, setNotifyTeam] = useState(settings.notifyTeam)
  const [sendThankYou, setSendThankYou] = useState(settings.sendThankYou)
  const [saving, startSave] = useTransition()
  const [testing, startTest] = useTransition()

  const parsed = emails.split(/[\s,;]+/).map((e) => e.trim()).filter(Boolean)

  function save() {
    startSave(async () => {
      const r = await saveNotificationSettingsAction({ teamEmails: parsed, notifyTeam, sendThankYou })
      if ('error' in r) return void toast.error(r.error)
      toast.success('Email settings saved')
      router.refresh()
      onClose()
    })
  }

  function test() {
    startTest(async () => {
      const r = await sendTestEmailAction()
      if ('error' in r) toast.error(r.error)
      else toast.success('Test email sent — check the inbox')
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Email settings"
      description="Who is told about new form messages, and whether senders get a thank-you email."
      footer={
        <>
          <Btn onClick={test} disabled={!gmailConfigured || testing}>
            {testing ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Send test email
          </Btn>
          <Btn variant="primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</Btn>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${gmailConfigured ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          {gmailConfigured ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 size-5 shrink-0 text-amber-600" />}
          <div className="min-w-0">
            {gmailConfigured ? (
              <>
                <p className="font-semibold text-emerald-900">Gmail connected</p>
                <p className="break-all text-emerald-800">Emails are sent from {gmailAccount}.</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-amber-900">Gmail not connected yet</p>
                <p className="text-amber-800">
                  Your developer needs to add <code className="rounded bg-white/70 px-1">SMTP_USER</code> and <code className="rounded bg-white/70 px-1">SMTP_PASSWORD</code> to the server settings. Your choices below are saved and used as soon as it’s connected.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="notify-emails" className="text-[13px] font-semibold text-foreground">Send new messages to</label>
          <textarea id="notify-emails" rows={3} className={inputClass} value={emails} onChange={(e) => setEmails(e.target.value)} placeholder="team@example.com&#10;director@example.com" />
          <p className="text-[11px] leading-snug text-muted-foreground">
            One address per line (up to 10). {fallbackRecipient ? <>Leave empty to use <strong>{fallbackRecipient}</strong>.</> : 'Leave empty to use the site’s contact email.'}
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
          <Toggle id="notify-team" checked={notifyTeam} onChange={setNotifyTeam} label="Email the team about each new message" />
          <Toggle id="send-thanks" checked={sendThankYou} onChange={setSendThankYou} label="Send a thank-you email to the person who wrote in" />
        </div>
        <p className="text-[11px] text-muted-foreground">Email designs are the HTML files in <code>templates/email</code>. Gmail allows about 500 emails a day.</p>
      </div>
    </Dialog>
  )
}
