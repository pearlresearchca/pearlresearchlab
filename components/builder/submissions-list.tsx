'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  AlertTriangle, CheckCircle2, Clock, Download, Inbox, Mail, MailOpen, MinusCircle, Paperclip, Phone, Reply, Search, Settings2, Trash2, XCircle,
} from 'lucide-react'
import { deleteSubmissionAction, markSubmissionAction } from '@/lib/builder/actions'
import { relativeTime } from '@/lib/cms/format'
import type { Submission } from '@/lib/builder/submissions'
import type { EmailLogEntry } from '@/lib/email/form-notifications'
import { Initials } from '@/components/admin/sidebar'
import { Btn, ConfirmProvider, IconBtn, cx, useConfirm } from './ui'
import { EmailSettingsDialog, type EmailSettingsProps } from './email-settings-dialog'

type Props = {
  submissions: Submission[]
  pageTitles: Record<string, string>
  initialId?: string
  email: EmailSettingsProps | null // null for non-admins
}

export function SubmissionsList(props: Props) {
  return (
    <ConfirmProvider>
      <Inner {...props} />
    </ConfirmProvider>
  )
}

function toCsv(rows: Submission[]) {
  const labels = [...new Set(rows.flatMap((r) => r.data.map((d) => d.label)))]
  // Prefix formula-like cells so spreadsheets don't execute them.
  const esc = (v: string) => `"${(/^[=+\-@]/.test(v) ? "'" + v : v).replace(/"/g, '""')}"`
  const lines = [['Date', 'Form', ...labels].map(esc).join(',')]
  for (const r of rows) {
    const map = Object.fromEntries(r.data.map((d) => [d.label, d.value]))
    lines.push([new Date(r.created_at).toISOString(), r.form_name, ...labels.map((l) => map[l] ?? '')].map((v) => esc(String(v))).join(','))
  }
  return lines.join('\n')
}

// Pulls the useful bits out of a submission, whatever the form's labels are.
function describe(s: Submission) {
  const email = s.data.find((d) => d.kind === 'email')?.value
  const name = s.data.find((d) => /name/i.test(d.label) && !/organi[sz]ation|program|community/i.test(d.label))?.value
  const phone = s.data.find((d) => d.kind === 'tel')?.value
  const message = s.data.find((d) => d.kind === 'textarea')
  const topic = s.data.find((d) => /topic|discuss|subject/i.test(d.label))?.value
  return { name: name || email || 'Anonymous', email, phone, message, topic }
}

function EmailChip({ label, entry }: { label: string; entry?: EmailLogEntry }) {
  if (!entry) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-slate-500" title="Sent before email notifications were set up, or still sending">
        <Clock className="size-3.5" /> {label}: not recorded
      </span>
    )
  }
  const tone =
    entry.status === 'sent'
      ? { cls: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', icon: <CheckCircle2 className="size-3.5" />, text: 'sent' }
      : entry.status === 'failed'
        ? { cls: 'bg-red-50 text-red-700 ring-red-600/15', icon: <XCircle className="size-3.5" />, text: 'failed' }
        : { cls: 'bg-slate-100 text-slate-600 ring-slate-500/10', icon: <MinusCircle className="size-3.5" />, text: 'not sent' }
  const title = [entry.to?.length ? `To: ${entry.to.join(', ')}` : '', entry.error ?? '', new Date(entry.at).toLocaleString()].filter(Boolean).join('\n')
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset', tone.cls)} title={title}>
      {tone.icon} {label} {tone.text}
    </span>
  )
}

