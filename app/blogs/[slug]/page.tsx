import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { after } from 'next/server'
import { ArrowLeft, ArrowUpRight, Clock } from 'lucide-react'
import { PageFrame } from '@/components/page-frame'
import { Reveal } from '@/components/reveal'
import { formatDate, readingMinutes } from '@/components/builder-render/site-blocks'
import { getPostBySlug, getPublishedPosts, recordView } from '@/lib/cms/posts-jobs'
import { sanitizeByType } from '@/lib/builder/sanitize'
import { JsonLd, ORGANIZATION, SITE_URL, breadcrumbs } from '@/lib/seo/json-ld'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug((await params).slug)
  if (!post) return { title: 'Story not found' }
  const description = post.excerpt || `${post.title} — news from PEARL Research Lab.`
  return {
    title: post.title,
    description,
    alternates: { canonical: `/blogs/${post.slug}` },
    authors: post.author ? [{ name: post.author }] : undefined,
    openGraph: {
      type: 'article',
      url: `/blogs/${post.slug}`,
      title: post.title,
      description,
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      section: post.category || undefined,
      ...(post.cover_image_url ? { images: [{ url: post.cover_image_url }] } : {}),
    },
    twitter: { card: 'summary_large_image', title: post.title, description, ...(post.cover_image_url ? { images: [post.cover_image_url] } : {}) },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPostBySlug((await params).slug)
  if (!post) notFound()
  const userAgent = (await headers()).get('user-agent') ?? ''
  after(() => recordView('post', post.id, userAgent))
  const more = (await getPublishedPosts(6)).filter((p) => p.id !== post.id).slice(0, 3)
  const minutes = readingMinutes(post.body_html)

  return (
    <PageFrame>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BlogPosting',
              headline: post.title,
              description: post.excerpt || undefined,
              image: post.cover_image_url || undefined,
              datePublished: post.published_at || undefined,
              dateModified: post.updated_at || undefined,
              author: post.author ? { '@type': 'Person', name: post.author } : { '@id': ORGANIZATION['@id'] },
              publisher: { '@id': ORGANIZATION['@id'] },
              mainEntityOfPage: `${SITE_URL}/blogs/${post.slug}`,
              articleSection: post.category || undefined,
              timeRequired: `PT${minutes}M`,
            },
            ORGANIZATION,
            breadcrumbs([{ name: 'Home', path: '' }, { name: 'Blogs', path: '/blogs' }, { name: post.title, path: `/blogs/${post.slug}` }]),
          ],
        }}
      />
      <main className="article">
        <header className="article-hero">
          <div className="article-wrap">
            <a href="/blogs" className="article-back"><ArrowLeft aria-hidden="true" /> All stories</a>
            <div className="article-meta">
              {post.category && <span className="pb-post-chip">{post.category}</span>}
              <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at)}</time>
              <span className="article-dot" aria-hidden="true" />
              <span className="article-read"><Clock aria-hidden="true" /> {minutes} min read</span>
            </div>
            <h1 className="article-title">{post.title}</h1>
            {post.excerpt && <p className="article-lead">{post.excerpt}</p>}
            {post.author && <p className="article-byline">By <strong>{post.author}</strong></p>}
          </div>
        </header>
        {post.cover_image_url && (
          <figure className="article-cover">
            <img src={post.cover_image_url} alt="" />
          </figure>
        )}
        <div className="article-wrap">
          <div className="pb-rich article-body" dangerouslySetInnerHTML={{ __html: sanitizeByType('richtext', post.body_html) }} />
        </div>
        {more.length > 0 && (
          <section className="article-more" aria-labelledby="more-stories">
            <div className="site-container">
              <h2 id="more-stories">More from PEARL</h2>
              <div className="pb-post-grid">
                {more.map((p, i) => (
                  <Reveal className="pb-post" delay={i * 70} key={p.id}>
                    <a href={`/blogs/${p.slug}`} className="pb-post-link">
                      <span className="pb-post-media">{p.cover_image_url ? <img src={p.cover_image_url} alt="" loading="lazy" /> : <span className="pb-post-placeholder" aria-hidden="true">{p.title.slice(0, 1)}</span>}</span>
                      <span className="pb-post-body">
                        <span className="pb-post-meta">{p.category && <span className="pb-post-chip">{p.category}</span>}<span>{formatDate(p.published_at)}</span></span>
                        <span className="pb-post-title">{p.title}</span>
                        <span className="pb-post-more">Read the story <ArrowUpRight aria-hidden="true" /></span>
                      </span>
                    </a>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </PageFrame>
  )
}
