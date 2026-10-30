import { NextResponse, type NextRequest } from 'next/server'
import { purgeExpiredApplications } from '@/lib/jobs/purge'

// Daily clean-up of expired job applications and their résumé files
// (scheduled in vercel.json). Vercel Cron sends "Bearer <CRON_SECRET>".
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new NextResponse('Not allowed', { status: 401 })
  }
  const result = await purgeExpiredApplications()
  return NextResponse.json(result)
}
