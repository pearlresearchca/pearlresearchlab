import { PageHeader } from '@/components/admin/page-header'
import { CorePageNotice } from '@/components/admin/core-page-notice'
import { FlaskConical } from 'lucide-react'
import { getPageContent, getResearchAreas, getUserDirectory, text } from '@/lib/cms/queries'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { AdminCard, Field, LastEdited, TextArea, TextInput } from '@/components/admin/ui'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SubmitButton } from '@/components/admin/submit-button'
import { ImageField } from '@/components/admin/image-field'
import { ActionForm } from '@/components/admin/action-form'
import { updateResearchAreaAction, updateResearchAreaImageAction, updateResearchHeroAction } from './actions'

export default async function ResearchAdminPage() {
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'research')) return <NoSectionAccess label="Research areas" />

  const [content, areas, users] = await Promise.all([getPageContent('research'), getResearchAreas(), getUserDirectory()])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader group="Core pages" title="Research page" description="The Research page hero and the research areas. The areas also power the “Five connected streams” cards on Home." icon={<FlaskConical />} />
      <CorePageNotice legacyKey="research" label="Research" />

      <ActionForm action={updateResearchHeroAction}>
        <AdminCard title="Research page hero">
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
          <div className="mt-4">
            <SubmitButton>Save</SubmitButton>
          </div>
        </AdminCard>
      </ActionForm>

      <div className="flex flex-col gap-4">
        {areas.map((area, i) => (
          <AdminCard key={area.id} title={`${i + 1}. ${area.title}`} action={<LastEdited at={area.updated_at} by={area.updated_by} users={users} />}>
            <div className="flex flex-col gap-6 sm:flex-row">
              <ImageField
                label="Image"
                currentUrl={area.image_url}
                currentKey={area.image_key}
                onUpload={updateResearchAreaImageAction.bind(null, area.id)}
                aspect="aspect-[4/3]"
              />
              <ActionForm action={updateResearchAreaAction.bind(null, area.id)} className="flex flex-1 flex-col gap-4">
                <Field label="Title" htmlFor={`title-${area.id}`}>
                  <TextInput id={`title-${area.id}`} name="title" defaultValue={area.title} />
                </Field>
                <Field label="Full summary (Research page)" htmlFor={`summary-${area.id}`}>
                  <TextArea id={`summary-${area.id}`} name="summary" rows={2} defaultValue={area.summary} />
                </Field>
                <Field label="Short summary (Home page card)" htmlFor={`home_summary-${area.id}`} hint="Leave blank to reuse the full summary.">
                  <TextArea id={`home_summary-${area.id}`} name="home_summary" rows={2} defaultValue={area.home_summary ?? ''} />
                </Field>
                <div className="flex flex-wrap items-start gap-4">
                  <Field label="Icon name (lucide-react)" htmlFor={`icon-${area.id}`} hint="e.g. HeartPulse, Scale, Leaf, Network, Landmark" className="min-w-48">
                    <TextInput id={`icon-${area.id}`} name="icon_name" defaultValue={area.icon_name ?? ''} />
                  </Field>
                  <Field label="Sort order" htmlFor={`sort-${area.id}`}>
                    <TextInput id={`sort-${area.id}`} name="sort_order" type="number" defaultValue={area.sort_order} className="w-24" />
                  </Field>
                  <label className="mt-[26px] flex h-[42px] items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" name="show_on_home" defaultChecked={area.show_on_home} className="switch" />
                    Show on Home
                  </label>
                </div>
                <div>
                  <SubmitButton>Save</SubmitButton>
                </div>
              </ActionForm>
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  )
}
