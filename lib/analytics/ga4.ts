import { BetaAnalyticsDataClient } from '@google-analytics/data'

export type RangeDays = 7 | 30 | 90

export function isGA4Configured(): boolean {
  return Boolean(process.env.GOOGLE_ANALYTICS_PROPERTY_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
}

function client(): BetaAnalyticsDataClient {
  const privateKey = (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? '').replace(/\\n/g, '\n')
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
  })
}

function propertyPath(): string {
  const id = process.env.GOOGLE_ANALYTICS_PROPERTY_ID ?? ''
  return `properties/${id.replace(/^properties\//, '')}`
}

function metricValue(row: { metricValues?: { value?: string | null }[] | null } | undefined, i: number): number {
  return Number(row?.metricValues?.[i]?.value ?? 0)
}

function dimensionValue(row: { dimensionValues?: { value?: string | null }[] | null } | undefined, i: number): string {
  return row?.dimensionValues?.[i]?.value ?? ''
}

export type Overview = {
  activeUsers: number
  newUsers: number
  sessions: number
  pageViews: number
  avgSessionSeconds: number
  bounceRate: number
}

export type DayPoint = { date: string; pageViews: number; users: number }
export type TopItem = { label: string; value: number }

export type GA4Report = {
  overview: Overview
  timeSeries: DayPoint[]
  topPages: TopItem[]
  timeOnPage: TopItem[]
  trafficSources: TopItem[]
  devices: TopItem[]
  topCountries: TopItem[]
}

function formatDate(raw: string): string {
  // GA4 returns YYYYMMDD for the `date` dimension.
  if (!/^\d{8}$/.test(raw)) return raw
  return `${raw.slice(4, 6)}/${raw.slice(6, 8)}`
}

export async function getGA4Report(days: RangeDays): Promise<GA4Report> {
  const c = client()
  const property = propertyPath()
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: 'today' }]

  const [overviewResp, seriesResp, pagesResp, timeOnPageResp, sourcesResp, devicesResp, countriesResp] = await Promise.all([
    c.runReport({
      property,
      dateRanges,
      metrics: [
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
    }),
    c.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    }),
    c.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 8,
    }),
    c.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'averageSessionDuration' }],
      orderBys: [{ metric: { metricName: 'averageSessionDuration' }, desc: true }],
      limit: 8,
    }),
    c.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 8,
    }),
    c.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    }),
    c.runReport({
      property,
      dateRanges,
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 8,
    }),
  ])

  const overviewRow = overviewResp[0].rows?.[0]
  const overview: Overview = {
    activeUsers: metricValue(overviewRow, 0),
    newUsers: metricValue(overviewRow, 1),
    sessions: metricValue(overviewRow, 2),
    pageViews: metricValue(overviewRow, 3),
    avgSessionSeconds: metricValue(overviewRow, 4),
    bounceRate: metricValue(overviewRow, 5) * 100,
  }

  const timeSeries: DayPoint[] = (seriesResp[0].rows ?? []).map((row) => ({
    date: formatDate(dimensionValue(row, 0)),
    pageViews: metricValue(row, 0),
    users: metricValue(row, 1),
  }))

  const topPages: TopItem[] = (pagesResp[0].rows ?? []).map((row) => ({
    label: dimensionValue(row, 0) || '/',
    value: metricValue(row, 0),
  }))

  const timeOnPage: TopItem[] = (timeOnPageResp[0].rows ?? []).map((row) => ({
    label: dimensionValue(row, 0) || '/',
    value: Math.round(metricValue(row, 0)),
  }))

  const trafficSources: TopItem[] = (sourcesResp[0].rows ?? []).map((row) => ({
    label: dimensionValue(row, 0) || 'Other',
    value: metricValue(row, 0),
  }))

  const devices: TopItem[] = (devicesResp[0].rows ?? []).map((row) => ({
    label: dimensionValue(row, 0) || 'Other',
    value: metricValue(row, 0),
  }))

  const topCountries: TopItem[] = (countriesResp[0].rows ?? []).map((row) => ({
    label: dimensionValue(row, 0) || 'Unknown',
    value: metricValue(row, 0),
  }))

  return { overview, timeSeries, topPages, timeOnPage, trafficSources, devices, topCountries }
}
