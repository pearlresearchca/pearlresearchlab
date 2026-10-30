'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createInsForgeServerClient } from '@/lib/insforge/server'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { check, withErrorHandling, type ActionResult } from '@/lib/cms/action-result'
import { sanitizeByType } from '@/lib/builder/sanitize'
import { normalizeSlug } from '@/lib/builder/defaults'

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

function slugFrom(raw: string, fallback: string) {
  const slug = normalizeSlug(raw || fallback).replace(/\//g, '-').slice(0, 90)
  if (!slug) throw new Error('Please give the post a title.')
  return slug
}

export async function createPostAction(formData: FormData): Promise<ActionResult> {
  let id = ''
  const result = await withErrorHandling(async () => {
    await requirePages()
    const title = String(formData.get('title') ?? '').trim().slice(0, 200)
    if (!title) throw new Error('Please give the post a title.')
    const insforge = await createInsForgeServerClient()
    const { data, error } = await insforge.database
      .from('blog_posts')
      .insert([{ title, slug: `${slugFrom('', title)}-${Math.random().toString(36).slice(2, 6)}` }])
      .select('id')
      .single()
    check({ data, error })
    id = (data as { id: string }).id
    revalidate()
  })
  if ('ok' in result && id) redirect(`/admin/blog/${id}`)
  return result
}

export async function updatePostAction(id: string, formData: FormData): Promise<ActionResult> {
  return withErrorHandling(async () => {
    await requirePages()
    const title = String(formData.get('title') ?? '').trim().slice(0, 200)
    if (!title) throw new Error('Please give the post a title.')
    const slug = slugFrom(String(formData.get('slug') ?? ''), title)
    const insforge = await createInsForgeServerClient()
    const res = await insforge.database
      .from('blog_posts')
      .update({
        title,
        slug,
        excerpt: String(formData.get('excerpt') ?? '').trim().slice(0, 400),
        author: String(formData.get('author') ?? '').trim().slice(0, 120),
        category: String(formData.get('category') ?? '').trim().slice(0, 60),
        featured: formData.get('featured') === 'on',
        body_html: sanitizeByType('richtext', String(formData.get('body_html') ?? '')),
      })
      .eq('id', id)
    if (res.error?.code === '23505') throw new Error('Another post already uses that URL.')
    check(res)
    revalidate(slug)
  })
}

export async function updatePostCoverAction(id: string, url: string, key: string): Promise<ActionResult> {
  return withErrorHandling(async () => {
    await requirePages()
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('blog_posts').update({ cover_image_url: url, cover_image_key: key }).eq('id', id))
    revalidate()
  })
}

export async function setPostStatusAction(id: string, status: 'draft' | 'published'): Promise<ActionResult> {
  return withErrorHandling(async () => {
    await requirePages()
    const insforge = await createInsForgeServerClient()
    const { data: post } = await insforge.database.from('blog_posts').select('slug, published_at, excerpt, body_html').eq('id', id).maybeSingle()
    if (!post) throw new Error('This post no longer exists.')
    if (status === 'published' && !String(post.body_html ?? '').replace(/<[^>]+>/g, '').trim()) throw new Error('Write the post before publishing it.')
    // Keep the first publish date when re-publishing.
    check(await insforge.database.from('blog_posts').update({ status, ...(status === 'published' && !post.published_at ? { published_at: new Date().toISOString() } : {}) }).eq('id', id))
    revalidate(post.slug)
  })
}

export async function deletePostAction(id: string): Promise<ActionResult> {
  const result = await withErrorHandling(async () => {
    await requirePages()
    const insforge = await createInsForgeServerClient()
    check(await insforge.database.from('blog_posts').delete().eq('id', id))
    revalidate()
  })
  if ('ok' in result) redirect('/admin/blog')
  return result
}
