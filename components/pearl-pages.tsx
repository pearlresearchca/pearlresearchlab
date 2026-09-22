import { ArrowLink, PageHero, SectionHeading } from './site-shell'
import { PageFrame } from './page-frame'
import { ContactForm } from './contact-form'
import { Reveal } from './reveal'
import { PartnerLogoGrid, PartnerLogoRow } from './partner-logos'
import { CmsImage } from './cms-image'
import { TeamGrid } from './team-grid'
import { anchorId } from '@/lib/cms/format'
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
          <Reveal className="site-container mission-inner">
            <p className="eyebrow">{text(content, 'mission_eyebrow')}</p>
            <h2>{text(content, 'mission_title')}</h2>
            {missionBody.map((p) => <p key={p}>{p}</p>)}
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
        {areas.length > 1 && (
          <nav className="research-jump" aria-label="Research streams">
            <div className="site-container research-jump-inner">
              {areas.map((area, i) => (
                <a key={area.id} href={`#${anchorId(area.title)}`}>
                  <span aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>{area.title}
                </a>
              ))}
            </div>
          </nav>
        )}
        <section className="research-list">
          <div className="site-container">
            {areas.map((area, i) => (
              <div className="research-anchor" id={anchorId(area.title)} key={area.id}>
                <Reveal className="research-row" delay={i * 60}>
                  <div className="research-copy">
                    <span className="stream-number">{String(i + 1).padStart(2, '0')}</span>
                    <h2>{area.title}</h2>
                    <p>{area.summary}</p>
                    <ArrowLink href="/contact">Discuss this area</ArrowLink>
                  </div>
                  {area.image_url && <CmsImage src={area.image_url} alt={area.title} sizes="(max-width: 900px) 100vw, 480px" />}
                </Reveal>
              </div>
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
          <CmsImage className="project-banner" src={project.banner_image_url} alt={project.title} sizes="(max-width: 1228px) 100vw, 1180px" width={2000} height={900} eager={index === 0} />
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
              partnersContext={s.partners_context}
              delay={i * 60}
            />
          )
        })}
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
  reverse,
  partnersContext,
  delay,
}: {
  heading: string
  body: string[]
  image: string | null
  reverse: boolean
  partnersContext: string | null
  delay: number
}) {
  const logos = partnersContext ? await getPartnersByContext(partnersContext) : []
  const rowClass = !image ? 'research-row research-row-solo' : reverse ? 'research-row research-row-reverse' : 'research-row'

  return (
    <div>
      <Reveal className={rowClass} delay={delay}>
        <div className="research-copy">
          <h3>{heading}</h3>
          {body.map((p) => <p key={p}>{p}</p>)}
        </div>
        {image && <CmsImage src={image} alt={heading} sizes="(max-width: 900px) 100vw, 480px" />}
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

function TeamPhoto({ member, sizes }: { member: TeamMember; sizes: string }) {
  if (!member.image_url) return <span className="team-photo-placeholder" aria-hidden="true">{member.name.charAt(0)}</span>
  return <CmsImage src={member.image_url} alt={`${member.name}, ${member.role}`} sizes={sizes} width={800} height={1000} />
}

function TeamCard({ member, delay = 0, reverse = false }: { member: TeamMember; delay?: number; reverse?: boolean }) {
  return (
    <Reveal className={reverse ? 'team-row team-row-reverse' : 'team-row'} delay={delay}>
      <div className="team-photo-frame">
        <TeamPhoto member={member} sizes="(max-width: 640px) 100vw, 300px" />
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
      <Reveal>
        <TeamGrid
          members={members}
          photos={Object.fromEntries(members.map((m) => [m.id, <TeamPhoto key={m.id} member={m} sizes="(max-width: 640px) 50vw, 280px" />]))}
        />
      </Reveal>
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

export async function ContactPage() {
  const content = await getPageContent('contact')
  const address = lines(content, 'address')
  const interests = lines(content, 'interests_list')
  const connectItems = lines(content, 'connect_list')
  const email = text(content, 'email').trim()

  return (
    <PageFrame>
      <main>
        <PageHero
          kicker={text(content, 'hero_kicker')}
          title={text(content, 'hero_title')}
          intro={text(content, 'hero_intro')}
        />

        <section className="contact-section" id="start-a-conversation">
          <div className="site-container contact-grid">
            <Reveal>
              <div className="section-heading">
                <h2>{text(content, 'start_title')}</h2>
                {prose(content, 'start_body').map((p) => <p key={p}>{p}</p>)}
              </div>
              <div className="contact-details">
                <p>{address.map((line, i) => <span key={line}>{i === 0 ? <strong>{line}</strong> : line}{i < address.length - 1 && <br />}</span>)}</p>
                <p><strong>Hours</strong><br />{text(content, 'hours')}</p>
                {email && <p className="contact-email"><strong>Email</strong><br /><a href={`mailto:${email}`}>{email}</a></p>}
              </div>
              <div className="contact-cta">
                <a className="button button-primary" href="#send-a-message">{text(content, 'cta_label')}</a>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="form-heading" id="send-a-message">
                <h2>{text(content, 'form_title')}</h2>
                <p>{text(content, 'form_intro')}</p>
              </div>
              <ContactForm
                email={email}
                notice={text(content, 'sensitive_notice')}
                confirmationTitle={text(content, 'confirmation_title')}
                confirmationBody={text(content, 'confirmation_body')}
              />
            </Reveal>
          </div>
        </section>

        <section className="partnerships-section" aria-labelledby="partnerships-title">
          <Reveal className="site-container partnerships-intro prose">
            <h2 id="partnerships-title">{text(content, 'partnerships_title')}</h2>
            {prose(content, 'partnerships_intro').map((p) => <p key={p}>{p}</p>)}
          </Reveal>
        </section>

        <section className="interest-section" aria-labelledby="interests-title">
          <div className="site-container">
            <Reveal className="section-heading">
              <h2 id="interests-title">{text(content, 'interests_title')}</h2>
            </Reveal>
            <Reveal delay={60}>
              <ul className="interest-grid">
                {interests.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p className="interest-note">{text(content, 'interests_note')}</p>
            </Reveal>
          </div>
        </section>

        <section className="connect-section">
          <div className="site-container connect-grid">
            <Reveal>
              <h2>{text(content, 'connect_title')}</h2>
              <p>{text(content, 'connect_lead')}</p>
              <ul className="connect-list">
                {connectItems.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p>{text(content, 'connect_note')}</p>
            </Reveal>
            <Reveal delay={100}>
              <h2>{text(content, 'approach_title')}</h2>
              {prose(content, 'approach_body').map((p) => <p key={p}>{p}</p>)}
              <p className="approach-note">{text(content, 'approach_note')}</p>
            </Reveal>
          </div>
        </section>

      </main>
    </PageFrame>
  )
}
