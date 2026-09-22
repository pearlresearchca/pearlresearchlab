import { RichTextField } from '@/components/admin/rich-text-field'
import { richHtml } from '@/lib/cms/rich'
import { PageHeader } from '@/components/admin/page-header'
import { CorePageFallback, CorePageNotice, getBuilderPage } from '@/components/admin/core-page-notice'
import { Mail } from 'lucide-react'
import { getPageContent, getUserDirectory, latestEdit, lines, text } from '@/lib/cms/queries'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { AdminCard, Field, LastEdited, TextArea, TextInput } from '@/components/admin/ui'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SubmitButton } from '@/components/admin/submit-button'
import { ActionForm } from '@/components/admin/action-form'
import { updateContactAction } from './actions'

const PARAGRAPH_HINT = 'Leave a blank line between paragraphs.'
const LIST_HINT = 'One item per line.'

export default async function ContactAdminPage() {
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'contact')) return <NoSectionAccess label="the Contact page" />

  const [content, users, builderPage] = await Promise.all([getPageContent('contact'), getUserDirectory(), getBuilderPage('contact')])
  const address = lines(content, 'address').join('\n')
  const edited = (keys: string[]) => {
    const e = latestEdit(content, keys)
    return <LastEdited at={e?.at} by={e?.by} users={users} />
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader group="Core pages" title="Contact page" description="Contact page wording. Messages sent through the form appear in Form submissions." icon={<Mail />} />
      <CorePageNotice legacyKey="contact" label="Contact" page={builderPage} />

      <CorePageFallback live={builderPage?.status === 'published'}>
        <ActionForm action={updateContactAction} className="flex flex-col gap-6">
          <AdminCard title="Hero" action={edited(['hero_kicker', 'hero_title', 'hero_intro'])}>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <Field label="Kicker" htmlFor="hero_kicker"><TextInput id="hero_kicker" name="hero_kicker" defaultValue={text(content, 'hero_kicker')} /></Field>
              <div />
              <Field label="Title" htmlFor="hero_title" className="col-span-2"><TextInput id="hero_title" name="hero_title" defaultValue={text(content, 'hero_title')} /></Field>
              <Field label="Intro" htmlFor="hero_intro" className="col-span-2"><TextArea id="hero_intro" name="hero_intro" rows={2} defaultValue={text(content, 'hero_intro')} /></Field>
            </div>
          </AdminCard>

          <AdminCard title="Community partnerships" action={edited(['partnerships_title', 'partnerships_intro'])}>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <Field label="Title" htmlFor="partnerships_title" className="col-span-2"><TextInput id="partnerships_title" name="partnerships_title" defaultValue={text(content, 'partnerships_title')} /></Field>
              <Field label="Intro" htmlFor="partnerships_intro" className="col-span-2" hint={PARAGRAPH_HINT}>
                <RichTextField id="partnerships_intro" name="partnerships_intro" defaultValue={richHtml(content, 'partnerships_intro')} tall />
              </Field>
            </div>
          </AdminCard>

          <AdminCard title="Areas of interest" action={edited(['interests_title', 'interests_list', 'interests_note'])}>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <Field label="Title" htmlFor="interests_title" className="col-span-2"><TextInput id="interests_title" name="interests_title" defaultValue={text(content, 'interests_title')} /></Field>
              <Field label="Areas" htmlFor="interests_list" className="col-span-2" hint={LIST_HINT}>
                <TextArea id="interests_list" name="interests_list" rows={9} defaultValue={lines(content, 'interests_list').join('\n')} />
              </Field>
              <Field label="Closing note" htmlFor="interests_note" className="col-span-2"><TextArea id="interests_note" name="interests_note" rows={3} defaultValue={text(content, 'interests_note')} /></Field>
            </div>
          </AdminCard>

          <AdminCard title="How we can connect" action={edited(['connect_title', 'connect_lead', 'connect_list', 'connect_note'])}>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <Field label="Title" htmlFor="connect_title"><TextInput id="connect_title" name="connect_title" defaultValue={text(content, 'connect_title')} /></Field>
              <Field label="Lead-in" htmlFor="connect_lead"><TextInput id="connect_lead" name="connect_lead" defaultValue={text(content, 'connect_lead')} /></Field>
              <Field label="Opportunities" htmlFor="connect_list" className="col-span-2" hint={LIST_HINT}>
                <TextArea id="connect_list" name="connect_list" rows={8} defaultValue={lines(content, 'connect_list').join('\n')} />
              </Field>
              <Field label="Closing note" htmlFor="connect_note" className="col-span-2"><TextArea id="connect_note" name="connect_note" rows={3} defaultValue={text(content, 'connect_note')} /></Field>
            </div>
          </AdminCard>

          <AdminCard title="Our approach" action={edited(['approach_title', 'approach_body', 'approach_note'])}>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <Field label="Title" htmlFor="approach_title"><TextInput id="approach_title" name="approach_title" defaultValue={text(content, 'approach_title')} /></Field>
              <Field label="Closing line" htmlFor="approach_note"><TextInput id="approach_note" name="approach_note" defaultValue={text(content, 'approach_note')} /></Field>
              <Field label="Body" htmlFor="approach_body" className="col-span-2" hint={PARAGRAPH_HINT}>
                <RichTextField id="approach_body" name="approach_body" defaultValue={richHtml(content, 'approach_body')} tall />
              </Field>
            </div>
          </AdminCard>

          <AdminCard title="Let's connect" action={edited(['start_title', 'start_body', 'address', 'hours', 'email', 'cta_label'])}>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <Field label="Title" htmlFor="start_title"><TextInput id="start_title" name="start_title" defaultValue={text(content, 'start_title')} /></Field>
              <Field label="Button label" htmlFor="cta_label"><TextInput id="cta_label" name="cta_label" defaultValue={text(content, 'cta_label')} /></Field>
              <Field label="Body" htmlFor="start_body" className="col-span-2" hint={PARAGRAPH_HINT}>
                <RichTextField id="start_body" name="start_body" defaultValue={richHtml(content, 'start_body')} />
              </Field>
              <Field label="Address" htmlFor="address" hint="Each line becomes its own line on the page.">
                <TextArea id="address" name="address" rows={3} defaultValue={address} />
              </Field>
              <div className="flex flex-col gap-4">
                <Field label="Hours" htmlFor="hours"><TextInput id="hours" name="hours" defaultValue={text(content, 'hours')} /></Field>
                <Field label="Email" htmlFor="email" hint="Shown on the page only when filled in.">
                  <TextInput id="email" name="email" type="email" defaultValue={text(content, 'email')} />
                </Field>
              </div>
            </div>
          </AdminCard>

          <AdminCard title="Message form" action={edited(['form_title', 'form_intro', 'sensitive_notice', 'confirmation_title', 'confirmation_body'])}>
            <div className="grid grid-cols-2 gap-x-5 gap-y-4">
              <Field label="Form title" htmlFor="form_title"><TextInput id="form_title" name="form_title" defaultValue={text(content, 'form_title')} /></Field>
              <Field label="Confirmation title" htmlFor="confirmation_title"><TextInput id="confirmation_title" name="confirmation_title" defaultValue={text(content, 'confirmation_title')} /></Field>
              <Field label="Form intro" htmlFor="form_intro"><TextArea id="form_intro" name="form_intro" rows={3} defaultValue={text(content, 'form_intro')} /></Field>
              <Field label="Confirmation message" htmlFor="confirmation_body"><TextArea id="confirmation_body" name="confirmation_body" rows={3} defaultValue={text(content, 'confirmation_body')} /></Field>
              <Field label="Sensitive-information notice" htmlFor="sensitive_notice" className="col-span-2"><TextArea id="sensitive_notice" name="sensitive_notice" rows={2} defaultValue={text(content, 'sensitive_notice')} /></Field>
            </div>
          </AdminCard>

          <div className="sticky bottom-4 z-10 ml-auto flex w-fit items-center gap-4 rounded-xl border border-border bg-surface py-2 pl-4 pr-2 shadow-[0_12px_32px_-12px_rgba(15,23,42,.35)]">
            <span className="hidden text-xs text-muted-foreground sm:inline">Saves every section above</span>
            <SubmitButton>Save changes</SubmitButton>
          </div>
        </ActionForm>
      </CorePageFallback>
    </div>
  )
}
