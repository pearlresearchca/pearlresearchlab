import { getAllPartners, getAllPlacements } from '@/lib/cms/queries'
import { AdminCard, Field, Select, TextInput } from '@/components/admin/ui'
import { SubmitButton } from '@/components/admin/submit-button'
import { ImageField } from '@/components/admin/image-field'
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
  const [partners, placements] = await Promise.all([getAllPartners(), getAllPlacements()])

  const contexts = Array.from(new Set([...Object.keys(CONTEXT_LABELS), ...placements.map((p) => p.context)]))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Partner logos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Upload logos once, then choose which pages show each one.</p>
      </div>

      <AdminCard title="Logo library">
        <div className="grid grid-cols-3 gap-4">
          {partners.map((partner) => (
            <div key={partner.id} className="flex flex-col gap-2 rounded-md border border-border p-3">
              <ImageField
                label=""
                currentUrl={partner.image_url}
                currentKey={partner.image_key}
                onUpload={updatePartnerImageAction.bind(null, partner.id)}
                aspect="aspect-video"
              />
              <form action={updatePartnerNameAction.bind(null, partner.id)} className="flex gap-2">
                <TextInput name="name" defaultValue={partner.name} className="flex-1 text-xs" />
                <SubmitButton className="!px-2 !py-1 text-xs">Save</SubmitButton>
              </form>
              <form action={deletePartnerAction.bind(null, partner.id, partner.image_key)}>
                <SubmitButton variant="danger" className="!px-2 !py-1 text-xs">Delete logo</SubmitButton>
              </form>
            </div>
          ))}
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-primary">+ Add a new logo</summary>
          <form action={addPartnerAction} className="mt-3 flex items-end gap-3">
            <Field label="Organization name" htmlFor="new-partner-name">
              <TextInput id="new-partner-name" name="name" required />
            </Field>
            <Field label="Logo image" htmlFor="new-partner-image">
              <input id="new-partner-image" name="image" type="file" accept="image/*" required className="text-sm" />
            </Field>
            <SubmitButton>Add logo</SubmitButton>
          </form>
        </details>
      </AdminCard>

      <AdminCard title="Where each logo appears" description="Add a logo to a page, or remove it. Lower sort order shows first.">
        <div className="flex flex-col gap-6">
          {contexts.map((context) => {
            const rows = placements.filter((p) => p.context === context)
            return (
              <div key={context}>
                <h3 className="text-sm font-semibold text-foreground">{CONTEXT_LABELS[context] ?? context}</h3>
                <div className="mt-2 flex flex-wrap gap-3">
                  {rows.map((row) => (
                    <div key={row.id} className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5">
                      <img src={row.partners.image_url} alt={row.partners.name} className="h-6 w-auto object-contain" />
                      <span className="text-xs text-foreground">{row.partners.name}</span>
                      <span className="text-xs text-muted-foreground">#{row.sort_order}</span>
                      <form action={removePlacementAction.bind(null, row.id)}>
                        <button type="submit" className="text-xs text-red-600 hover:underline">remove</button>
                      </form>
                    </div>
                  ))}
                  {rows.length === 0 && <p className="text-xs text-muted-foreground">No logos placed here yet.</p>}
                </div>
              </div>
            )
          })}
        </div>

        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-primary">+ Place a logo on a page</summary>
          <form action={addPlacementAction} className="mt-3 flex items-end gap-3">
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
          </form>
        </details>
      </AdminCard>
    </div>
  )
}
