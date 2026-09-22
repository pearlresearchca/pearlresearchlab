import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AlertTriangle, BarChart3, Clock, Eye, MousePointerClick, Sparkles, Users } from 'lucide-react'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { getGA4Report, isGA4Configured, type RangeDays } from '@/lib/analytics/ga4'
import { formatDuration } from '@/lib/cms/format'
import { AdminCard } from '@/components/admin/ui'
import { BarList, DonutChart, TrafficChart } from '@/components/admin/analytics-charts'

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-1.5 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function RangeSwitcher({ active }: { active: RangeDays }) {
  const options: RangeDays[] = [7, 30, 90]
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
      {options.map((r) => (
        <Link
          key={r}
          href={`/admin/analytics?range=${r}`}
          className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
            r === active ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {r}D
        </Link>
      ))}
    </div>
  )
}

function SetupGuide() {
  return (
    <AdminCard title="Connect Google Analytics" icon={<Sparkles className="size-4" aria-hidden="true" />}>
      <p className="text-sm text-muted-foreground">
        This dashboard reads live traffic from your GA4 property. Two things need to be set up once, both free:
      </p>
      <ol className="mt-4 flex flex-col gap-4 text-sm text-foreground">
        <li className="flex gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
          <div>
            <p className="font-medium">Create a GA4 property and get the tracking ID</p>
            <p className="mt-0.5 text-muted-foreground">
              Go to <span className="font-mono">analytics.google.com</span> → Admin → create a property for your site → Data Streams → add a Web stream with your site URL.
              Copy the <span className="font-mono">Measurement ID</span> (looks like <span className="font-mono">G-XXXXXXX</span>).
              Add it to <span className="font-mono">.env.local</span> as <span className="font-mono">NEXT_PUBLIC_GA_MEASUREMENT_ID</span> — this makes the site start sending traffic data.
            </p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
          <div>
            <p className="font-medium">Let this dashboard read that data</p>
            <p className="mt-0.5 text-muted-foreground">
              In <span className="font-mono">console.cloud.google.com</span>: create a project → enable the &ldquo;Google Analytics Data API&rdquo; → create a Service Account →
              create a JSON key for it. In GA4 → Admin → Property Access Management, add that service account&apos;s email as a <span className="font-mono">Viewer</span>.
              Then add three values to <span className="font-mono">.env.local</span>:
            </p>
            <ul className="mt-2 flex flex-col gap-1 rounded-lg bg-muted/50 p-3 font-mono text-xs text-muted-foreground">
              <li>GOOGLE_ANALYTICS_PROPERTY_ID=your numeric GA4 property ID</li>
              <li>GOOGLE_SERVICE_ACCOUNT_EMAIL=the service account&apos;s email</li>
              <li>GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=the private_key from the JSON file</li>
            </ul>
            <p className="mt-2 text-muted-foreground">
              The private key is multi-line — paste it as one line with <span className="font-mono">\n</span> in place of real line breaks (that&apos;s how it already looks inside the downloaded JSON file&apos;s <span className="font-mono">private_key</span> field, so you can usually copy it as-is).
            </p>
          </div>
        </li>
      </ol>
      <p className="mt-4 text-sm text-muted-foreground">Once both are set, restart the app and this page will fill in automatically — no code changes needed.</p>
    </AdminCard>
  )
}

export default async function AnalyticsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const admin = await getCurrentAdmin()
  if (!admin || admin.profile?.role !== 'admin') redirect('/admin')

  const { range } = await searchParams
  const days = ([7, 30, 90].includes(Number(range)) ? Number(range) : 30) as RangeDays

  if (!isGA4Configured()) {
    return (
      <div className="flex flex-col gap-6">
        <Header days={days} configured={false} />
        <SetupGuide />
      </div>
    )
  }

  try {
    const report = await getGA4Report(days)

    return (
      <div className="flex flex-col gap-6">
        <Header days={days} configured />

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          <StatCard icon={Users} label="Active users" value={report.overview.activeUsers.toLocaleString()} />
          <StatCard icon={Sparkles} label="New users" value={report.overview.newUsers.toLocaleString()} />
          <StatCard icon={MousePointerClick} label="Sessions" value={report.overview.sessions.toLocaleString()} />
          <StatCard icon={Eye} label="Page views" value={report.overview.pageViews.toLocaleString()} />
          <StatCard icon={Clock} label="Avg. session" value={formatDuration(report.overview.avgSessionSeconds)} />
          <StatCard icon={BarChart3} label="Bounce rate" value={`${report.overview.bounceRate.toFixed(1)}%`} />
        </div>

        <AdminCard title="Traffic over time" description={`Page views and users, last ${days} days`}>
          <TrafficChart data={report.timeSeries} />
        </AdminCard>

        <div className="grid grid-cols-2 gap-6">
          <AdminCard title="Top pages">
            <BarList data={report.topPages} />
          </AdminCard>
          <AdminCard title="Traffic sources">
            <DonutChart data={report.trafficSources} />
          </AdminCard>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <AdminCard title="Devices">
            <DonutChart data={report.devices} />
          </AdminCard>
          <AdminCard title="Top countries">
            <BarList data={report.topCountries} />
          </AdminCard>
        </div>

        <AdminCard title="Avg. time on page" description="Seconds spent per page, by average">
          <BarList data={report.timeOnPage} unit="duration" />
        </AdminCard>
      </div>
    )
  } catch (error) {
    return (
      <div className="flex flex-col gap-6">
        <Header days={days} configured />
        <AdminCard title="Couldn't load Google Analytics" icon={<AlertTriangle className="size-4" aria-hidden="true" />}>
          <p className="text-sm text-muted-foreground">
            The credentials are set, but the request to Google failed. Double-check that the service account has Viewer access on the GA4 property, that the property ID is correct, and that the private key was pasted without extra quotes.
          </p>
          <p className="mt-3 rounded-lg bg-muted/50 p-3 font-mono text-xs text-red-700">{error instanceof Error ? error.message : String(error)}</p>
        </AdminCard>
      </div>
    )
  }
}

function Header({ days, configured }: { days: RangeDays; configured: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <BarChart3 className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Analytics</h1>
          <p className="text-sm text-muted-foreground">Website traffic from Google Analytics (GA4)</p>
        </div>
      </div>
      {configured && <RangeSwitcher active={days} />}
    </div>
  )
}
