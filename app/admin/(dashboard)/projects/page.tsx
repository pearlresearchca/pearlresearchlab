import Link from 'next/link'
import { ChevronRight, FolderKanban } from 'lucide-react'
import { getPageContent, getProjects, getUserDirectory, latestEdit, text } from '@/lib/cms/queries'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { AdminCard, Field, LastEdited, TextInput } from '@/components/admin/ui'
import { NoSectionAccess } from '@/components/admin/no-access'
import { SubmitButton } from '@/components/admin/submit-button'
import { ActionForm } from '@/components/admin/action-form'
import { createProjectAction, updateProjectsHeroAction } from './actions'

export default async function ProjectsAdminPage() {
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'projects')) return <NoSectionAccess label="Projects" />

  const [content, projects, users] = await Promise.all([getPageContent('projects'), getProjects(false), getUserDirectory()])
  const heroEdit = latestEdit(content, ['hero_kicker', 'hero_title', 'hero_intro'])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <FolderKanban className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground">Click a project to edit its full page and sections.</p>
        </div>
      </div>

      <ActionForm action={updateProjectsHeroAction}>
        <AdminCard title="Projects page hero" action={<LastEdited at={heroEdit?.at} by={heroEdit?.by} users={users} />}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <Field label="Kicker" htmlFor="hero_kicker"><TextInput id="hero_kicker" name="hero_kicker" defaultValue={text(content, 'hero_kicker')} /></Field>
            <div />
            <Field label="Title" htmlFor="hero_title"><TextInput id="hero_title" name="hero_title" defaultValue={text(content, 'hero_title')} /></Field>
            <Field label="Intro" htmlFor="hero_intro"><TextInput id="hero_intro" name="hero_intro" defaultValue={text(content, 'hero_intro')} /></Field>
          </div>
          <div className="mt-4"><SubmitButton>Save</SubmitButton></div>
        </AdminCard>
      </ActionForm>

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
