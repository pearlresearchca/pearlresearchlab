import { Stethoscope, Users } from 'lucide-react'
import { ArrowLink, PageHero, SectionHeading } from './site-shell'
import { PageFrame } from './page-frame'
import { ContactForm } from './contact-form'
import { Reveal } from './reveal'
import { PartnerLogoGrid, PartnerLogoRow } from './partner-logos'
import {
  getAboutValues,
  getPageContent,
  getPartnersByContext,
  getProjectSections,
  getProjects,
  getResearchAreas,
  getTeamMembers,
  lines,
  prose,
  text,
} from '@/lib/cms/queries'
import type { Project, TeamGroupKey, TeamMember } from '@/lib/cms/types'

export async function AboutPage() {
  const [content, values, partners] = await Promise.all([
    getPageContent('about'),
    getAboutValues(),
    getPartnersByContext('about'),
  ])
  const missionBody = prose(content, 'mission_body')

  return (
    <PageFrame>
      <main>
        <PageHero
          kicker={text(content, 'hero_kicker')}
          title={text(content, 'hero_title')}
          intro={text(content, 'hero_intro')}
        />

        <section className="content-section">
          <Reveal className="site-container two-column">
            <div>
              <p className="eyebrow">{text(content, 'mission_eyebrow')}</p>
              <h2>{text(content, 'mission_title')}</h2>
            </div>
            <div className="prose">
              {missionBody.map((p) => <p key={p}>{p}</p>)}
            </div>
          </Reveal>
        </section>

        <section className="vision-section">
          <Reveal className="site-container vision-inner">
            <p className="eyebrow">{text(content, 'vision_eyebrow')}</p>
            <h2>{text(content, 'vision_title')}</h2>
            <p>{text(content, 'vision_body')}</p>
          </Reveal>
        </section>

        <section className="values-section">
          <div className="site-container">
            <SectionHeading kicker={text(content, 'values_eyebrow')} title={text(content, 'values_title')} />
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
          </div>
        </section>

        <section className="partners-section">
          <div className="site-container">
            <Reveal className="partners-intro">
              <p className="eyebrow">{text(content, 'partners_eyebrow')}</p>
              <h2>{text(content, 'partners_title')}</h2>
              <p>{text(content, 'partners_body')}</p>
            </Reveal>
            <Reveal delay={100}>
              <PartnerLogoGrid logos={partners} />
            </Reveal>
          </div>
        </section>
      </main>
    </PageFrame>
  )
}

export async function ResearchPage() {
  const [content, areas] = await Promise.all([getPageContent('research'), getResearchAreas()])

  return (
    <PageFrame>
      <main>
        <PageHero
          kicker={text(content, 'hero_kicker')}
          title={text(content, 'hero_title')}
          intro={text(content, 'hero_intro')}
        />
        <section className="research-list">
          <div className="site-container">
            {areas.map((area, i) => (
              <Reveal className="research-row" delay={i * 60} key={area.id}>
                <div className="research-copy">
                  <span className="stream-number">0{i + 1}</span>
                  <h2>{area.title}</h2>
                  <p>{area.summary}</p>
                  <ArrowLink href="/contact">Discuss this area</ArrowLink>
                </div>
                {area.image_url && <img src={area.image_url} alt={area.title} />}
              </Reveal>
            ))}
          </div>
        </section>
      </main>
    </PageFrame>
  )
}

async function ProjectFeature({ project, index }: { project: Project; index: number }) {
  const [sections, topPartners] = await Promise.all([
    getProjectSections(project.id),
    project.partners_context ? getPartnersByContext(project.partners_context) : Promise.resolve([]),
  ])

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
        {sections.map((s, i) => (
          <SectionRow key={s.id} heading={s.heading} body={s.body_paragraphs} image={s.image_url} partnersContext={s.partners_context} delay={i * 60} />
        ))}
        <Reveal className="project-feature-cta">
          <ArrowLink href="/contact">Discuss this project</ArrowLink>
        </Reveal>
      </div>
    </section>
  )
}

