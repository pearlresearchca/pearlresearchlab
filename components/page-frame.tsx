import { SiteFooter, SiteHeader } from './site-shell'
import { getPageContent, text } from '@/lib/cms/queries'

export async function PageFrame({ children }: { children: React.ReactNode }) {
  const global = await getPageContent('global')
  return (
    <>
      <SiteHeader logoUrl={global.brand_logo?.value ?? ''} />
      <div className="page-transition">{children}</div>
      <SiteFooter
        blurb={text(global, 'footer_blurb')}
        tagline={text(global, 'footer_tagline')}
        copyright={text(global, 'copyright_line')}
      />
    </>
  )
}
