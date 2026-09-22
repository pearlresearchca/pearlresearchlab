import Link from 'next/link'
import { ArrowUpRight, HeartPulse, Landmark, Leaf, Network, Scale, type LucideIcon } from 'lucide-react'
import { ArrowLink, SectionHeading } from '@/components/site-shell'
import { PageFrame } from '@/components/page-frame'
import { Reveal } from '@/components/reveal'
import { HeroTilt } from '@/components/hero-tilt'
import { PartnerLogoMarquee } from '@/components/partner-logos'
import { getPageContent, getPartnersByContext, getResearchAreas, image, text } from '@/lib/cms/queries'
import { livePageMetadata, renderLivePage } from '@/lib/builder/public'

const ICONS: Record<string, LucideIcon> = { HeartPulse, Scale, Leaf, Network, Landmark }

export function generateMetadata() {
  return livePageMetadata({ legacyKey: 'home' })
}

export default async function HomePage() {
  // Published page-builder version wins; otherwise the original homepage.
  const builder = await renderLivePage({ legacyKey: 'home' })
  if (builder) return builder

  const [content, streams, partners] = await Promise.all([
    getPageContent('home'),
    getResearchAreas(),
    getPartnersByContext('home'),
  ])

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
            </div>
            <HeroTilt>
              <div className="hero-image-wrap">
                {heroImage && <img src={heroImage.url} alt="Hands joined together, representing PEARL's community-engaged research" className="hero-image" />}
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
            <div className="stream-grid">
              {homeStreams.map((stream, index) => {
                const Icon = (stream.icon_name && ICONS[stream.icon_name]) || HeartPulse
                return (
                  <Reveal className="stream-card" delay={index * 70} key={stream.id}>
                    <span className="stream-number">0{index + 1}</span>
                    <Icon className="stream-icon" aria-hidden="true" />
                    <h3>{stream.title}</h3>
                    <p>{stream.home_summary || stream.summary}</p>
                    <ArrowLink href="/research">Learn more</ArrowLink>
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
            {featureImage && <img src={featureImage.url} alt="Researcher working with fresh produce in a field" />}
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
