import { HeartPulse, Leaf, Network, Scale, type LucideIcon } from 'lucide-react'
import { ArrowLink } from '@/components/site-shell'
import { Reveal } from '@/components/reveal'
import { PartnerLogoGrid, PartnerLogoMarquee, PartnerLogoRow } from '@/components/partner-logos'
import { ProjectFeatureView, TeamCard } from '@/components/site-views'
import type { AboutValue, Partner, Project, ProjectSection, ResearchArea, TeamMember } from '@/lib/cms/types'

// Blocks that display the site's structured content collections (research
// areas, team, projects, partners, values). The collections themselves are
// still edited in their own admin screens; these blocks decide where and how
// they appear on a page. Markup reuses the original site's components/classes.

const AREA_ICONS: Record<string, LucideIcon> = { HeartPulse, Scale, Leaf, Network }

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
