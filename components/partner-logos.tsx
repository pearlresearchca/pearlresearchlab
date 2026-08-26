import { asset } from '@/lib/pearl-assets'

export type Logo = { file: string; alt: string }

function LogoImg({ file, alt }: Logo) {
  return <img src={asset(file)} alt={alt} loading="lazy" />
}

export function PartnerLogoGrid({ logos }: { logos: Logo[] }) {
  return (
    <div className="logo-grid">
      {logos.map((logo) => (
        <div className="logo-grid-item" key={logo.file}>
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
        <div className="logo-row-item" key={logo.file}>
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
        {[...logos, ...logos].map((logo, i) => (
          <div className="logo-marquee-item" key={`${logo.file}-${i}`} role="listitem">
            <LogoImg {...logo} />
          </div>
        ))}
      </div>
    </div>
  )
}
