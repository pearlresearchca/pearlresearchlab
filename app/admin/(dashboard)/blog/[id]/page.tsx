import { notFound } from 'next/navigation'
import { NoSectionAccess } from '@/components/admin/no-access'
import { PostComposer } from '@/components/admin/post-composer'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { getDailyMetrics, getPostById } from '@/lib/cms/posts-jobs'
import { totalsByItem } from '@/lib/cms/metrics'

export const metadata = { title: 'Edit post' }

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'pages')) return <NoSectionAccess label="Blog posts" />
  const { id } = await params
  const post = await getPostById(id)
  if (!post) notFound()

  const metrics = (await getDailyMetrics('post', 90)).filter((m) => m.item_id === post.id)
  const d30 = totalsByItem(metrics, 30).get(post.id)?.views ?? 0
  const d90 = totalsByItem(metrics).get(post.id)?.views ?? 0

  return (
    <PostComposer
      key={post.id}
      views={{ d30, d90 }}
      post={{
        id: post.id,
        status: post.status,
        title: post.title,
        excerpt: post.excerpt,
        author: post.author,
        category: post.category,
        slug: post.slug,
        featured: post.featured,
        style: post.style || 'classic',
        cover_image_url: post.cover_image_url,
        cover_image_key: post.cover_image_key,
        blocks: Array.isArray(post.blocks) ? post.blocks : [],
      }}
    />
  )
}
