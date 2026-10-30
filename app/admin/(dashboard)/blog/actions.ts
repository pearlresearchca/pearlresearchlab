'use server'

import { revalidatePath } from 'next/cache'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { check, withErrorHandling, type ActionResult } from '@/lib/cms/action-result'
import { normalizeSlug } from '@/lib/builder/defaults'
import { POST_STYLE, blocksText, sanitizePostBlocks, type PostBlock } from '@/lib/blog/blocks'

async function requirePages() {
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'pages')) throw new Error('You don’t have permission to edit blog posts.')
}

function revalidate(slug?: string) {
  revalidatePath('/admin/blog')
  // Post lists can appear on any page through the Blog posts block.
  revalidatePath('/', 'layout')
  if (slug) revalidatePath(`/blogs/${slug}`)
}

const suffix = () => Math.random().toString(36).slice(2, 6)

// Creates a draft straight away — nothing to fill in first. The chosen style
// also seeds a few starter blocks.
export async function createPostAction(style: string): Promise<{ id: string } | { error: string }> {
  try {
    await requirePages()
    const preset = POST_STYLE[style] ?? POST_STYLE.classic
    const admin = await getCurrentAdmin()
    const insforge = await createInsForgeServerClient()
    const { data, error } = await insforge.database
      .from('blog_posts')
      .insert([{ title: 'Untitled post', slug: `untitled-${suffix()}${suffix()}`, style: preset.key, blocks: preset.starter(), author: admin?.profile?.full_name ?? '' }])
      .select('id')
      .single()
    check({ data, error })
    revalidate()
    return { id: (data as { id: string }).id }
  } catch (err) {
    console.error(err)
    return { error: err instanceof Error ? err.message : 'Could not create the post. Please try again.' }
  }
}

export type PostDraft = {
  title: string
  excerpt: string
  author: string
  category: string
  slug: string
  featured: boolean
  style: string
  cover_image_url: string | null
  cover_image_key: string | null
  blocks: PostBlock[]
}

export async function savePostAction(id: string, draft: PostDraft): Promise<{ ok: true; slug: string } | { error: string }> {
  try {
    await requirePages()
    const title = String(draft.title ?? '').trim().slice(0, 200) || 'Untitled post'
    const insforge = await createInsForgeServerClient()
    const { data: current } = await insforge.database.from('blog_posts').select('slug, status').eq('id', id).maybeSingle()
    if (!current) throw new Error('This post no longer exists.')
    // Drafts with a placeholder address pick up one from their title.
    let slug = normalizeSlug(String(draft.slug ?? '')).replace(/\//g, '-').slice(0, 90)
    if (!slug || (slug.startsWith('untitled-') && title !== 'Untitled post')) slug = normalizeSlug(title).replace(/\//g, '-').slice(0, 80) || 'post'
    const cover = typeof draft.cover_image_url === 'string' && /^https:\/\//.test(draft.cover_image_url) ? draft.cover_image_url : null
    const patch = {
      title,
      slug,
      excerpt: String(draft.excerpt ?? '').trim().slice(0, 400),
      author: String(draft.author ?? '').trim().slice(0, 120),
      category: String(draft.category ?? '').trim().slice(0, 60),
      featured: !!draft.featured,
      style: POST_STYLE[draft.style] ? draft.style : 'classic',
      cover_image_url: cover,
      cover_image_key: cover ? String(draft.cover_image_key ?? '').slice(0, 300) || null : null,
      blocks: sanitizePostBlocks(draft.blocks),
    }
    let res = await insforge.database.from('blog_posts').update(patch).eq('id', id)
    if (res.error?.code === '23505') {
      // Address already taken by another post: keep it unique.
      patch.slug = `${slug}-${suffix()}`
      res = await insforge.database.from('blog_posts').update(patch).eq('id', id)
    }
    check(res)
    revalidate(patch.slug)
    if (current.slug !== patch.slug) revalidatePath(`/blogs/${current.slug}`)
    return { ok: true, slug: patch.slug }
  } catch (err) {
    console.error(err)
    return { error: err instanceof Error ? err.message : 'Could not save the post. Please try again.' }
  }
}

export async function setPostStatusAction(id: string, status: 'draft' | 'published'): Promise<ActionResult> {
  return withErrorHandling(async () => {
    await requirePages()
    const insforge = await createInsForgeServerClient()
    const { data: post } = await insforge.database.from('blog_posts').select('slug, published_at, blocks, body_html').eq('id', id).maybeSingle()
    if (!post) throw new Error('This post no longer exists.')
    if (status === 'published') {
      const hasContent = blocksText((post.blocks ?? []) as PostBlock[]).trim() || ((post.blocks ?? []) as PostBlock[]).some((b) => b.type === 'image' && b.src) || String(post.body_html ?? '').replace(/<[^>]+>/g, '').trim()
      if (!hasContent) throw new Error('Add some content to the post before publishing it.')
    }
    // Keep the first publish date when re-publishing.
    check(await insforge.database.from('blog_posts').update({ status, ...(status === 'published' && !post.published_at ? { published_at: new Date().toISOString() } : {}) }).eq('id', id))
    revalidate(post.slug)
  })
}

export async function deletePostAction(id: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    await requirePages()
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('blog_posts').delete().eq('id', id))
    revalidate()
  })
}
