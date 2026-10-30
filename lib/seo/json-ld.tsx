// Structured data (schema.org JSON-LD) for search engines. "<" is escaped so
// content can never close the script tag.
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\u003c') }} />
}

export const SITE_URL = 'https://pearlresearchlab.vercel.app'
export const ORG_NAME = 'PEARL — Population Health Equity Advocacy Research Lab'

export const ORGANIZATION = {
  '@type': 'ResearchOrganization',
  '@id': `${SITE_URL}/#organization`,
  name: ORG_NAME,
  alternateName: 'PEARL Research Lab',
  url: SITE_URL,
  logo: `${SITE_URL}/opengraph-image`,
  parentOrganization: { '@type': 'CollegeOrUniversity', name: 'St. Francis Xavier University', url: 'https://www.stfx.ca' },
  address: { '@type': 'PostalAddress', addressLocality: 'Antigonish', addressRegion: 'NS', addressCountry: 'CA' },
}

export function breadcrumbs(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: `${SITE_URL}${item.path}` })),
  }
}

// Dr. Khakpour's profile (shown on /portfolio), from her CV.
export const PORTFOLIO_PERSON = {
  '@type': 'Person',
  '@id': `${SITE_URL}/portfolio#person`,
  name: 'Mahasti Khakpour',
  honorificPrefix: 'Dr.',
  honorificSuffix: 'PhD',
  jobTitle: 'Assistant Professor (Tenure-Track), Interdisciplinary Health Program',
  email: 'mailto:mkhakpou@stfx.ca',
  url: `${SITE_URL}/portfolio`,
  image: 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fdr.-mahasti-khakpour.png?v=cf152e47268367b781cbf9cfc141726b',
  worksFor: [{ '@type': 'CollegeOrUniversity', name: 'St. Francis Xavier University', url: 'https://www.stfx.ca' }, { '@id': `${SITE_URL}/#organization` }],
  alumniOf: [{ '@type': 'CollegeOrUniversity', name: 'University of Saskatchewan' }, { '@type': 'CollegeOrUniversity', name: 'Shahid Beheshti University' }],
  affiliation: [{ '@type': 'Organization', name: 'Maritime SPOR SUPPORT Unit' }, { '@type': 'Organization', name: 'Nova Scotia Health' }],
  knowsAbout: ['Health systems analysis', 'Health equity', 'Health policy and governance', 'Health workforce integration and retention', 'Interfacility patient transfers', 'Food security', 'Food systems', 'Refugee health', 'Community-engaged research', 'Realist evaluation'],
}
