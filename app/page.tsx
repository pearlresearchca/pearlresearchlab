import Link from 'next/link'
import { ArrowUpRight, HeartPulse, Landmark, Leaf, Network, Scale, type LucideIcon } from 'lucide-react'
import { ArrowLink, SectionHeading } from '@/components/site-shell'
import { PageFrame } from '@/components/page-frame'
import { Reveal } from '@/components/reveal'
import { HeroTilt } from '@/components/hero-tilt'
import { PartnerLogoMarquee } from '@/components/partner-logos'
import { CmsImage } from '@/components/cms-image'
import { anchorId } from '@/lib/cms/format'
import { getAllPartners, getPageContent, getPartnersByContext, getProjects, getResearchAreas, getTeamMembers, image, text } from '@/lib/cms/queries'

const ICONS: Record<string, LucideIcon> = { HeartPulse, Scale, Leaf, Network, Landmark }

export default async function HomePage() {
  const [content, streams, partners, allPartners, projects, team] = await Promise.all([
    getPageContent('home'),
    getResearchAreas(),
    getPartnersByContext('home'),
    getAllPartners(),
    getProjects(true),
    getTeamMembers(),
  ])

  // Live counts from the CMS, so the hero's proof points never go stale.
  const stats = [
    { value: streams.length, label: 'Research streams' },
    { value: projects.length, label: 'Active projects' },
    { value: allPartners.length, label: 'Partner organizations' },
    { value: team.filter((m) => m.group_key !== 'past').length, label: 'Researchers & students' },
  ].filter((s) => s.value > 0)

  const homeStreams = streams.filter((s) => s.show_on_home)
  const heroImage = image(content, 'hero_image')
  const featureImage = image(content, 'feature_image')

  return (
    <PageFrame>
      <main>
        <section className="home-hero">
          <div className="site-container hero-grid">
            <div className="hero-content">
              <p className="eyebrow">{text(content, 'hero_eyebrow')}</p>
              <h1>{text(content, 'hero_title')}</h1>
              <p className="hero-intro">{text(content, 'hero_intro')}</p>
              <div className="hero-actions">
                <Link href="/research" className="button button-primary">Explore our research <ArrowUpRight aria-hidden="true" /></Link>
                <Link href="/about" className="text-link">About PEARL</Link>
              </div>
              {stats.length > 0 && (
                <dl className="hero-stats">
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      <dt>{stat.label}</dt>
                      <dd>{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
            <HeroTilt>
              <div className="hero-image-wrap">
                {heroImage && <CmsImage src={heroImage.url} alt="PEARL researchers and community partners at a local farm" className="hero-image" sizes="(max-width: 900px) 100vw, 560px" eager />}
                <div className="image-caption">
                  <span>{text(content, 'hero_image_caption_1')}</span>
                  <span>{text(content, 'hero_image_caption_2')}</span>
                </div>
              </div>
            </HeroTilt>
          </div>
        </section>

        <section className="statement-section">
          <Reveal className="site-container statement-grid">
            <p className="eyebrow">{text(content, 'statement_eyebrow')}</p>
            <div>
              <h2>{text(content, 'statement_title')}</h2>
              <ArrowLink href="/about">Discover our approach</ArrowLink>
            </div>
          </Reveal>
        </section>

        <section className="streams-section">
          <div className="site-container">
            <SectionHeading kicker={text(content, 'streams_eyebrow')} title={text(content, 'streams_title')} body={text(content, 'streams_body')} />
            <div className="stream-grid" style={{ '--stream-count': homeStreams.length } as React.CSSProperties}>
              {homeStreams.map((stream, index) => {
                const Icon = (stream.icon_name && ICONS[stream.icon_name]) || Landmark
                return (
                  <Reveal className="stream-card" delay={index * 70} key={stream.id}>
                    <span className="stream-number">{String(index + 1).padStart(2, '0')}</span>
                    <Icon className="stream-icon" aria-hidden="true" />
                    <h3>
                      <Link href={`/research#${anchorId(stream.title)}`} className="stream-card-link">{stream.title}</Link>
                    </h3>
                    <p>{stream.home_summary || stream.summary}</p>
                    <span className="arrow-link" aria-hidden="true">Learn more<ArrowUpRight /></span>
                  </Reveal>
                )
              })}
            </div>
            <Reveal className="center-link">
              <ArrowLink href="/research">View all research areas</ArrowLink>
            </Reveal>
          </div>
        </section>

        <section className="feature-section">
          <Reveal className="site-container feature-grid">
            {featureImage && <CmsImage src={featureImage.url} alt="A PEARL researcher at a community garden plot" sizes="(max-width: 900px) 100vw, 680px" />}
            <div>
              <p className="eyebrow">{text(content, 'feature_eyebrow')}</p>
              <h2>{text(content, 'feature_title')}</h2>
              <p>{text(content, 'feature_text')}</p>
              <ArrowLink href="/projects">Explore the project</ArrowLink>
            </div>
          </Reveal>
        </section>

        <section className="partners-strip">
          <div className="site-container">
            <Reveal className="partners-strip-heading">
              <p className="eyebrow">{text(content, 'partners_eyebrow')}</p>
            </Reveal>
            <PartnerLogoMarquee logos={partners} />
          </div>
        </section>

        <section className="cta-section">
          <Reveal className="site-container cta-inner">
            <p className="eyebrow">{text(content, 'cta_eyebrow')}</p>
            <h2>{text(content, 'cta_title')}</h2>
            <p>{text(content, 'cta_text')}</p>
            <Link href="/contact" className="button button-light">Connect with PEARL <ArrowUpRight aria-hidden="true" /></Link>
          </Reveal>
        </section>
      </main>
    </PageFrame>
  )
}
