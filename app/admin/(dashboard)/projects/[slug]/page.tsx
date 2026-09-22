import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Layers } from 'lucide-react'
import { getProjectBySlug, getProjectSections, getUserDirectory } from '@/lib/cms/queries'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { AdminCard, Field, LastEdited, TextArea, TextInput } from '@/components/admin/ui'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SubmitButton } from '@/components/admin/submit-button'
import { ImageField } from '@/components/admin/image-field'
import { ActionForm } from '@/components/admin/action-form'
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
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'projects')) return <NoSectionAccess label="Projects" />

  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  const [sections, users] = await Promise.all([getProjectSections(project.id), getUserDirectory()])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/admin/projects" className="hover:text-primary">Projects</Link>
            <ChevronRight className="size-3" aria-hidden="true" />
            <span>{project.title}</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">{project.title}</h1>
          <LastEdited at={project.updated_at} by={project.updated_by} users={users} />
        </div>
        <ActionForm action={deleteProjectAction.bind(null, project.id)}>
          <SubmitButton variant="danger" pendingText="Deleting…">Delete project</SubmitButton>
        </ActionForm>
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

      <ActionForm action={updateProjectAction.bind(null, project.id, project.slug)}>
        <AdminCard title="Project details">
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
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
            <Field label="Subtitle" htmlFor="subtitle" className="col-span-2">
              <TextArea id="subtitle" name="subtitle" rows={2} defaultValue={project.subtitle ?? ''} />
            </Field>
            <Field label="Meta tags" htmlFor="meta_line" hint="Comma separated, e.g. Rural Nova Scotia, Community-based research" className="col-span-2">
              <TextInput id="meta_line" name="meta_line" defaultValue={project.meta_line.join(', ')} />
            </Field>
            <Field label="Introduction" htmlFor="intro_paragraphs" hint="Separate paragraphs with a blank line." className="col-span-2">
              <TextArea id="intro_paragraphs" name="intro_paragraphs" rows={8} defaultValue={project.intro_paragraphs.join('\n\n')} />
            </Field>
            <Field label="Partner logos context" htmlFor="partners_context" hint="Matches a context on the Partner logos page, e.g. project-tfs">
              <TextInput id="partners_context" name="partners_context" defaultValue={project.partners_context ?? ''} />
            </Field>
            <Field label="Sort order" htmlFor="sort_order">
              <TextInput id="sort_order" name="sort_order" type="number" defaultValue={project.sort_order} className="w-24" />
            </Field>
            <label className="col-span-2 flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" name="published" defaultChecked={project.published} className="switch" />
              Published (visible on the live site)
            </label>
          </div>
          <div className="mt-4"><SubmitButton>Save project details</SubmitButton></div>
        </AdminCard>
      </ActionForm>

      <AdminCard title="Sections" description="The body sections that make up the project page, in order." icon={<Layers className="size-4" aria-hidden="true" />}>
        <div className="flex flex-col gap-4">
          {sections.map((section, i) => (
            <div key={section.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-col gap-6 sm:flex-row">
                <ImageField
                  label={`Section ${i + 1} image`}
                  currentUrl={section.image_url}
                  currentKey={section.image_key}
                  onUpload={updateProjectSectionImageAction.bind(null, section.id, project.slug)}
                  aspect="aspect-[4/3]"
                />
                <ActionForm action={updateProjectSectionAction.bind(null, section.id, project.slug)} className="flex flex-1 flex-col gap-4">
                  <Field label="Heading" htmlFor={`heading-${section.id}`}>
                    <TextInput id={`heading-${section.id}`} name="heading" defaultValue={section.heading} />
                  </Field>
                  <Field label="Body" htmlFor={`body-${section.id}`} hint="Separate paragraphs with a blank line.">
                    <TextArea id={`body-${section.id}`} name="body_paragraphs" rows={6} defaultValue={section.body_paragraphs.join('\n\n')} />
                  </Field>
                  <div className="flex flex-wrap items-end gap-4">
                    <Field label="Partner logos context" htmlFor={`ctx-${section.id}`} hint="Optional" className="min-w-40">
                      <TextInput id={`ctx-${section.id}`} name="partners_context" defaultValue={section.partners_context ?? ''} />
                    </Field>
                    <Field label="Sort order" htmlFor={`sort-${section.id}`}>
                      <TextInput id={`sort-${section.id}`} name="sort_order" type="number" defaultValue={section.sort_order} className="w-24" />
                    </Field>
                  </div>
                  <div className="flex items-center justify-between">
                    <LastEdited at={section.updated_at} by={section.updated_by} users={users} />
                    <SubmitButton>Save section</SubmitButton>
                  </div>
                </ActionForm>
              </div>
              <ActionForm action={deleteProjectSectionAction.bind(null, section.id, project.slug)} className="mt-2 flex justify-end">
                <SubmitButton variant="danger" className="!px-3 !py-1.5 text-xs">Delete section</SubmitButton>
              </ActionForm>
            </div>
          ))}
        </div>

        <details className="mt-4 group">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-primary">+ Add a section</summary>
          <ActionForm action={addProjectSectionAction.bind(null, project.id, project.slug)} successMessage="Section added" className="mt-3 flex flex-col gap-3 rounded-lg bg-muted/40 p-4">
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
          </ActionForm>
        </details>
      </AdminCard>
    </div>
  )
}
