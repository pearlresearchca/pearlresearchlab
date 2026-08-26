import { getPageContent, lines, text } from '@/lib/cms/queries'
import { AdminCard, Field, TextArea, TextInput } from '@/components/admin/ui'
import { SubmitButton } from '@/components/admin/submit-button'
import { updateContactAction } from './actions'

export default async function ContactAdminPage() {
  const content = await getPageContent('contact')
  const address = lines(content, 'address').join('\n')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Contact page</h1>
        <p className="mt-1 text-sm text-muted-foreground">Contact form submissions go straight to the browser (mailto); this page only controls the copy.</p>
      </div>

      <form action={updateContactAction}>
        <AdminCard title="Hero">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kicker" htmlFor="hero_kicker"><TextInput id="hero_kicker" name="hero_kicker" defaultValue={text(content, 'hero_kicker')} /></Field>
            <div />
            <Field label="Title" htmlFor="hero_title"><TextInput id="hero_title" name="hero_title" defaultValue={text(content, 'hero_title')} /></Field>
            <Field label="Intro" htmlFor="hero_intro"><TextArea id="hero_intro" name="hero_intro" rows={2} defaultValue={text(content, 'hero_intro')} /></Field>
          </div>
        </AdminCard>

        <div className="h-6" />

        <AdminCard title="Ways to work with us">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Eyebrow" htmlFor="collab_eyebrow"><TextInput id="collab_eyebrow" name="collab_eyebrow" defaultValue={text(content, 'collab_eyebrow')} /></Field>
            <Field label="Title" htmlFor="collab_title"><TextInput id="collab_title" name="collab_title" defaultValue={text(content, 'collab_title')} /></Field>
            <Field label="Body" htmlFor="collab_body"><TextArea id="collab_body" name="collab_body" rows={2} defaultValue={text(content, 'collab_body')} className="col-span-2" /></Field>
          </div>
        </AdminCard>

        <div className="h-6" />

        <AdminCard title="Start a conversation">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Title" htmlFor="start_title"><TextInput id="start_title" name="start_title" defaultValue={text(content, 'start_title')} /></Field>
            <Field label="Body" htmlFor="start_body"><TextArea id="start_body" name="start_body" rows={2} defaultValue={text(content, 'start_body')} /></Field>
            <Field label="Address" htmlFor="address" hint="Each line becomes its own line on the page.">
              <TextArea id="address" name="address" rows={3} defaultValue={address} />
            </Field>
            <Field label="Hours" htmlFor="hours"><TextInput id="hours" name="hours" defaultValue={text(content, 'hours')} /></Field>
          </div>
        </AdminCard>

        <div className="mt-6">
          <SubmitButton>Save changes</SubmitButton>
        </div>
      </form>
    </div>
  )
}
