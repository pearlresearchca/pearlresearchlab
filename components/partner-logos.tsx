import type { Partner } from '@/lib/cms/types'

export type Logo = Partner

function LogoImg({ image_url, name, decorative = false }: Logo & { decorative?: boolean }) {
  return <img src={image_url} alt={decorative ? '' : name} loading="lazy" />
}

export function PartnerLogoGrid({ logos }: { logos: Logo[] }) {
  return (
    <div className="logo-grid">
      {logos.map((logo) => (
        <div className="logo-grid-item" key={logo.id}>
          <LogoImg {...logo} />
        </div>
      ))}
    </div>
  )
}

export function PartnerLogoRow({ logos }: { logos: Logo[] }) {
  return (
    <div className="logo-row">
      {logos.map((logo) => (
        <div className="logo-row-item" key={logo.id}>
          <LogoImg {...logo} />
        </div>
      ))}
    </div>
  )
}

export function PartnerLogoMarquee({ logos }: { logos: Logo[] }) {
  return (
    <div className="logo-marquee" role="list" aria-label="Partner organizations">
      <div className="logo-marquee-track">
        {logos.map((logo) => (
          <div className="logo-marquee-item" key={logo.id} role="listitem">
            <LogoImg {...logo} />
          </div>
        ))}
        {/* Second copy only exists to make the scroll loop seamless. */}
        {logos.map((logo) => (
          <div className="logo-marquee-item" key={`${logo.id}-loop`} aria-hidden="true">
            <LogoImg {...logo} decorative />
          </div>
        ))}
      </div>
    </div>
  )
}
