import { Mail } from 'lucide-react'
import { getPageContent, getUserDirectory, latestEdit, lines, text } from '@/lib/cms/queries'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { AdminCard, Field, LastEdited, TextArea, TextInput } from '@/components/admin/ui'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SubmitButton } from '@/components/admin/submit-button'
import { ActionForm } from '@/components/admin/action-form'
import { updateContactAction } from './actions'

export default async function ContactAdminPage() {
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'contact')) return <NoSectionAccess label="the Contact page" />

  const [content, users] = await Promise.all([getPageContent('contact'), getUserDirectory()])
  const address = lines(content, 'address').join('\n')
  const edited = (keys: string[]) => {
    const e = latestEdit(content, keys)
    return <LastEdited at={e?.at} by={e?.by} users={users} />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Mail className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Contact page</h1>
          <p className="text-sm text-muted-foreground">Contact form submissions go straight to the browser (mailto); this page only controls the copy.</p>
        </div>
      </div>

      <ActionForm action={updateContactAction} className="flex flex-col gap-6">
        <AdminCard title="Hero" action={edited(['hero_kicker', 'hero_title', 'hero_intro'])}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Kicker" htmlFor="hero_kicker"><TextInput id="hero_kicker" name="hero_kicker" defaultValue={text(content, 'hero_kicker')} /></Field>
            <div />
            <Field label="Title" htmlFor="hero_title" className="col-span-2"><TextInput id="hero_title" name="hero_title" defaultValue={text(content, 'hero_title')} /></Field>
            <Field label="Intro" htmlFor="hero_intro" className="col-span-2"><TextArea id="hero_intro" name="hero_intro" rows={2} defaultValue={text(content, 'hero_intro')} /></Field>
          </div>
        </AdminCard>

        <AdminCard title="Ways to work with us" action={edited(['collab_eyebrow', 'collab_title', 'collab_body'])}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Eyebrow" htmlFor="collab_eyebrow"><TextInput id="collab_eyebrow" name="collab_eyebrow" defaultValue={text(content, 'collab_eyebrow')} /></Field>
            <Field label="Title" htmlFor="collab_title"><TextInput id="collab_title" name="collab_title" defaultValue={text(content, 'collab_title')} /></Field>
            <Field label="Body" htmlFor="collab_body" className="col-span-2"><TextArea id="collab_body" name="collab_body" rows={2} defaultValue={text(content, 'collab_body')} /></Field>
          </div>
        </AdminCard>

        <AdminCard title="Start a conversation" action={edited(['start_title', 'start_body', 'address', 'hours'])}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Title" htmlFor="start_title"><TextInput id="start_title" name="start_title" defaultValue={text(content, 'start_title')} /></Field>
            <Field label="Body" htmlFor="start_body"><TextArea id="start_body" name="start_body" rows={2} defaultValue={text(content, 'start_body')} /></Field>
            <Field label="Address" htmlFor="address" hint="Each line becomes its own line on the page.">
              <TextArea id="address" name="address" rows={3} defaultValue={address} />
            </Field>
            <Field label="Hours" htmlFor="hours"><TextInput id="hours" name="hours" defaultValue={text(content, 'hours')} /></Field>
          </div>
        </AdminCard>

        <div className="sticky bottom-4 flex justify-end rounded-lg border border-border bg-surface/95 p-3 shadow-lg backdrop-blur">
          <SubmitButton>Save changes</SubmitButton>
        </div>
      </ActionForm>
    </div>
  )
}