function Inner({ submissions, pageTitles, initialId, email }: Props) {
  const router = useRouter()
  const confirm = useConfirm()
  const [open, setOpen] = useState<string | null>(initialId && submissions.some((s) => s.id === initialId) ? initialId : submissions[0]?.id ?? null)
  const [form, setForm] = useState('all')
  const [view, setView] = useState<'all' | 'unread'>('all')
  const [query, setQuery] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const forms = useMemo(() => [...new Set(submissions.map((s) => s.form_name))], [submissions])
  const unread = submissions.filter((s) => !s.is_read).length
  const weekAgo = Date.now() - 7 * 86_400_000
  const thisWeek = submissions.filter((s) => new Date(s.created_at).getTime() >= weekAgo).length
  const failed = submissions.filter((s) => s.email_log?.team?.status === 'failed' || s.email_log?.sender?.status === 'failed').length

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return submissions.filter(
      (s) =>
        (form === 'all' || s.form_name === form) &&
        (view === 'all' || !s.is_read) &&
        (!q || s.data.some((d) => d.value.toLowerCase().includes(q)) || s.form_name.toLowerCase().includes(q))
    )
  }, [submissions, form, view, query])
  const current = list.find((s) => s.id === open) ?? list[0] ?? null

  async function mark(s: Submission, read: boolean) {
    const r = await markSubmissionAction(s.id, read)
    if ('error' in r) toast.error(r.error)
    else router.refresh()
  }

  // Opening a message (including from an email link) marks it as read.
  useEffect(() => {
    if (current && !current.is_read) mark(current, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id])

  const exportCsv = () => {
    const blob = new Blob([toCsv(list)], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `submissions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const stats = [
    { label: 'Total messages', value: submissions.length, icon: Inbox },
    { label: 'Unread', value: unread, icon: Mail, accent: unread > 0 },
    { label: 'Last 7 days', value: thisWeek, icon: Clock },
    { label: 'Email problems', value: failed, icon: AlertTriangle, warn: failed > 0 },
  ]

  return (
    <div className="flex flex-col gap-5">
      {email && !email.gmailConfigured && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><Mail className="size-5" /></span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-amber-900">Email notifications are not connected</p>
            <p className="text-amber-800">Messages are saved here, but nobody is emailed yet. Connect a Gmail account to notify your team and thank each sender.</p>
          </div>
          <Btn onClick={() => setSettingsOpen(true)}><Settings2 className="size-4" /> Set up email</Btn>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,.04)]">
            <span className={cx('flex size-10 shrink-0 items-center justify-center rounded-xl', s.warn ? 'bg-red-50 text-red-600' : s.accent ? 'bg-primary/10 text-primary' : 'bg-muted text-slate-500')}>
              <s.icon className="size-[18px]" />
            </span>
            <div>
              <p className="text-2xl font-semibold leading-none text-foreground">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
          <Inbox className="mx-auto size-10 text-slate-300" />
          <p className="mt-3 font-semibold text-foreground">No messages yet</p>
          <p className="mt-1 text-sm text-muted-foreground">When someone fills in a form on your website, it will appear here{email?.gmailConfigured ? ' and be emailed to your team' : ''}.</p>
        </div>
      ) : (
        <div className="grid overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,.04)] lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* List */}
          <div className="flex min-h-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
            <div className="flex flex-col gap-3 border-b border-border p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search messages…"
                  aria-label="Search messages"
                  className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg bg-muted p-1 text-xs font-semibold" role="tablist" aria-label="Show">
                  {(['all', 'unread'] as const).map((v) => (
                    <button key={v} type="button" role="tab" aria-selected={view === v} onClick={() => setView(v)} className={cx('rounded-md px-3 py-1.5 transition', view === v ? 'bg-surface text-primary shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-foreground')}>
                      {v === 'all' ? 'All' : `Unread${unread ? ` (${unread})` : ''}`}
                    </button>
                  ))}
                </div>
                {forms.length > 1 && (
                  <select value={form} onChange={(e) => setForm(e.target.value)} aria-label="Filter by form" className="ml-auto min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium outline-none focus:border-primary">
                    <option value="all">All forms</option>
                    {forms.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                )}
              </div>
            </div>
            <ul className="max-h-[420px] overflow-y-auto lg:max-h-[calc(100vh-330px)]">
              {list.length === 0 && <li className="px-4 py-10 text-center text-sm text-muted-foreground">No messages match.</li>}
              {list.map((s) => {
                const d = describe(s)
                const active = current?.id === s.id
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setOpen(s.id)}
                      className={cx('flex w-full gap-3 border-b border-border px-4 py-3.5 text-left transition', active ? 'bg-primary/[.06] shadow-[inset_3px_0_0_var(--color-primary,#4361ee)]' : 'hover:bg-muted/60')}
                    >
                      <Initials name={d.name} className="size-9 shrink-0 text-xs" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={cx('truncate text-sm', s.is_read ? 'font-medium text-foreground' : 'font-bold text-foreground')}>{d.name}</span>
                          <span suppressHydrationWarning className="ml-auto shrink-0 text-[11px] text-muted-foreground">{relativeTime(s.created_at)}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-medium text-slate-600">{d.topic || s.form_name}</span>
                        <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{d.message?.value ?? s.data.map((x) => x.value).join(' · ')}</span>
                      </span>
                      {!s.is_read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
              <span>{list.length} of {submissions.length}</span>
              <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"><Download className="size-3.5" /> Export CSV</button>
            </div>
          </div>

          {/* Detail */}
          {current ? (
            <Detail
              s={current}
              pageTitle={current.page_id ? pageTitles[current.page_id] : undefined}
              onMark={() => mark(current, !current.is_read)}
              onDelete={async () => {
                if (!(await confirm({ title: 'Delete this message?', body: 'It will be removed permanently, including any attached file.', confirmLabel: 'Delete', danger: true }))) return
                const r = await deleteSubmissionAction(current.id)
                if ('error' in r) toast.error(r.error)
                else {
                  toast.success('Message deleted')
                  router.refresh()
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center p-10 text-sm text-muted-foreground">Select a message</div>
          )}
        </div>
      )}

      {email && (
        <div className="flex justify-end">
          <Btn onClick={() => setSettingsOpen(true)}><Settings2 className="size-4" /> Email settings</Btn>
        </div>
      )}
      {email && <EmailSettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} {...email} />}
    </div>
  )
}

function Detail({ s, pageTitle, onMark, onDelete }: { s: Submission; pageTitle?: string; onMark: () => void; onDelete: () => void }) {
  const d = describe(s)
  const details = s.data.filter((x) => x !== d.message)
  const replyHref = d.email ? `mailto:${d.email}?subject=${encodeURIComponent(`Re: your message${d.topic ? ` — ${d.topic}` : ''}`)}` : undefined

  return (
    <article className="flex min-w-0 flex-col">
      <header className="flex flex-wrap items-start gap-4 border-b border-border px-6 py-5">
        <Initials name={d.name} className="size-12 text-base" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-foreground">{d.name}</h2>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {d.email && <a href={`mailto:${d.email}`} className="inline-flex items-center gap-1.5 hover:text-primary"><Mail className="size-3.5" /> {d.email}</a>}
            {d.phone && <a href={`tel:${d.phone.replace(/[^\d+]/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-primary"><Phone className="size-3.5" /> {d.phone}</a>}
            <span suppressHydrationWarning className="inline-flex items-center gap-1.5"><Clock className="size-3.5" /> {new Date(s.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {replyHref && (
            <a href={replyHref} className="mr-1 inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/30 transition hover:bg-primary-dark">
              <Reply className="size-4" /> Reply
            </a>
          )}
          <IconBtn label={s.is_read ? 'Mark as unread' : 'Mark as read'} onClick={onMark}>{s.is_read ? <Mail /> : <MailOpen />}</IconBtn>
          <IconBtn label="Delete" className="hover:text-red-600" onClick={onDelete}><Trash2 /></IconBtn>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background/50 px-6 py-3">
        <span className="rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">{s.form_name}</span>
        {pageTitle && <span className="text-xs text-muted-foreground">from the “{pageTitle}” page</span>}
        <span className="ml-auto flex flex-wrap gap-1.5">
          <EmailChip label="Team email" entry={s.email_log?.team} />
          <EmailChip label="Thank-you" entry={s.email_log?.sender} />
        </span>
      </div>

      <div className="flex flex-col gap-6 overflow-y-auto px-6 py-6 lg:max-h-[calc(100vh-330px)]">
        {d.message && (
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{d.message.label}</h3>
            <div className="whitespace-pre-wrap rounded-xl border-l-4 border-amber-400 bg-amber-50/40 px-5 py-4 text-[15px] leading-relaxed text-foreground">{d.message.value}</div>
          </section>
        )}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Details</h3>
          <dl className="grid overflow-hidden rounded-xl border border-border sm:grid-cols-2">
            {details.map((x, i) => (
              <div key={i} className="border-b border-border px-4 py-3 last:border-b-0 sm:[&:nth-last-child(2):nth-child(odd)]:border-b-0 sm:odd:border-r">
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{x.label}</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                  {x.fileKey ? (
                    <a className="inline-flex items-center gap-1 text-primary hover:underline" href={`/admin/submissions/file?key=${encodeURIComponent(x.fileKey)}`} target="_blank" rel="noopener noreferrer"><Paperclip className="size-3.5" /> {x.fileName ?? 'Download file'}</a>
                  ) : x.kind === 'email' ? (
                    <a className="text-primary hover:underline" href={`mailto:${x.value}`}>{x.value}</a>
                  ) : (
                    x.value
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        {(s.email_log?.team?.status === 'failed' || s.email_log?.sender?.status === 'failed') && (
          <p className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{s.email_log?.team?.status === 'failed' ? `Team email failed: ${s.email_log.team.error}` : ''} {s.email_log?.sender?.status === 'failed' ? `Thank-you email failed: ${s.email_log.sender.error}` : ''}</span>
          </p>
        )}
      </div>
    </article>
  )
}
