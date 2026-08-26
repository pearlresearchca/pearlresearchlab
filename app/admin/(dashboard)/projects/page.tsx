import Link from 'next/link'
import { getPageContent, getProjects, text } from '@/lib/cms/queries'
import { AdminCard, Field, TextInput } from '@/components/admin/ui'
import { SubmitButton } from '@/components/admin/submit-button'
import { createProjectAction, updateProjectsHeroAction } from './actions'

export default async function ProjectsAdminPage() {
  const [content, projects] = await Promise.all([getPageContent('projects'), getProjects(false)])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">Click a project below to edit its full page.</p>
      </div>

      <form action={updateProjectsHeroAction}>
        <AdminCard title="Projects page hero">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kicker" htmlFor="hero_kicker"><TextInput id="hero_kicker" name="hero_kicker" defaultValue={text(content, 'hero_kicker')} /></Field>
            <div />
            <Field label="Title" htmlFor="hero_title"><TextInput id="hero_title" name="hero_title" defaultValue={text(content, 'hero_title')} /></Field>
            <Field label="Intro" htmlFor="hero_intro"><TextInput id="hero_intro" name="hero_intro" defaultValue={text(content, 'hero_intro')} /></Field>
          </div>
          <div className="mt-4"><SubmitButton>Save</SubmitButton></div>
        </AdminCard>
      </form>

      <AdminCard title="All projects">
        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/admin/projects/${p.slug}`} className="flex items-center justify-between rounded-md border border-border p-3 hover:border-primary">
              <div>
                <p className="font-medium text-foreground">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.subtitle}</p>
              </div>
              <span className={`text-xs font-medium ${p.published ? 'text-green-700' : 'text-muted-foreground'}`}>
                {p.published ? 'Published' : 'Hidden'}
              </span>
            </Link>
          ))}
        </div>

        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-primary">+ Add a new project</summary>
          <form action={createProjectAction} className="mt-3 flex items-end gap-3">
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
          </form>
        </details>
      </AdminCard>
    </div>
  )
}
