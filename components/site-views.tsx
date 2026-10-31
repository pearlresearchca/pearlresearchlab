import { ArrowUpRight, ChevronDown } from 'lucide-react'
import { ArrowLink } from './site-shell'
import { Reveal } from './reveal'
import { PartnerLogoRow } from './partner-logos'
import type { Partner, Project, ProjectSection, TeamMember } from '@/lib/cms/types'

// Presentational pieces used by the page builder's data blocks (no data fetching).

// Synchronous view so the page builder can render projects from preloaded data.
export function ProjectFeatureView({
  project,
  sections,
  partners,
  index,
  ctaLabel = 'Discuss this project',
}: {
  project: Project
  sections: ProjectSection[]
  partners: Record<string, Partner[]>
  index: number
  ctaLabel?: string
}) {
  const topPartners = project.partners_context ? partners[project.partners_context] ?? [] : []

  return (
    <section className={index === 0 ? 'project-feature-section project-feature-primary' : 'project-feature-section'}>
      <Reveal className="site-container project-feature-header">
        <div className="project-header-meta">
          <span className="project-index">{project.index_label}</span>
          <span>{project.category_label}</span>
        </div>
        <h2>{project.title}</h2>
        {project.project_name && <p className="project-name">{project.project_name}</p>}
        {project.subtitle && <p className="project-subtitle">{project.subtitle}</p>}
        {project.meta_line.length > 0 && (
          <div className="project-header-line" aria-hidden="true">
            {project.meta_line.map((m) => <span key={m}>{m}</span>)}
          </div>
        )}
      </Reveal>

      {project.banner_image_url && (
        <Reveal className="site-container project-banner-wrap" delay={80}>
          <img className="project-banner" src={project.banner_image_url} alt={project.title} />
        </Reveal>
      )}

      {project.intro_paragraphs.length > 0 && (
        <Reveal className="site-container project-feature-intro prose" delay={120}>
          {project.intro_paragraphs.map((p) => <p key={p}>{p}</p>)}
        </Reveal>
      )}

      {topPartners.length > 0 && (
        <Reveal className="site-container" delay={160}>
          <PartnerLogoRow logos={topPartners} />
        </Reveal>
      )}

      <div className="site-container">
        {sections.map((s, i) => {
          const imageIndex = sections.slice(0, i).filter((prev) => prev.image_url).length
          return (
            <SectionRow
              key={s.id}
              heading={s.heading}
              body={s.body_paragraphs}
              image={s.image_url}
              reverse={imageIndex % 2 === 1}
              logos={s.partners_context ? partners[s.partners_context] ?? [] : []}
              delay={i * 60}
            />
          )
        })}
        <Reveal className="project-feature-cta">
          <ArrowLink href="/contact">{ctaLabel}</ArrowLink>
        </Reveal>
      </div>
    </section>
  )
}

function SectionRow({
  heading,
  body,
  image,
  reverse,
  logos,
  delay,
}: {
  heading: string
  body: string[]
  image: string | null
  reverse: boolean
  logos: Partner[]
  delay: number
}) {
  const rowClass = !image ? 'research-row research-row-solo' : reverse ? 'research-row research-row-reverse' : 'research-row'
  // Long sections lead with their first paragraph; the rest folds away so the
  // text stays in proportion with the image beside it.
  const [lead, ...more] = body

  return (
    <div>
      <Reveal className={`${rowClass} project-section-row`} delay={delay}>
        <div className="research-copy">
          <h3>{heading}</h3>
          {lead && <p className="project-section-lead">{lead}</p>}
          {more.length > 0 && (
            <details className="project-section-more">
              <summary>
                <span className="project-section-more-open">Read more</span>
                <span className="project-section-more-close">Show less</span>
                <ChevronDown aria-hidden="true" />
              </summary>
              {more.map((p) => <p key={p}>{p}</p>)}
            </details>
          )}
        </div>
        {image && (
          <div className="project-section-media">
            <img src={image} alt={heading} loading="lazy" decoding="async" />
          </div>
        )}
      </Reveal>
      {logos.length > 0 && (
        <Reveal delay={delay + 40}>
          <PartnerLogoRow logos={logos} />
        </Reveal>
      )}
    </div>
  )
}

export function TeamCard({ member, delay = 0, reverse = false }: { member: TeamMember; delay?: number; reverse?: boolean }) {
  return (
    <Reveal className={reverse ? 'team-row team-row-reverse' : 'team-row'} delay={delay}>
      <div className="team-photo-frame">
        {member.image_url && <img src={member.image_url} alt={`${member.name}, ${member.role}`} />}
      </div>
      <div className="team-card-content">
        <p className="role-tag">{member.role}</p>
        <h2>
          {member.profile_url ? (
            <a href={member.profile_url} className="team-name-link">
              {member.name}
              <ArrowUpRight aria-hidden="true" />
            </a>
          ) : (
            member.name
          )}
        </h2>
        {member.bio_paragraphs.map((p) => <p key={p}>{p}</p>)}
      </div>
    </Reveal>
  )
}
