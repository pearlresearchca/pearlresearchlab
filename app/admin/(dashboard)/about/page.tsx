import Link from 'next/link'
import { Gem, Info, Sparkles, Users } from 'lucide-react'
import { getAboutValues, getPageContent, getUserDirectory, latestEdit, prose, text } from '@/lib/cms/queries'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { AdminCard, Field, LastEdited, TextArea, TextInput } from '@/components/admin/ui'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SubmitButton } from '@/components/admin/submit-button'
import { ActionForm } from '@/components/admin/action-form'
import { addAboutValueAction, deleteAboutValueAction, updateAboutTextAction, updateAboutValueAction } from './actions'

export default async function AboutAdminPage() {
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'about')) return <NoSectionAccess label="the About page" />

  const [content, values, users] = await Promise.all([getPageContent('about'), getAboutValues(), getUserDirectory()])
  const missionBody = prose(content, 'mission_body').join('\n\n')
  const edited = (keys: string[]) => {
    const e = latestEdit(content, keys)
    return <LastEdited at={e?.at} by={e?.by} users={users} />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Info className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">About page</h1>
          <p className="text-sm text-muted-foreground">
            Partner logos on this page are managed on <Link href="/admin/partners" className="font-medium text-primary">Partner logos</Link>.
          </p>
        </div>
      </div>

      <ActionForm action={updateAboutTextAction} className="flex flex-col gap-6">
        <AdminCard title="Hero" icon={<Sparkles className="size-4" aria-hidden="true" />} action={edited(['hero_kicker', 'hero_title', 'hero_intro'])}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Kicker" htmlFor="hero_kicker">
              <TextInput id="hero_kicker" name="hero_kicker" defaultValue={text(content, 'hero_kicker')} />
            </Field>
            <div />
            <Field label="Title" htmlFor="hero_title" className="col-span-2">
              <TextInput id="hero_title" name="hero_title" defaultValue={text(content, 'hero_title')} />
            </Field>
            <Field label="Intro" htmlFor="hero_intro" className="col-span-2">
              <TextArea id="hero_intro" name="hero_intro" rows={2} defaultValue={text(content, 'hero_intro')} />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Mission" action={edited(['mission_eyebrow', 'mission_title', 'mission_body'])}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Eyebrow" htmlFor="mission_eyebrow">
              <TextInput id="mission_eyebrow" name="mission_eyebrow" defaultValue={text(content, 'mission_eyebrow')} />
            </Field>
            <div />
            <Field label="Title" htmlFor="mission_title" className="col-span-2">
              <TextArea id="mission_title" name="mission_title" rows={2} defaultValue={text(content, 'mission_title')} />
            </Field>
            <Field label="Body" htmlFor="mission_body" hint="Separate paragraphs with a blank line." className="col-span-2">
              <TextArea id="mission_body" name="mission_body" rows={6} defaultValue={missionBody} />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Vision" action={edited(['vision_eyebrow', 'vision_title', 'vision_body'])}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Eyebrow" htmlFor="vision_eyebrow">
              <TextInput id="vision_eyebrow" name="vision_eyebrow" defaultValue={text(content, 'vision_eyebrow')} />
            </Field>
            <div />
            <Field label="Title" htmlFor="vision_title" className="col-span-2">
              <TextArea id="vision_title" name="vision_title" rows={2} defaultValue={text(content, 'vision_title')} />
            </Field>
            <Field label="Body" htmlFor="vision_body" className="col-span-2">
              <TextArea id="vision_body" name="vision_body" rows={2} defaultValue={text(content, 'vision_body')} />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Values section heading" action={edited(['values_eyebrow', 'values_title'])}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Eyebrow" htmlFor="values_eyebrow">
              <TextInput id="values_eyebrow" name="values_eyebrow" defaultValue={text(content, 'values_eyebrow')} />
            </Field>
            <Field label="Title" htmlFor="values_title">
              <TextInput id="values_title" name="values_title" defaultValue={text(content, 'values_title')} />
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Partners section heading" icon={<Users className="size-4" aria-hidden="true" />} action={edited(['partners_eyebrow', 'partners_title', 'partners_body'])}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Eyebrow" htmlFor="partners_eyebrow">
              <TextInput id="partners_eyebrow" name="partners_eyebrow" defaultValue={text(content, 'partners_eyebrow')} />
            </Field>
            <div />
            <Field label="Title" htmlFor="partners_title" className="col-span-2">
              <TextInput id="partners_title" name="partners_title" defaultValue={text(content, 'partners_title')} />
            </Field>
            <Field label="Body" htmlFor="partners_body" className="col-span-2">
              <TextArea id="partners_body" name="partners_body" rows={2} defaultValue={text(content, 'partners_body')} />
            </Field>
          </div>
        </AdminCard>

        <div className="sticky bottom-4 flex justify-end rounded-lg border border-border bg-surface/95 p-3 shadow-lg backdrop-blur">
          <SubmitButton>Save changes</SubmitButton>
        </div>
      </ActionForm>

      <AdminCard title="PEARL values (P·E·A·R·L grid)" description="Add, edit, or remove the value cards." icon={<Gem className="size-4" aria-hidden="true" />}>
        <div className="flex flex-col gap-4">
          {values.map((v) => (
            <div key={v.id} className="rounded-lg border border-border p-4">
              <ActionForm action={updateAboutValueAction.bind(null, v.id)} className="flex flex-col gap-3">
                <div className="grid grid-cols-12 gap-3">
                  <Field label="Letter" htmlFor={`letter-${v.id}`} className="col-span-2">
                    <TextInput id={`letter-${v.id}`} name="letter" defaultValue={v.letter} maxLength={4} />
                  </Field>
                  <Field label="Title" htmlFor={`title-${v.id}`} className="col-span-7">
                    <TextInput id={`title-${v.id}`} name="title" defaultValue={v.title} />
                  </Field>
                  <Field label="Order" htmlFor={`order-${v.id}`} className="col-span-3">
                    <TextInput id={`order-${v.id}`} name="sort_order" type="number" defaultValue={v.sort_order} />
                  </Field>
                </div>
                <Field label="Description" htmlFor={`body-${v.id}`}>
                  <TextArea id={`body-${v.id}`} name="body" defaultValue={v.body} rows={2} />
                </Field>
                <div className="flex items-center justify-between">
                  <LastEdited at={v.updated_at} by={v.updated_by} users={users} />
                  <div className="flex gap-2">
                    <SubmitButton className="!px-3 !py-1.5 text-xs">Save</SubmitButton>
                  </div>
                </div>
              </ActionForm>
              <ActionForm action={deleteAboutValueAction.bind(null, v.id)} className="mt-2 flex justify-end">
                <SubmitButton variant="danger" className="!px-3 !py-1.5 text-xs">Delete</SubmitButton>
              </ActionForm>
            </div>
          ))}
        </div>

        <details className="mt-4 group">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-primary">+ Add a value</summary>
          <ActionForm action={addAboutValueAction} className="mt-3 flex flex-col gap-3 rounded-lg bg-muted/40 p-4">
            <div className="grid grid-cols-12 gap-3">
              <Field label="Letter" htmlFor="new-letter" className="col-span-2">
                <TextInput id="new-letter" name="letter" placeholder="P" maxLength={4} required />
              </Field>
              <Field label="Title" htmlFor="new-title" className="col-span-7">
                <TextInput id="new-title" name="title" placeholder="Partnership" required />
              </Field>
              <Field label="Order" htmlFor="new-order" className="col-span-3">
                <TextInput id="new-order" name="sort_order" type="number" defaultValue={values.length} />
              </Field>
            </div>
            <Field label="Description" htmlFor="new-body">
              <TextArea id="new-body" name="body" rows={2} required />
            </Field>
            <div>
              <SubmitButton>Add value</SubmitButton>
            </div>
          </ActionForm>
        </details>
      </AdminCard>
    </div>
  )
}
