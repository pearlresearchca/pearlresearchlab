import { Briefcase, CalendarDays, Mail, Phone } from 'lucide-react'
import { AccessSummary, RoleBadge } from '@/components/admin/ui'
import { SubmitButton } from '@/components/admin/submit-button'
import { ActionForm } from '@/components/admin/action-form'
import { AccessEditor } from '@/components/admin/access-editor'
import { Initials } from '@/components/admin/sidebar'
import { removeUserAccessAction, updateUserAccessAction } from './actions'
import type { AppUser } from '@/lib/cms/types'

const card = 'rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,.04)]'

export function UserDetail({ user, isSelf }: { user: AppUser; isSelf: boolean }) {
  const name = user.full_name || user.email
  const facts = [
    { icon: Mail, value: user.email },
    user.phone && { icon: Phone, value: user.phone },
    user.job_title && { icon: Briefcase, value: user.job_title },
    { icon: CalendarDays, value: `Joined ${new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}` },
  ].filter(Boolean) as { icon: typeof Mail; value: string }[]

  return (
    <div className="flex flex-col gap-6">
      <section className={card}>
        <header className="flex flex-wrap items-start gap-4 border-b border-border px-6 py-5">
          <Initials name={name} className="size-12 text-base" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-foreground">{name}</h2>
              <RoleBadge role={user.role} />
              {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
            </div>
            <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {facts.map((f) => (
                <li key={f.value} className="flex min-w-0 items-center gap-1.5">
                  <f.icon className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="break-all">{f.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </header>

        {isSelf ? (
          <div className="flex flex-col gap-3 p-6">
            <AccessSummary role={user.role} sections={user.sections} />
            <p className="text-xs text-muted-foreground">You can’t change your own access. Ask another admin if something needs to change.</p>
          </div>
        ) : (
          <ActionForm action={updateUserAccessAction.bind(null, user.id)} successMessage="Access updated">
            <div className="p-6">
              <AccessEditor idPrefix={user.id} defaultRole={user.role} defaultSections={user.sections} />
            </div>
            <div className="flex items-center justify-end gap-3 rounded-b-2xl border-t border-border bg-background/60 px-6 py-4">
              <SubmitButton pendingText="Saving…">Save access</SubmitButton>
            </div>
          </ActionForm>
        )}
      </section>

      {!isSelf && (
        <section className={`${card} flex flex-wrap items-center justify-between gap-4 border-red-200/70 px-6 py-4`}>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Remove access</h3>
            <p className="text-xs text-muted-foreground">{name} will no longer be able to open the admin. Their past changes stay in the activity log.</p>
          </div>
          <ActionForm action={removeUserAccessAction.bind(null, user.id)} successMessage="Access removed">
            <SubmitButton variant="ghost" className="border-red-200 text-red-600 hover:bg-red-50" pendingText="Removing…">Remove access</SubmitButton>
          </ActionForm>
        </section>
      )}
    </div>
  )
}
