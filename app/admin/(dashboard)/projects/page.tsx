import { PageHeader } from '@/components/admin/page-header'
import Link from 'next/link'
import { ChevronRight, FolderKanban } from 'lucide-react'
import { getProjects, getUserDirectory } from '@/lib/cms/queries'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { AdminCard, Field, LastEdited, TextInput } from '@/components/admin/ui'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SubmitButton } from '@/components/admin/submit-button'
import { ActionForm } from '@/components/admin/action-form'
import { createProjectAction } from './actions'

export default async function ProjectsAdminPage() {
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'projects')) return <NoSectionAccess label="Projects" />

  const [projects, users] = await Promise.all([getProjects(false), getUserDirectory()])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader group="Content" title="Projects" description="The projects shown by the Projects block. Click a project to edit its sections." icon={<FolderKanban />} />
      <AdminCard title="All projects">
        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/admin/projects/${p.slug}`} className="flex items-center justify-between rounded-lg border border-border p-4 transition hover:border-primary hover:shadow-sm">
              <div>
                <p className="font-medium text-foreground">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.subtitle}</p>
                <LastEdited at={p.updated_at} by={p.updated_by} users={users} />
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.published ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                  {p.published ? 'Published' : 'Hidden'}
                </span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>

        <details className="mt-4 group">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-primary">+ Add a new project</summary>
          <ActionForm action={createProjectAction} successMessage="Project created" className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-muted/40 p-4">
            <Field label="Title" htmlFor="new-project-title">
              <TextInput id="new-project-title" name="title" required />
            </Field>
            <Field label="URL slug" htmlFor="new-project-slug" hint="e.g. my-new-project">
              <TextInput id="new-project-slug" name="slug" required />
            </Field>
            <Field label="Sort order" htmlFor="new-project-sort">
              <TextInput id="new-project-sort" name="sort_order" type="number" defaultValue={projects.length} className="w-24" />
            </Field>
            <SubmitButton>Create</SubmitButton>
          </ActionForm>
        </details>
      </AdminCard>
    </div>
  )
}
