import Link from 'next/link'
import { ArrowUpRight, Leaf, Network, Scale, HeartPulse } from 'lucide-react'
import { ArrowLink, PageFrame, SectionHeading } from '@/components/site-shell'
import { asset } from '@/lib/pearl-assets'
import { Reveal } from '@/components/reveal'
import { HeroTilt } from '@/components/hero-tilt'
import { PartnerLogoMarquee, type Logo } from '@/components/partner-logos'

const streams = [
  { title: 'Health systems & services', text: 'Improving how care is organized, delivered, and experienced to strengthen access, quality, and equity.', icon: HeartPulse },
  { title: 'Health equity & access to care', text: 'Addressing structural and social barriers that shape health outcomes and healthcare access.', icon: Scale },
  { title: 'Transforming food systems', text: 'Exploring sustainable, equitable, and resilient food systems that support food security and wellbeing.', icon: Leaf },
  { title: 'Patient & community engagement', text: 'Partnering with communities to ensure research reflects lived experience and local priorities.', icon: Network },
]

const partners: Logo[] = [
  { file: 'Partners.png', alt: 'St. Francis Xavier University' },
  { file: 'Partners (2).png', alt: 'Acadia University' },
  { file: 'Partners (3).png', alt: 'Second Harvest' },
  { file: 'Partners (6).png', alt: 'Mount Saint Vincent University' },
  { file: 'dalhouse.png', alt: 'Dalhousie University' },
  { file: 'EHS.png', alt: 'Emergency Health Services' },
  { file: 'NV Health.png', alt: 'Nova Scotia Health' },
  { file: 'Partners (5).png', alt: 'FarmWorks Investment Co-operative' },
]

export default function HomePage() {
  return (
    <PageFrame>
      <main>
        <section className="home-hero">
          <div className="site-container hero-grid">
            <div className="hero-content">
              <p className="eyebrow">Public health equity advocacy research lab</p>
              <h1>Evidence that moves communities forward.</h1>
              <p className="hero-intro">PEARL brings people, systems, and research together to advance healthier, more equitable communities.</p>
              <div className="hero-actions">
                <Link href="/research" className="button button-primary">Explore our research <ArrowUpRight aria-hidden="true" /></Link>
                <Link href="/about" className="text-link">About PEARL</Link>
              </div>
            </div>
            <HeroTilt>
              <div className="hero-image-wrap">
                <img src={asset('Patient & Community Engagement.png')} alt="Hands joined together, representing PEARL's community-engaged research" className="hero-image" />
                <div className="image-caption">
                  <span>Community-engaged research in action</span>
                  <span>Antigonish, Nova Scotia</span>
                </div>
              </div>
            </HeroTilt>
          </div>
        </section>

        <section className="statement-section">
          <Reveal className="site-container statement-grid">
            <p className="eyebrow">Our purpose</p>
            <div>
              <h2>Health equity is not an outcome we wait for. It is a practice we build into every question, partnership, and decision.</h2>
              <ArrowLink href="/about">Discover our approach</ArrowLink>
            </div>
          </Reveal>
        </section>

        <section className="streams-section">
          <div className="site-container">
            <SectionHeading kicker="Research at a glance" title="Five connected streams. One shared commitment." body="Our interdisciplinary work examines the systems and conditions that influence health — and turns evidence into meaningful action." />
            <div className="stream-grid">
              {streams.map(({ title, text, icon: Icon }, index) => (
                <Reveal className="stream-card" delay={index * 70} key={title}>
                  <span className="stream-number">0{index + 1}</span>
                  <Icon className="stream-icon" aria-hidden="true" />
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <ArrowLink href="/research">Learn more</ArrowLink>
                </Reveal>
              ))}
            </div>
            <Reveal className="center-link">
              <ArrowLink href="/research">View all research areas</ArrowLink>
            </Reveal>
          </div>
        </section>

        <section className="feature-section">
          <Reveal className="site-container feature-grid">
            <img src={asset('Transforming Food Systems.jpeg')} alt="Researcher working with fresh produce in a field" />
            <div>
              <p className="eyebrow">Featured project</p>
              <h2>Surplus to Solutions</h2>
              <p>Understanding how avoidable food waste is generated and managed at the farm level — and how good food can reach communities instead.</p>
              <ArrowLink href="/projects">Explore the project</ArrowLink>
            </div>
          </Reveal>
        </section>

        <section className="partners-strip">
          <div className="site-container">
            <Reveal className="partners-strip-heading">
              <p className="eyebrow">Working alongside</p>
            </Reveal>
            <PartnerLogoMarquee logos={partners} />
          </div>
        </section>

        <section className="cta-section">
          <Reveal className="site-container cta-inner">
            <p className="eyebrow">Build better health together</p>
            <h2>Have a question, an idea, or a shared challenge?</h2>
            <p>We welcome collaborations across Canada and internationally.</p>
            <Link href="/contact" className="button button-light">Connect with PEARL <ArrowUpRight aria-hidden="true" /></Link>
          </Reveal>
        </section>
      </main>
    </PageFrame>
  )
}
