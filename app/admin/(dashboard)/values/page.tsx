import { Gem } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { getAboutValues, getUserDirectory } from '@/lib/cms/queries'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { AdminCard, Field, LastEdited, TextArea, TextInput } from '@/components/admin/ui'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SubmitButton } from '@/components/admin/submit-button'
import { ActionForm } from '@/components/admin/action-form'
import { addAboutValueAction, deleteAboutValueAction, updateAboutValueAction } from './actions'

export default async function ValuesAdminPage() {
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'about')) return <NoSectionAccess label="PEARL values" />

  const [values, users] = await Promise.all([getAboutValues(), getUserDirectory()])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader group="Content" title="PEARL values" description="The P·E·A·R·L value cards. Add the Values block to any page in the page builder to show them." icon={<Gem />} />

      <AdminCard title="Value cards" icon={<Gem className="size-4" aria-hidden="true" />}>
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
