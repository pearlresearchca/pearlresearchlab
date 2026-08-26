import { Handshake, Images, Link2 } from 'lucide-react'
import { getAllPartners, getAllPlacements, getUserDirectory } from '@/lib/cms/queries'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { AdminCard, Field, LastEdited, Select, TextInput } from '@/components/admin/ui'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SubmitButton } from '@/components/admin/submit-button'
import { ImageField } from '@/components/admin/image-field'
import { ActionForm } from '@/components/admin/action-form'
import {
  addPartnerAction,
  addPlacementAction,
  deletePartnerAction,
  removePlacementAction,
  updatePartnerImageAction,
  updatePartnerNameAction,
} from './actions'

const CONTEXT_LABELS: Record<string, string> = {
  home: 'Home page — partners strip',
  about: 'About page — partners grid',
  'project-tfs': 'Surplus to Solutions project',
  'project-ift': 'Interfacility Transfers project',
}

export default async function PartnersAdminPage() {
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'partners')) return <NoSectionAccess label="Partner logos" />

  const [partners, placements, users] = await Promise.all([getAllPartners(), getAllPlacements(), getUserDirectory()])

  const contexts = Array.from(new Set([...Object.keys(CONTEXT_LABELS), ...placements.map((p) => p.context)]))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Handshake className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Partner logos</h1>
          <p className="text-sm text-muted-foreground">Upload logos once, then choose which pages show each one.</p>
        </div>
      </div>

      <AdminCard title="Logo library" icon={<Images className="size-4" aria-hidden="true" />}>
        <div className="grid grid-cols-3 gap-4">
          {partners.map((partner) => (
            <div key={partner.id} className="flex flex-col gap-2 rounded-lg border border-border p-3">
              <ImageField
                label=""
                currentUrl={partner.image_url}
                currentKey={partner.image_key}
                onUpload={updatePartnerImageAction.bind(null, partner.id)}
                aspect="aspect-video"
              />
              <ActionForm action={updatePartnerNameAction.bind(null, partner.id)} className="flex gap-2">
                <TextInput name="name" defaultValue={partner.name} className="flex-1 !py-1.5 text-xs" />
                <SubmitButton className="!px-2 !py-1.5 text-xs">Save</SubmitButton>
              </ActionForm>
              <LastEdited at={partner.updated_at} by={partner.updated_by} users={users} />
              <ActionForm action={deletePartnerAction.bind(null, partner.id, partner.image_key)}>
                <SubmitButton variant="danger" className="w-full !px-2 !py-1.5 text-xs">Delete logo</SubmitButton>
              </ActionForm>
            </div>
          ))}
        </div>

        <details className="mt-4 group">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-primary">+ Add a new logo</summary>
          <ActionForm action={addPartnerAction} successMessage="Logo added" className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-muted/40 p-4">
            <Field label="Organization name" htmlFor="new-partner-name">
              <TextInput id="new-partner-name" name="name" required />
            </Field>
            <Field label="Logo image" htmlFor="new-partner-image">
              <input id="new-partner-image" name="image" type="file" accept="image/*" required className="text-sm" />
            </Field>
            <SubmitButton>Add logo</SubmitButton>
          </ActionForm>
        </details>
      </AdminCard>

      <AdminCard title="Where each logo appears" description="Add a logo to a page, or remove it. Lower sort order shows first." icon={<Link2 className="size-4" aria-hidden="true" />}>
        <div className="flex flex-col gap-6">
          {contexts.map((context) => {
            const rows = placements.filter((p) => p.context === context)
            return (
              <div key={context}>
                <h3 className="text-sm font-semibold text-foreground">{CONTEXT_LABELS[context] ?? context}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {rows.map((row) => (
                    <div key={row.id} className="flex items-center gap-2 rounded-full border border-border bg-background py-1 pl-1 pr-3">
                      <img src={row.partners.image_url} alt={row.partners.name} className="h-6 w-8 rounded-full bg-muted object-contain p-0.5" />
                      <span className="text-xs font-medium text-foreground">{row.partners.name}</span>
                      <span className="text-xs text-muted-foreground">#{row.sort_order}</span>
                      <ActionForm action={removePlacementAction.bind(null, row.id)} successMessage="Removed">
                        <button type="submit" className="text-xs text-red-600 hover:underline">remove</button>
                      </ActionForm>
                    </div>
                  ))}
                  {rows.length === 0 && <p className="text-xs text-muted-foreground">No logos placed here yet.</p>}
                </div>
              </div>
            )
          })}
        </div>

        <details className="mt-6 group">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-primary">+ Place a logo on a page</summary>
          <ActionForm action={addPlacementAction} successMessage="Placed" className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-muted/40 p-4">
            <Field label="Logo" htmlFor="placement-partner">
              <Select id="placement-partner" name="partner_id" required>
                <option value="">Select…</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Page" htmlFor="placement-context">
              <Select id="placement-context" name="context" required>
                <option value="">Select…</option>
                {Object.entries(CONTEXT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Sort order" htmlFor="placement-sort">
              <TextInput id="placement-sort" name="sort_order" type="number" defaultValue={0} className="w-20" />
            </Field>
            <SubmitButton>Add</SubmitButton>
          </ActionForm>
        </details>
      </AdminCard>
    </div>
  )
}
