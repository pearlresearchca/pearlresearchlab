import { ArrowUpRight, HeartPulse, Landmark, Leaf, Network, Scale, type LucideIcon } from 'lucide-react'
import { ArrowLink } from '@/components/site-shell'
import { Reveal } from '@/components/reveal'
import { PartnerLogoGrid, PartnerLogoMarquee, PartnerLogoRow } from '@/components/partner-logos'
import { ProjectFeatureView, TeamCard } from '@/components/site-views'
import { blocksText } from '@/lib/blog/blocks'
import type { AboutValue, BlogPost, JobPosting, Partner, Project, ProjectSection, ResearchArea, TeamMember } from '@/lib/cms/types'

// Blocks that display the site's structured content collections (research
// areas, team, projects, partners, values). The collections themselves are
// still edited in their own admin screens; these blocks decide where and how
// they appear on a page. Markup reuses the original site's components/classes.

const AREA_ICONS: Record<string, LucideIcon> = { HeartPulse, Scale, Leaf, Network, Landmark }

export function ResearchAreasBlock({ areas, props, link }: { areas: ResearchArea[]; props: Record<string, any>; link: { href: string } | null }) {
  const list = props.homeOnly ? areas.filter((a) => a.show_on_home) : areas
  const href = link?.href ?? '/research'
  if (props.variant === 'rows') {
    return (
      <div className="research-list-inner">
        {list.map((area, i) => (
          <Reveal className="research-row" delay={i * 60} key={area.id}>
            <div className="research-copy">
              <span className="stream-number">0{i + 1}</span>
              <h2>{area.title}</h2>
              <p>{area.summary}</p>
              {props.linkLabel && <ArrowLink href={href}>{props.linkLabel}</ArrowLink>}
            </div>
            {area.image_url && <img src={area.image_url} alt={area.title} loading="lazy" />}
          </Reveal>
        ))}
      </div>
    )
  }
  return (
    <div className="stream-grid">
      {list.map((area, index) => {
        const Icon = (area.icon_name && AREA_ICONS[area.icon_name]) || HeartPulse
        return (
          <Reveal className="stream-card" delay={index * 70} key={area.id}>
            <span className="stream-number">0{index + 1}</span>
            <Icon className="stream-icon" aria-hidden="true" />
            <h3>{area.title}</h3>
            <p>{area.home_summary || area.summary}</p>
            {props.linkLabel && <ArrowLink href={href}>{props.linkLabel}</ArrowLink>}
          </Reveal>
        )
      })}
    </div>
  )
}

export function TeamBlock({ members, props }: { members: TeamMember[]; props: Record<string, any> }) {
  const list = members.filter((m) => m.group_key === props.group)
  if (list.length === 0) return null
  return (
    <div>
      {(props.title || props.eyebrow) && (
        <Reveal className="team-stream-heading">
          <span className="team-stream-rule" aria-hidden="true" />
          <div>
            {props.eyebrow && <p className="eyebrow">{props.eyebrow}</p>}
            {props.title && <h2>{props.title}</h2>}
          </div>
        </Reveal>
      )}
      {list.map((member, i) => (
        <TeamCard member={member} delay={i * 60} reverse={i % 2 === 1} key={member.id} />
      ))}
    </div>
  )
}

export function ProjectsBlock({ projects, partners, props }: { projects: { project: Project; sections: ProjectSection[] }[]; partners: Record<string, Partner[]>; props: Record<string, any> }) {
  return (
    <div>
      {projects.map(({ project, sections }, i) => (
        <div key={project.id}>
          {i > 0 && <div className="project-divider" aria-hidden="true" />}
          <ProjectFeatureView project={project} sections={sections} partners={partners} index={i} ctaLabel={props.linkLabel || 'Discuss this project'} />
        </div>
      ))}
    </div>
  )
}

export function PartnersBlock({ logos, variant }: { logos: Partner[]; variant: string }) {
  if (variant === 'grid') return <PartnerLogoGrid logos={logos} />
  if (variant === 'row') return <PartnerLogoRow logos={logos} />
  return <PartnerLogoMarquee logos={logos} />
}

