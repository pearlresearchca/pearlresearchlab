import { ArrowLink } from './site-shell'
import { Reveal } from './reveal'
import { PartnerLogoRow } from './partner-logos'
import type { Partner, Project, ProjectSection, TeamMember } from '@/lib/cms/types'

// Presentational pieces of the original pages with no data fetching, shared by
// the classic pages (components/pearl-pages.tsx) and the page builder.

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

  return (
    <div>
      <Reveal className={rowClass} delay={delay}>
        <div className="research-copy">
          <h3>{heading}</h3>
          {body.map((p) => <p key={p}>{p}</p>)}
        </div>
        {image && <img src={image} alt={heading} />}
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
        <h2>{member.name}</h2>
        {member.bio_paragraphs.map((p) => <p key={p}>{p}</p>)}
      </div>
    </Reveal>
  )
}

export function TeamGroup({ title, members, past = false }: { title: string; members: TeamMember[]; past?: boolean }) {
  if (members.length === 0) return null
  return (
    <section className={`team-stream-group${past ? ' team-past-group' : ''}`}>
      <Reveal className="team-stream-heading">
        <span className="team-stream-rule" aria-hidden="true" />
        <div>
          <p className="eyebrow">{past ? 'Previous PEARL contributors' : 'Current research stream'}</p>
          <h2>{title}</h2>
        </div>
      </Reveal>
      {members.map((member, i) => <TeamCard member={member} delay={i * 60} reverse={i % 2 === 1} key={member.id} />)}
    </section>
  )
}