async function SectionRow({
  heading,
  body,
  image,
  partnersContext,
  delay,
}: {
  heading: string
  body: string[]
  image: string | null
  partnersContext: string | null
  delay: number
}) {
  const logos = partnersContext ? await getPartnersByContext(partnersContext) : []

  return (
    <div>
      <Reveal className={image ? 'research-row' : 'research-row research-row-solo'} delay={delay}>
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

export async function ProjectsPage() {
  const [content, projects] = await Promise.all([getPageContent('projects'), getProjects(true)])

  return (
    <PageFrame>
      <main>
        <PageHero
          kicker={text(content, 'hero_kicker')}
          title={text(content, 'hero_title')}
          intro={text(content, 'hero_intro')}
        />

        {projects.map((project, i) => (
          <div key={project.id}>
            {i > 0 && <div className="project-divider" aria-hidden="true" />}
            <ProjectFeature project={project} index={i} />
          </div>
        ))}
      </main>
    </PageFrame>
  )
}

const GROUPS: { key: TeamGroupKey; title: string; past?: boolean }[] = [
  { key: 'tfs', title: 'Transforming Food Systems' },
  { key: 'ift', title: 'Inter-Facility Transfer System' },
  { key: 'past', title: 'Past Contributors', past: true },
]

function TeamCard({ member, delay = 0, reverse = false }: { member: TeamMember; delay?: number; reverse?: boolean }) {
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

function TeamGroup({ title, members, past = false }: { title: string; members: TeamMember[]; past?: boolean }) {
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

export async function TeamPage() {
  const [content, members] = await Promise.all([getPageContent('team'), getTeamMembers()])
  const byGroup = (key: TeamGroupKey) => members.filter((m) => m.group_key === key)
  const leadership = byGroup('leadership')

  return (
    <PageFrame>
      <main>
        <PageHero
          kicker={text(content, 'hero_kicker')}
          title={text(content, 'hero_title')}
          intro={text(content, 'hero_intro')}
        />

        <section className="team-intro">
          <Reveal className="site-container team-intro-grid">
            <div>
              <p className="eyebrow">{text(content, 'intro_eyebrow')}</p>
              <h2>{text(content, 'intro_title')}</h2>
            </div>
            <p className="prose">{text(content, 'intro_body')}</p>
          </Reveal>
        </section>

        <section className="team-section">
          <div className="site-container">
            <Reveal className="team-group-heading">
              <p className="eyebrow">{text(content, 'leadership_eyebrow')}</p>
              <h2>{text(content, 'leadership_title')}</h2>
            </Reveal>
            {leadership.map((member, i) => <TeamCard member={member} delay={i * 80} reverse={i % 2 === 1} key={member.id} />)}

            <Reveal className="team-group-heading team-group-heading-spaced">
              <p className="eyebrow">{text(content, 'research_team_eyebrow')}</p>
              <h2>{text(content, 'research_team_title')}</h2>
            </Reveal>
            {GROUPS.map((g) => (
              <TeamGroup key={g.key} title={g.title} members={byGroup(g.key)} past={g.past} />
            ))}
          </div>
        </section>

        <section className="team-cta">
          <Reveal className="site-container team-cta-inner">
            <div>
              <p className="eyebrow">{text(content, 'cta_eyebrow')}</p>
              <h2>{text(content, 'cta_title')}</h2>
            </div>
            <ArrowLink href="/contact">Start a conversation</ArrowLink>
          </Reveal>
        </section>
      </main>
    </PageFrame>
  )
}

const collabs = [
  {
    icon: Users,
    title: 'Community organizations',
    text: 'We do a lot of community-engaged work, and we actively encourage community organizations to reach out with questions, ideas, or opportunities for collaboration.',
  },
  {
    icon: Stethoscope,
    title: 'Health-care organizations & partners',
    text: 'We also conduct health-care delivery and program evaluations. Health-care organizations and other partners are welcome to contact us about potential evaluation projects.',
  },
]

export async function ContactPage() {
  const content = await getPageContent('contact')
  const address = lines(content, 'address')

  return (
    <PageFrame>
      <main>
        <PageHero
          kicker={text(content, 'hero_kicker')}
          title={text(content, 'hero_title')}
          intro={text(content, 'hero_intro')}
        />

        <section className="collab-section">
          <div className="site-container">
            <SectionHeading
              kicker={text(content, 'collab_eyebrow')}
              title={text(content, 'collab_title')}
              body={text(content, 'collab_body')}
            />
            <div className="collab-grid">
              {collabs.map(({ icon: Icon, title, text: body }, i) => (
                <Reveal className="collab-card" delay={i * 80} key={title}>
                  <Icon className="collab-icon" aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{body}</p>
                  <ArrowLink href="#start-a-conversation">Start a conversation</ArrowLink>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="contact-section" id="start-a-conversation">
          <div className="site-container contact-grid">
            <Reveal>
              <SectionHeading title={text(content, 'start_title')} body={text(content, 'start_body')} />
              <div className="contact-details">
                <p>{address.map((line, i) => <span key={line}>{i === 0 ? <strong>{line}</strong> : line}{i < address.length - 1 && <br />}</span>)}</p>
                <p><strong>Hours</strong><br />{text(content, 'hours')}</p>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <ContactForm />
            </Reveal>
          </div>
        </section>
      </main>
    </PageFrame>
  )
}
