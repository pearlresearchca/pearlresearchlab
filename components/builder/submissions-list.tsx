'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Download, Mail, MailOpen, Paperclip, Trash2 } from 'lucide-react'
import { deleteSubmissionAction, markSubmissionAction } from '@/lib/builder/actions'
import { relativeTime } from '@/lib/cms/format'
import type { Submission } from '@/lib/builder/submissions'
import { Btn, ConfirmProvider, IconBtn, cx, inputClass, useConfirm } from './ui'

export function SubmissionsList(props: { submissions: Submission[]; pageTitles: Record<string, string> }) {
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

function Inner({ submissions, pageTitles }: { submissions: Submission[]; pageTitles: Record<string, string> }) {
  const router = useRouter()
  const confirm = useConfirm()
  const [open, setOpen] = useState<string | null>(submissions[0]?.id ?? null)
  const [form, setForm] = useState('all')
  const forms = useMemo(() => [...new Set(submissions.map((s) => s.form_name))], [submissions])
  const list = submissions.filter((s) => form === 'all' || s.form_name === form)
  const current = list.find((s) => s.id === open) ?? null

  async function mark(s: Submission, read: boolean) {
    const r = await markSubmissionAction(s.id, read)
    if ('error' in r) toast.error(r.error)
    else router.refresh()
  }

  if (submissions.length === 0) {
    return <p className="rounded-xl border border-dashed border-border bg-surface py-16 text-center text-sm text-muted-foreground">No submissions yet. Add a Form block to a page to start collecting messages.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <select className={`${inputClass} w-auto`} value={form} onChange={(e) => setForm(e.target.value)} aria-label="Filter by form">
          <option value="all">All forms</option>
          {forms.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
        <Btn
          className="ml-auto"
          onClick={() => {
            const blob = new Blob([toCsv(list)], { type: 'text/csv' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `submissions-${new Date().toISOString().slice(0, 10)}.csv`
            a.click()
            URL.revokeObjectURL(a.href)
          }}
        >
          <Download className="size-4" /> Export CSV
        </Btn>
      </div>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <ul className="flex max-h-[70vh] flex-col overflow-y-auto rounded-xl border border-border bg-surface">
          {list.map((s) => {
            const who = s.data.find((d) => /name/i.test(d.label))?.value ?? s.data.find((d) => d.kind === 'email')?.value ?? 'Submission'
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(s.id)
                    if (!s.is_read) mark(s, true)
                  }}
                  className={cx('flex w-full flex-col gap-0.5 border-b border-border px-4 py-3 text-left text-sm', open === s.id ? 'bg-primary/5' : 'hover:bg-muted', !s.is_read && 'font-semibold')}
                >
                  <span className="flex items-center gap-2">
                    {!s.is_read && <span className="size-2 rounded-full bg-primary" aria-label="Unread" />}
                    <span className="truncate">{who}</span>
                    <span className="ml-auto shrink-0 text-xs font-normal text-muted-foreground">{relativeTime(s.created_at)}</span>
                  </span>
                  <span className="truncate text-xs font-normal text-muted-foreground">{s.form_name}{s.page_id && pageTitles[s.page_id] ? ` · ${pageTitles[s.page_id]}` : ''}</span>
                </button>
              </li>
            )
          })}
        </ul>
        {current && (
          <article className="rounded-xl border border-border bg-surface p-5">
            <header className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">{current.form_name}</h2>
                <p className="text-xs text-muted-foreground">{new Date(current.created_at).toLocaleString()}{current.page_id && pageTitles[current.page_id] ? ` · from “${pageTitles[current.page_id]}”` : ''}</p>
              </div>
              <div className="flex gap-1">
                <IconBtn label={current.is_read ? 'Mark as unread' : 'Mark as read'} onClick={() => mark(current, !current.is_read)}>{current.is_read ? <Mail /> : <MailOpen />}</IconBtn>
                <IconBtn
                  label="Delete"
                  className="hover:text-red-600"
                  onClick={async () => {
                    if (!(await confirm({ title: 'Delete this submission?', confirmLabel: 'Delete', danger: true }))) return
                    const r = await deleteSubmissionAction(current.id)
                    if ('error' in r) toast.error(r.error)
                    else router.refresh()
                  }}
                >
                  <Trash2 />
                </IconBtn>
              </div>
            </header>
            <dl className="grid gap-3">
              {current.data.map((d, i) => (
                <div key={i}>
                  <dt className="text-xs font-semibold text-muted-foreground">{d.label}</dt>
                  <dd className="whitespace-pre-wrap text-sm">
                    {d.fileKey ? (
                      <a className="inline-flex items-center gap-1 text-primary hover:underline" href={`/admin/submissions/file?key=${encodeURIComponent(d.fileKey)}`} target="_blank" rel="noopener noreferrer"><Paperclip className="size-3.5" /> {d.fileName ?? 'Download file'}</a>
                    ) : d.kind === 'email' ? (
                      <a className="text-primary hover:underline" href={`mailto:${d.value}`}>{d.value}</a>
                    ) : (
                      d.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        )}
      </div>
    </div>
  )
}