export function ValuesBlock({ values }: { values: AboutValue[] }) {
  return (
    <div className="values-grid">
      {values.map((value, i) => (
        <Reveal delay={i * 70} key={value.id}>
          <article>
            <span>{value.letter}</span>
            <h3>{value.title}</h3>
            <p>{value.body}</p>
          </article>
        </Reveal>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- blog & jobs

export function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
}

function PostCard({ post, featured = false, delay = 0 }: { post: BlogPost; featured?: boolean; delay?: number }) {
  return (
    <Reveal className={featured ? 'pb-post pb-post--featured' : 'pb-post'} delay={delay}>
      <a href={`/blogs/${post.slug}`} className="pb-post-link">
        <span className="pb-post-media">
          {post.cover_image_url ? <img src={post.cover_image_url} alt="" loading={featured ? 'eager' : 'lazy'} /> : <span className="pb-post-placeholder" aria-hidden="true">{post.title.slice(0, 1)}</span>}
        </span>
        <span className="pb-post-body">
          <span className="pb-post-meta">
            {post.category && <span className="pb-post-chip">{post.category}</span>}
            <span>{formatDate(post.published_at)}</span>
            <span aria-hidden="true">·</span>
            <span>{readingMinutes(post.body_html + ' ' + blocksText(Array.isArray(post.blocks) ? post.blocks : []))} min read</span>
          </span>
          <span className="pb-post-title">{post.title}</span>
          {post.excerpt && <span className="pb-post-excerpt">{post.excerpt}</span>}
          <span className="pb-post-more">
            Read the story <ArrowUpRight aria-hidden="true" />
          </span>
        </span>
      </a>
    </Reveal>
  )
}

export function BlogPostsBlock({ posts, props }: { posts: BlogPost[]; props: Record<string, any> }) {
  const category = String(props.category ?? '').trim().toLowerCase()
  const list = posts.filter((p) => !category || p.category.toLowerCase() === category).slice(0, Math.max(1, Number(props.limit) || 9))
  if (list.length === 0) return <p className="pb-feed-empty">{props.emptyText || 'New stories are on their way — check back soon.'}</p>
  const layout = props.layout ?? 'magazine'
  if (layout === 'list') {
    return (
      <div className="pb-post-list">
        {list.map((post, i) => (
          <Reveal className="pb-post-row" delay={i * 50} key={post.id}>
            <a href={`/blogs/${post.slug}`}>
              <span className="pb-post-row-date">{formatDate(post.published_at)}</span>
              <span className="pb-post-row-main">
                {post.category && <span className="pb-post-chip">{post.category}</span>}
                <span className="pb-post-title">{post.title}</span>
                {post.excerpt && <span className="pb-post-excerpt">{post.excerpt}</span>}
              </span>
              <ArrowUpRight className="pb-post-row-arrow" aria-hidden="true" />
            </a>
          </Reveal>
        ))}
      </div>
    )
  }
  const [first, ...rest] = layout === 'magazine' ? list : [null, ...list]
  return (
    <div className="pb-post-feed">
      {first && <PostCard post={first} featured />}
      {rest.length > 0 && (
        <div className="pb-post-grid">
          {rest.map((post, i) => post && <PostCard post={post} delay={i * 70} key={post.id} />)}
        </div>
      )}
    </div>
  )
}

export function JobOpeningsBlock({ jobs, props, emptyHref }: { jobs: JobPosting[]; props: Record<string, any>; emptyHref: string | null }) {
  const today = new Date().toISOString().slice(0, 10)
  const open = jobs.filter((j) => !j.closes_on || j.closes_on >= today)
  if (open.length === 0) {
    return (
      <div className="pb-jobs-empty">
        <p className="pb-jobs-empty-title">{props.emptyTitle || 'No open positions right now'}</p>
        {props.emptyText && <p>{props.emptyText}</p>}
        {emptyHref && props.emptyLinkLabel && (
          <ArrowLink href={emptyHref}>{props.emptyLinkLabel}</ArrowLink>
        )}
      </div>
    )
  }
  return (
    <ol className="pb-jobs">
      {open.map((job, i) => (
        <Reveal as="li" className="pb-job" delay={i * 60} key={job.id}>
          <a href={`/careers/${job.slug}`} className="pb-job-link">
            <span className="pb-job-index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <span className="pb-job-main">
              {job.team && <span className="pb-job-team">{job.team}</span>}
              <span className="pb-job-title">{job.title}</span>
              {job.summary && <span className="pb-job-summary">{job.summary}</span>}
            </span>
            <span className="pb-job-meta">
              {job.location && <span className="pb-job-chip">{job.location}</span>}
              {job.employment_type && <span className="pb-job-chip">{job.employment_type}</span>}
              {job.closes_on && <span className="pb-job-close">Apply by {formatDate(`${job.closes_on}T12:00:00Z`)}</span>}
            </span>
            <span className="pb-job-cta">
              View &amp; apply <ArrowUpRight aria-hidden="true" />
            </span>
          </a>
        </Reveal>
      ))}
    </ol>
  )
}
