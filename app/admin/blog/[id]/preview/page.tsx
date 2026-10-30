import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageFrame } from '@/components/page-frame'
import { PostArticle } from '@/components/blog/post-article'
import { requireAdmin, hasAny } from '@/lib/builder/admin-data'
import { NoSectionAccess } from '@/components/admin/no-access'
import { getPostById } from '@/lib/cms/posts-jobs'
import { sanitizeByType } from '@/lib/builder/sanitize'

export const metadata: Metadata = { title: 'Post preview', robots: { index: false, follow: false } }

// Draft preview of a blog post, rendered exactly like the public article.
export default async function PostPreview({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!hasAny(admin.profile, ['pages'])) return <NoSectionAccess label="Blog posts" />
  const post = await getPostById((await params).id)
  if (!post) notFound()
  return (
    <PageFrame>
      <div className="pa-preview-bar" role="status">
        Preview{post.status === 'published' ? ' of the saved version' : ' — this post isn’t published yet'}
      </div>
      <main>
        <PostArticle
          backHref={null}
          post={{ ...post, blocks: Array.isArray(post.blocks) ? post.blocks : [], published_at: post.published_at ?? new Date().toISOString() }}
          legacyHtml={post.body_html ? sanitizeByType('richtext', post.body_html) : undefined}
        />
      </main>
    </PageFrame>
  )
}
