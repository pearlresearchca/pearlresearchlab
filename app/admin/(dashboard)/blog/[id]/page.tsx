import { notFound } from 'next/navigation'
import { NoSectionAccess } from '@/components/admin/no-access'
import { PostComposer } from '@/components/admin/post-composer'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { getDailyMetrics, getPostById } from '@/lib/cms/posts-jobs'
import { totalsByItem } from '@/lib/cms/metrics'
import { getSiteConfig } from '@/lib/builder/queries'
import { googleFontsHref, themeCss } from '@/lib/builder/theme'

export const metadata = { title: 'Edit post' }

export default async function EditPostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ new?: string }> }) {
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'pages')) return <NoSectionAccess label="Blog posts" />
  const { id } = await params
  const post = await getPostById(id)
  if (!post) notFound()

  const [metricsAll, config, sp] = await Promise.all([getDailyMetrics('post', 90), getSiteConfig(), searchParams])
  const metrics = metricsAll.filter((m) => m.item_id === post.id)
  // The live preview uses the public site's theme, scoped to its own box.
  const fontsHref = googleFontsHref([config.theme.typography.headingFont, config.theme.typography.bodyFont])
  const d30 = totalsByItem(metrics, 30).get(post.id)?.views ?? 0
  const d90 = totalsByItem(metrics).get(post.id)?.views ?? 0

  return (
    <>
      {fontsHref && <link rel="stylesheet" href={fontsHref} />}
      <style dangerouslySetInnerHTML={{ __html: themeCss(config.theme, '.pa-preview-scope') }} />
    <PostComposer
      key={post.id}
      isNew={sp.new === '1'}
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
    </>
  )
}
