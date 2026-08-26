import Link from 'next/link'
import { getAboutValues, getPageContent, prose, text } from '@/lib/cms/queries'
import { AdminCard, Field, TextArea, TextInput } from '@/components/admin/ui'
import { SubmitButton } from '@/components/admin/submit-button'
import { addAboutValueAction, deleteAboutValueAction, updateAboutTextAction, updateAboutValueAction } from './actions'

export default async function AboutAdminPage() {
  const [content, values] = await Promise.all([getPageContent('about'), getAboutValues()])
  const missionBody = prose(content, 'mission_body').join('\n\n')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">About page</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Partner logos shown on this page are managed on{' '}
          <Link href="/admin/partners" className="font-medium text-primary">Partner logos</Link>.
        </p>
      </div>

      <form action={updateAboutTextAction}>
        <AdminCard title="Hero">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kicker" htmlFor="hero_kicker">
              <TextInput id="hero_kicker" name="hero_kicker" defaultValue={text(content, 'hero_kicker')} />
            </Field>
            <div />
            <Field label="Title" htmlFor="hero_title">
              <TextInput id="hero_title" name="hero_title" defaultValue={text(content, 'hero_title')} />
            </Field>
            <Field label="Intro" htmlFor="hero_intro">
              <TextArea id="hero_intro" name="hero_intro" rows={2} defaultValue={text(content, 'hero_intro')} />
            </Field>
          </div>
        </AdminCard>

        <div className="h-6" />

        <AdminCard title="Mission">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Eyebrow" htmlFor="mission_eyebrow">
              <TextInput id="mission_eyebrow" name="mission_eyebrow" defaultValue={text(content, 'mission_eyebrow')} />
            </Field>
            <div />
            <Field label="Title" htmlFor="mission_title">
              <TextArea id="mission_title" name="mission_title" rows={2} defaultValue={text(content, 'mission_title')} className="col-span-2" />
            </Field>
            <Field label="Body" htmlFor="mission_body" hint="Separate paragraphs with a blank line." >
              <TextArea id="mission_body" name="mission_body" rows={5} defaultValue={missionBody} className="col-span-2" />
            </Field>
          </div>
        </AdminCard>

        <div className="h-6" />

        <AdminCard title="Vision">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Eyebrow" htmlFor="vision_eyebrow">
              <TextInput id="vision_eyebrow" name="vision_eyebrow" defaultValue={text(content, 'vision_eyebrow')} />
            </Field>
            <div />
            <Field label="Title" htmlFor="vision_title">
              <TextArea id="vision_title" name="vision_title" rows={2} defaultValue={text(content, 'vision_title')} className="col-span-2" />
            </Field>
            <Field label="Body" htmlFor="vision_body">
              <TextArea id="vision_body" name="vision_body" rows={2} defaultValue={text(content, 'vision_body')} className="col-span-2" />
            </Field>
          </div>
        </AdminCard>

        <div className="h-6" />

        <AdminCard title="Values section heading">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Eyebrow" htmlFor="values_eyebrow">
              <TextInput id="values_eyebrow" name="values_eyebrow" defaultValue={text(content, 'values_eyebrow')} />
            </Field>
            <Field label="Title" htmlFor="values_title">
              <TextInput id="values_title" name="values_title" defaultValue={text(content, 'values_title')} />
            </Field>
          </div>
        </AdminCard>

        <div className="h-6" />

        <AdminCard title="Partners section heading">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Eyebrow" htmlFor="partners_eyebrow">
              <TextInput id="partners_eyebrow" name="partners_eyebrow" defaultValue={text(content, 'partners_eyebrow')} />
            </Field>
            <div />
            <Field label="Title" htmlFor="partners_title">
              <TextInput id="partners_title" name="partners_title" defaultValue={text(content, 'partners_title')} />
            </Field>
            <Field label="Body" htmlFor="partners_body">
              <TextArea id="partners_body" name="partners_body" rows={2} defaultValue={text(content, 'partners_body')} className="col-span-2" />
            </Field>
          </div>
        </AdminCard>

        <div className="mt-6">
          <SubmitButton>Save changes</SubmitButton>
        </div>
      </form>

      <AdminCard title="PEARL values (P·E·A·R·L grid)" description="Add, edit, or remove the value cards.">
        <div className="flex flex-col gap-4">
          {values.map((v) => (
            <div key={v.id} className="flex items-start gap-2 rounded-md border border-border p-3">
              <form action={updateAboutValueAction.bind(null, v.id)} className="grid flex-1 grid-cols-12 gap-2">
                <TextInput name="letter" defaultValue={v.letter} className="col-span-1" maxLength={4} />
                <TextInput name="title" defaultValue={v.title} className="col-span-3" />
                <TextArea name="body" defaultValue={v.body} rows={1} className="col-span-5" />
                <TextInput name="sort_order" type="number" defaultValue={v.sort_order} className="col-span-1" />
                <div className="col-span-2">
                  <SubmitButton className="!px-2 !py-1 text-xs">Save</SubmitButton>
                </div>
              </form>
              <form action={deleteAboutValueAction.bind(null, v.id)}>
                <SubmitButton variant="danger" className="!px-2 !py-1 text-xs">Delete</SubmitButton>
              </form>
            </div>
          ))}
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-primary">+ Add a value</summary>
          <form action={addAboutValueAction} className="mt-3 grid grid-cols-12 gap-2">
            <TextInput name="letter" placeholder="Letter" className="col-span-1" maxLength={4} required />
            <TextInput name="title" placeholder="Title" className="col-span-3" required />
            <TextArea name="body" placeholder="Description" rows={1} className="col-span-5" required />
            <TextInput name="sort_order" type="number" defaultValue={values.length} className="col-span-1" />
            <div className="col-span-2">
              <SubmitButton className="!px-2 !py-1 text-xs">Add</SubmitButton>
            </div>
          </form>
        </details>
      </AdminCard>
    </div>
  )
}
