import { getPageContent, getResearchAreas, text } from '@/lib/cms/queries'
import { AdminCard, Field, TextArea, TextInput } from '@/components/admin/ui'
import { SubmitButton } from '@/components/admin/submit-button'
import { ImageField } from '@/components/admin/image-field'
import { updateResearchAreaAction, updateResearchAreaImageAction, updateResearchHeroAction } from './actions'

export default async function ResearchAdminPage() {
  const [content, areas] = await Promise.all([getPageContent('research'), getResearchAreas()])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Research areas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          These five areas power both the Research page and the &ldquo;Five connected streams&rdquo; cards on Home. Only the first four (with &ldquo;show on home&rdquo; checked) appear on Home.
        </p>
      </div>

      <form action={updateResearchHeroAction}>
        <AdminCard title="Research page hero">
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
          <div className="mt-4">
            <SubmitButton>Save</SubmitButton>
          </div>
        </AdminCard>
      </form>

      <div className="flex flex-col gap-4">
        {areas.map((area, i) => (
          <AdminCard key={area.id} title={`${i + 1}. ${area.title}`}>
            <div className="flex gap-6">
              <ImageField
                label="Image"
                currentUrl={area.image_url}
                currentKey={area.image_key}
                onUpload={updateResearchAreaImageAction.bind(null, area.id)}
                aspect="aspect-[4/3]"
              />
              <form action={updateResearchAreaAction.bind(null, area.id)} className="flex flex-1 flex-col gap-3">
                <Field label="Title" htmlFor={`title-${area.id}`}>
                  <TextInput id={`title-${area.id}`} name="title" defaultValue={area.title} />
                </Field>
                <Field label="Full summary (Research page)" htmlFor={`summary-${area.id}`}>
                  <TextArea id={`summary-${area.id}`} name="summary" rows={2} defaultValue={area.summary} />
                </Field>
                <Field label="Short summary (Home page card)" htmlFor={`home_summary-${area.id}`} hint="Leave blank to reuse the full summary.">
                  <TextArea id={`home_summary-${area.id}`} name="home_summary" rows={2} defaultValue={area.home_summary ?? ''} />
                </Field>
                <div className="flex items-end gap-4">
                  <Field label="Icon name (lucide-react)" htmlFor={`icon-${area.id}`} hint="e.g. HeartPulse, Scale, Leaf, Network">
                    <TextInput id={`icon-${area.id}`} name="icon_name" defaultValue={area.icon_name ?? ''} />
                  </Field>
                  <Field label="Sort order" htmlFor={`sort-${area.id}`}>
                    <TextInput id={`sort-${area.id}`} name="sort_order" type="number" defaultValue={area.sort_order} className="w-24" />
                  </Field>
                  <label className="flex items-center gap-2 pb-2 text-sm text-foreground">
                    <input type="checkbox" name="show_on_home" defaultChecked={area.show_on_home} />
                    Show on Home
                  </label>
                </div>
                <div>
                  <SubmitButton>Save</SubmitButton>
                </div>
              </form>
            </div>
          </AdminCard>
        ))}
      </div>
    </div>
  )
}
