import { ArrowLink, PageHero, SectionHeading } from './site-shell'
import { ProjectFeatureView, TeamCard, TeamGroup } from './site-views'
import { PageFrame } from './page-frame'
import { ContactForm } from './contact-form'
import { Reveal } from './reveal'
import {
  Apple,
  Building2,
  Bus,
  CircleCheck,
  Clock,
  Globe2,
  Handshake,
  HeartPulse,
  House,
  Lightbulb,
  Mail,
  MapPin,
  MessageCircle,
  Scale,
  Sparkles,
  Sprout,
  Stethoscope,
  Users,
  Venus,
  type LucideIcon,
} from 'lucide-react'
import { richHtml } from '@/lib/cms/rich'
import type { PageContentMap } from '@/lib/cms/types'
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
  text,
} from '@/lib/cms/queries'
import type { Partner, Project, ProjectSection, TeamGroupKey, TeamMember } from '@/lib/cms/types'

export async function AboutPage() {
  const [content, values, partners] = await Promise.all([
    getPageContent('about'),
    getAboutValues(),
    getPartnersByContext('about'),
  ])

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
            <RichBody content={content} field="mission_body" />
          </Reveal>
        </section>

        <section className="vision-section">
          <Reveal className="site-container vision-inner">
            <p className="eyebrow">{text(content, 'vision_eyebrow')}</p>
            <h2>{text(content, 'vision_title')}</h2>
            <RichBody content={content} field="vision_body" />
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
              <RichBody content={content} field="partners_body" />
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
  const sections = await getProjectSections(project.id)
  const contexts = [project.partners_context, ...sections.map((s) => s.partners_context)].filter((c): c is string => !!c)
  const lists = await Promise.all(contexts.map((c) => getPartnersByContext(c)))
  const partners: Record<string, Partner[]> = Object.fromEntries(contexts.map((c, i) => [c, lists[i]]))
  return <ProjectFeatureView project={project} sections={sections} partners={partners} index={index} />
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

        <section className="partnerships-section" aria-labelledby="partnerships-title">
          <Reveal className="site-container partnerships-intro prose">
            <h2 id="partnerships-title">{text(content, 'partnerships_title')}</h2>
            <RichBody content={content} field="partnerships_intro" />
          </Reveal>
        </section>

        <section className="interest-section" aria-labelledby="interests-title">
          <div className="site-container">
            <Reveal className="section-heading">
              <h2 id="interests-title">{text(content, 'interests_title')}</h2>
            </Reveal>
            <div className="interest-grid">
              {interests.map((item, i) => {
                const Icon = interestIcon(item)
                return (
                  <Reveal delay={(i % 3) * 70} className={`interest-card tone-${i % INTEREST_TONES}`} key={item}>
                    <span className="interest-icon"><Icon aria-hidden="true" /></span>
                    <span className="interest-index" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
                    <p>{item}</p>
                  </Reveal>
                )
              })}
            </div>
            {text(content, 'interests_note') && (
              <Reveal className="interest-note">
                <Lightbulb aria-hidden="true" />
                <p>{text(content, 'interests_note')}</p>
              </Reveal>
            )}
          </div>
        </section>

        <section className="connect-section" aria-labelledby="connect-title">
          <div className="site-container connect-grid">
            <Reveal className="connect-card">
              <span className="connect-card-icon"><Handshake aria-hidden="true" /></span>
              <h2 id="connect-title">{text(content, 'connect_title')}</h2>
              <p className="connect-lead">{text(content, 'connect_lead')}</p>
              <ul className="connect-list">
                {connectItems.map((item) => (
                  <li key={item}>
                    <CircleCheck aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              {text(content, 'connect_note') && <p className="connect-note">{text(content, 'connect_note')}</p>}
            </Reveal>
            <Reveal delay={100} className="approach-card">
              <span className="connect-card-icon"><Sprout aria-hidden="true" /></span>
              <h2>{text(content, 'approach_title')}</h2>
              <div className="approach-body">
                <RichBody content={content} field="approach_body" />
              </div>
              {text(content, 'approach_note') && (
                <p className="approach-note">
                  <MessageCircle aria-hidden="true" />
                  <span>{text(content, 'approach_note')}</span>
                </p>
              )}
            </Reveal>
          </div>
        </section>

        <section className="contact-section" id="start-a-conversation">
          <div className="site-container contact-grid">
            <Reveal>
              <div className="section-heading">
                <h2>{text(content, 'start_title')}</h2>
                <RichBody content={content} field="start_body" />
              </div>
              <ul className="contact-details">
                {address.length > 0 && (
                  <li>
                    <span className="contact-detail-icon"><MapPin aria-hidden="true" /></span>
                    <div>
                      <strong>{address[0]}</strong>
                      {address.slice(1).map((line) => <span key={line}>{line}</span>)}
                    </div>
                  </li>
                )}
                {text(content, 'hours') && (
                  <li>
                    <span className="contact-detail-icon"><Clock aria-hidden="true" /></span>
                    <div>
                      <strong>Hours</strong>
                      <span>{text(content, 'hours')}</span>
                    </div>
                  </li>
                )}
                {email && (
                  <li className="contact-email">
                    <span className="contact-detail-icon"><Mail aria-hidden="true" /></span>
                    <div>
                      <strong>Email</strong>
                      <a href={`mailto:${email}`}>{email}</a>
                    </div>
                  </li>
                )}
              </ul>
              <div className="contact-cta">
                <a className="button button-primary" href="#send-a-message">{text(content, 'cta_label')}</a>
              </div>
            </Reveal>
            <Reveal delay={100} className="contact-form-card">
              <div className="form-heading" id="send-a-message">
                <h2>{text(content, 'form_title')}</h2>
                <p>{text(content, 'form_intro')}</p>
              </div>
              <ContactForm
                notice={text(content, 'sensitive_notice')}
                confirmationTitle={text(content, 'confirmation_title')}
                confirmationBody={text(content, 'confirmation_body')}
              />
            </Reveal>
          </div>
        </section>
      </main>
    </PageFrame>
  )
}

// Areas of Interest cards alternate theme teal and gold (see .tone-N in globals.css).
const INTEREST_TONES = 2

// Items are editable text, so icons are matched on keywords with a neutral fallback.
const INTEREST_ICONS: [RegExp, LucideIcon][] = [
  [/food/i, Apple],
  [/housing|poverty/i, House],
  [/rural|transport/i, Bus],
  [/workforce/i, Stethoscope],
  [/immigrant|refugee|newcomer|raciali[sz]ed/i, Globe2],
  [/women|gender/i, Venus],
  [/system|policy|access to care/i, Building2],
  [/equity|determinants/i, Scale],
  [/community/i, Users],
  [/health|well-being/i, HeartPulse],
]

function interestIcon(item: string): LucideIcon {
  return INTEREST_ICONS.find(([re]) => re.test(item))?.[1] ?? Sparkles
}

// Formatted text from the rich text editor (sanitized). `display: contents`
// keeps the paragraphs styled as direct children of the section.
function RichBody({ content, field }: { content: PageContentMap; field: string }) {
  const html = richHtml(content, field)
  return html ? <div className="rich-body pb-rich" dangerouslySetInnerHTML={{ __html: html }} /> : null
}
