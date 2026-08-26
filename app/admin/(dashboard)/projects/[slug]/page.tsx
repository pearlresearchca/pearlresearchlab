import { notFound } from 'next/navigation'
import { getProjectBySlug, getProjectSections } from '@/lib/cms/queries'
import { AdminCard, Field, TextArea, TextInput } from '@/components/admin/ui'
import { SubmitButton } from '@/components/admin/submit-button'
import { ImageField } from '@/components/admin/image-field'
import {
  addProjectSectionAction,
  deleteProjectAction,
  deleteProjectSectionAction,
  updateProjectAction,
  updateProjectBannerAction,
  updateProjectSectionAction,
  updateProjectSectionImageAction,
} from '../actions'

export default async function ProjectEditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  const sections = await getProjectSections(project.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{project.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">/projects/{project.slug}</p>
        </div>
        <form action={deleteProjectAction.bind(null, project.id)}>
          <SubmitButton variant="danger" pendingText="Deleting…">Delete project</SubmitButton>
        </form>
      </div>

      <AdminCard title="Banner image">
        <ImageField
          label=""
          currentUrl={project.banner_image_url}
          currentKey={project.banner_image_key}
          onUpload={updateProjectBannerAction.bind(null, project.id, project.slug)}
          aspect="aspect-[21/9]"
        />
      </AdminCard>

      <form action={updateProjectAction.bind(null, project.id, project.slug)}>
        <AdminCard title="Project details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Index label" htmlFor="index_label" hint="e.g. 01">
              <TextInput id="index_label" name="index_label" defaultValue={project.index_label ?? ''} />
            </Field>
            <Field label="Category label" htmlFor="category_label" hint="e.g. Active research / Food systems">
              <TextInput id="category_label" name="category_label" defaultValue={project.category_label ?? ''} />
            </Field>
            <Field label="Title" htmlFor="title">
              <TextInput id="title" name="title" defaultValue={project.title} required />
            </Field>
            <Field label="Project name" htmlFor="project_name" hint="Optional short project name shown under the title">
              <TextInput id="project_name" name="project_name" defaultValue={project.project_name ?? ''} />
            </Field>
            <Field label="Subtitle" htmlFor="subtitle">
              <TextArea id="subtitle" name="subtitle" rows={2} defaultValue={project.subtitle ?? ''} className="col-span-2" />
            </Field>
            <Field label="Meta tags" htmlFor="meta_line" hint="Comma separated, e.g. Rural Nova Scotia, Community-based research">
              <TextInput id="meta_line" name="meta_line" defaultValue={project.meta_line.join(', ')} className="col-span-2" />
            </Field>
            <Field label="Introduction" htmlFor="intro_paragraphs" hint="Separate paragraphs with a blank line.">
              <TextArea id="intro_paragraphs" name="intro_paragraphs" rows={8} defaultValue={project.intro_paragraphs.join('\n\n')} className="col-span-2" />
            </Field>
            <Field label="Partner logos context" htmlFor="partners_context" hint="Matches a context on the Partner logos page, e.g. project-tfs">
              <TextInput id="partners_context" name="partners_context" defaultValue={project.partners_context ?? ''} />
            </Field>
            <Field label="Sort order" htmlFor="sort_order">
              <TextInput id="sort_order" name="sort_order" type="number" defaultValue={project.sort_order} className="w-24" />
            </Field>
            <label className="col-span-2 flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" name="published" defaultChecked={project.published} />
              Published (visible on the live site)
            </label>
          </div>
          <div className="mt-4"><SubmitButton>Save project details</SubmitButton></div>
        </AdminCard>
      </form>

      <AdminCard title="Sections" description="The body sections that make up the project page, in order.">
        <div className="flex flex-col gap-4">
          {sections.map((section) => (
            <div key={section.id} className="flex gap-6 rounded-md border border-border p-4">
              <ImageField
                label="Image"
                currentUrl={section.image_url}
                currentKey={section.image_key}
                onUpload={updateProjectSectionImageAction.bind(null, section.id, project.slug)}
                aspect="aspect-[4/3]"
              />
              <form action={updateProjectSectionAction.bind(null, section.id, project.slug)} className="flex flex-1 flex-col gap-3">
                <Field label="Heading" htmlFor={`heading-${section.id}`}>
                  <TextInput id={`heading-${section.id}`} name="heading" defaultValue={section.heading} />
                </Field>
                <Field label="Body" htmlFor={`body-${section.id}`} hint="Separate paragraphs with a blank line.">
                  <TextArea id={`body-${section.id}`} name="body_paragraphs" rows={6} defaultValue={section.body_paragraphs.join('\n\n')} />
                </Field>
                <div className="flex items-end gap-4">
                  <Field label="Partner logos context" htmlFor={`ctx-${section.id}`} hint="Optional">
                    <TextInput id={`ctx-${section.id}`} name="partners_context" defaultValue={section.partners_context ?? ''} />
                  </Field>
                  <Field label="Sort order" htmlFor={`sort-${section.id}`}>
                    <TextInput id={`sort-${section.id}`} name="sort_order" type="number" defaultValue={section.sort_order} className="w-24" />
                  </Field>
                </div>
                <div><SubmitButton>Save section</SubmitButton></div>
              </form>
              <form action={deleteProjectSectionAction.bind(null, section.id, project.slug)}>
                <SubmitButton variant="danger" className="!px-2 !py-1 text-xs">Delete</SubmitButton>
              </form>
            </div>
          ))}
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-primary">+ Add a section</summary>
          <form action={addProjectSectionAction.bind(null, project.id, project.slug)} className="mt-3 flex flex-col gap-3">
            <Field label="Heading" htmlFor="new-heading">
              <TextInput id="new-heading" name="heading" required />
            </Field>
            <Field label="Body" htmlFor="new-body" hint="Separate paragraphs with a blank line. You can add an image after saving.">
              <TextArea id="new-body" name="body_paragraphs" rows={5} />
            </Field>
            <Field label="Sort order" htmlFor="new-sort">
              <TextInput id="new-sort" name="sort_order" type="number" defaultValue={sections.length} className="w-24" />
            </Field>
            <div><SubmitButton>Add section</SubmitButton></div>
          </form>
        </details>
      </AdminCard>
    </div>
  )
}
