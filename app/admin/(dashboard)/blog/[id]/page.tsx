import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, ExternalLink, Eye } from 'lucide-react'
import { NoSectionAccess } from '@/components/admin/no-access'
import { ActionForm } from '@/components/admin/action-form'
import { SubmitButton } from '@/components/admin/submit-button'
import { ImageField } from '@/components/admin/image-field'
import { RichTextField } from '@/components/admin/rich-text-field'
import { AdminCard, Field, LastEdited, TextArea, TextInput } from '@/components/admin/ui'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { getUserDirectory } from '@/lib/cms/queries'
import { getDailyMetrics, getPostById } from '@/lib/cms/posts-jobs'
import { fmt, totalsByItem } from '@/lib/cms/metrics'
import { deletePostAction, setPostStatusAction, updatePostAction, updatePostCoverAction } from '../actions'

export const metadata = { title: 'Edit post' }

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'pages')) return <NoSectionAccess label="Blog posts" />
  const { id } = await params
  const post = await getPostById(id)
  if (!post) notFound()

  const [users, metrics] = await Promise.all([getUserDirectory(), getDailyMetrics('post', 90)])
  const views30 = totalsByItem(metrics.filter((m) => m.item_id === post.id), 30).get(post.id)?.views ?? 0
  const views90 = totalsByItem(metrics.filter((m) => m.item_id === post.id)).get(post.id)?.views ?? 0
  const live = post.status === 'published'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/admin/blog" className="hover:text-primary">Blog posts</Link>
            <ChevronRight className="size-3" aria-hidden="true" />
            <span className="truncate">{post.title}</span>
          </nav>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-semibold text-foreground">
            <span className="truncate">{post.title}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${live ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{live ? 'Published' : 'Draft'}</span>
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <LastEdited at={post.updated_at} by={post.updated_by} users={users} />
            <span className="inline-flex items-center gap-1"><Eye className="size-3.5" aria-hidden="true" /> {fmt(views30)} views in 30 days · {fmt(views90)} in 90</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {live && (
            <a href={`/blogs/${post.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-semibold hover:bg-muted">
              <ExternalLink className="size-4" aria-hidden="true" /> View post
            </a>
          )}
          <ActionForm action={setPostStatusAction.bind(null, post.id, live ? 'draft' : 'published')} successMessage={live ? 'Post unpublished' : 'Post published — it’s now on the Blogs page'}>
            <SubmitButton variant={live ? 'ghost' : 'primary'} pendingText={live ? 'Unpublishing…' : 'Publishing…'}>{live ? 'Unpublish' : 'Publish'}</SubmitButton>
          </ActionForm>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <ActionForm action={updatePostAction.bind(null, post.id)} successMessage="Post saved" className="flex min-w-0 flex-col gap-6">
          <AdminCard title="Post">
            <div className="flex flex-col gap-4">
              <Field label="Title" htmlFor="title">
                <TextInput id="title" name="title" defaultValue={post.title} required maxLength={200} />
              </Field>
              <Field label="Summary" htmlFor="excerpt" hint="Shown on post cards and in search results (about 150 characters).">
                <TextArea id="excerpt" name="excerpt" rows={2} defaultValue={post.excerpt} maxLength={400} />
              </Field>
              <Field label="Article" htmlFor="body">
                <RichTextField id="body" name="body_html" defaultValue={post.body_html} tall />
              </Field>
            </div>
          </AdminCard>
          <AdminCard title="Details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Author" htmlFor="author"><TextInput id="author" name="author" defaultValue={post.author} placeholder="e.g. Dr. Mahasti Khakpour" /></Field>
              <Field label="Category" htmlFor="category"><TextInput id="category" name="category" defaultValue={post.category} placeholder="e.g. Food systems" /></Field>
              <Field label="Web address" htmlFor="slug" hint={`The post lives at /blogs/${post.slug}`} className="sm:col-span-2"><TextInput id="slug" name="slug" defaultValue={post.slug} /></Field>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" name="featured" defaultChecked={post.featured} className="admin-check" /> Feature this post (shown first and larger on the Blogs page)
              </label>
            </div>
            <div className="mt-5"><SubmitButton>Save post</SubmitButton></div>
          </AdminCard>
        </ActionForm>

        <div className="flex flex-col gap-6">
          <AdminCard title="Cover image">
            <ImageField label="" currentUrl={post.cover_image_url} currentKey={post.cover_image_key} onUpload={updatePostCoverAction.bind(null, post.id)} aspect="aspect-[16/10]" />
          </AdminCard>
          <AdminCard title="Delete post">
            <p className="mb-3 text-sm text-muted-foreground">Removes the post and its page for good.</p>
            <ActionForm action={deletePostAction.bind(null, post.id)} successMessage="Post deleted">
              <SubmitButton variant="danger" pendingText="Deleting…">Delete post</SubmitButton>
            </ActionForm>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
