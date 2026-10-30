import Link from 'next/link'
import { Eye, FileText, Newspaper, PenLine, Star, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/admin/page-header'
import { NoSectionAccess } from '@/components/admin/no-access'
import { NewPostButton } from '@/components/admin/new-post-dialog'
import { EmptyState } from '@/components/admin/ui'
import { BreakdownPanel, RankingPanel, TrendPanel } from '@/components/admin/content-insights'
import { KpiGrid } from '@/components/admin/kpi-grid'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { getAllPosts, getDailyMetrics } from '@/lib/cms/posts-jobs'
import { dailySeries, fmt, totalsByItem } from '@/lib/cms/metrics'
import { relativeTime } from '@/lib/cms/format'

export const metadata = { title: 'Blog posts' }

export default async function BlogAdminPage() {
  const admin = await getCurrentAdmin()
  if (!canAccess(admin?.profile, 'pages')) return <NoSectionAccess label="Blog posts" />

  const [posts, metrics] = await Promise.all([getAllPosts(), getDailyMetrics('post', 90)])
  const published = posts.filter((p) => p.status === 'published')
  const totals30 = totalsByItem(metrics, 30)
  const totalsAll = totalsByItem(metrics)
  const views30 = [...totals30.values()].reduce((s, t) => s + t.views, 0)
  const views90 = [...totalsAll.values()].reduce((s, t) => s + t.views, 0)
  const top = [...published].sort((a, b) => (totals30.get(b.id)?.views ?? 0) - (totals30.get(a.id)?.views ?? 0))[0]
  const topViews = top ? totals30.get(top.id)?.views ?? 0 : 0
  const categories = new Map<string, number>()
  for (const p of published) categories.set(p.category || 'Uncategorised', (categories.get(p.category || 'Uncategorised') ?? 0) + 1)
  const since30 = new Date(Date.now() - 30 * 86_400_000).toISOString()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        group="Content"
        title="Blog posts"
        description="Write posts, publish them, and see how they’re read. Published posts appear wherever the Blog posts block is placed (the Blogs page)."
        icon={<Newspaper />}
      />

      <KpiGrid
        items={[
          { label: 'Published posts', value: fmt(published.length), detail: `${posts.length - published.length} drafts · ${published.filter((p) => (p.published_at ?? '') >= since30).length} new in 30 days`, icon: FileText },
          { label: 'Views (30 days)', value: fmt(views30), detail: `${fmt(views90)} in the last 90 days`, icon: Eye, tone: 'teal' },
          { label: 'Avg. views per post', value: published.length ? fmt(Math.round(views30 / published.length)) : '—', detail: 'Last 30 days', icon: TrendingUp, tone: 'violet' },
          { label: 'Most read', value: topViews > 0 ? fmt(topViews) : '—', detail: topViews > 0 ? top!.title : 'No views yet', icon: Star, tone: 'amber' },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <TrendPanel title="Post views" data={dailySeries(metrics, 90, (m) => [m.views])} primaryLabel="Views" empty="Views appear here once published posts are read." />
        <BreakdownPanel title="Posts by category" subtitle="Published posts" data={[...categories].map(([label, value]) => ({ label, value }))} empty="Publish a post to see categories." />
      </div>
      <RankingPanel
        title="Top posts"
        subtitle="Views in the last 30 days"
        data={published.map((p) => ({ label: p.title, value: totals30.get(p.id)?.views ?? 0 })).sort((a, b) => b.value - a.value)}
        primaryLabel="Views"
        empty="No views in the last 30 days."
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_2px_rgba(15,23,42,.04)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-[15px] font-semibold">All posts</h2>
          <NewPostButton />
        </header>
        {posts.length === 0 ? (
          <div className="p-5">
            <EmptyState title="No posts yet" body="Press New post, pick a look, and start writing." />
          </div>
        ) : (
          <ul className="divide-y divide-border" data-tour="post-list">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/blog/${p.id}`} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-background">
                  {p.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.cover_image_url} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-slate-400">
                      <PenLine className="size-4" aria-hidden="true" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{p.title}</span>
                      {p.featured && <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Featured" />}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">{[p.category, p.author].filter(Boolean).join(' · ') || 'No category'}</span>
                  </span>
                  <span className="hidden w-24 text-right text-xs tabular-nums text-muted-foreground sm:block">{fmt(totalsAll.get(p.id)?.views ?? 0)} views</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {p.status === 'published' ? 'Published' : 'Draft'}
                  </span>
                  <span suppressHydrationWarning className="hidden w-20 text-right text-xs text-muted-foreground md:block">
                    {relativeTime(p.updated_at ?? p.created_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
