import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { createInsForgeAdminClient, createInsForgeServerClient } from '@/lib/insforge/server'
import { applicationCutoff } from '@/lib/cms/posts-jobs'

// Résumés live in the private "form-uploads" bucket. Admins who can see job
// applications get a 5-minute signed link for an application that still exists.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? ''
  const admin = await getCurrentAdmin()
  if (!admin?.profile || !(canAccess(admin.profile, 'pages') || canAccess(admin.profile, 'contact'))) {
    return new NextResponse('Not allowed', { status: 403 })
  }
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse('Not found', { status: 404 })

  // Read through the signed-in user's client so row-level security applies.
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database.from('job_applications').select('resume_key, created_at').eq('id', id).maybeSingle()
  const row = data as { resume_key: string | null; created_at: string } | null
  if (!row?.resume_key || row.created_at < applicationCutoff()) return new NextResponse('Not found', { status: 404 })

  const { data: signed, error } = await createInsForgeAdminClient().storage.from('form-uploads').createSignedUrl(row.resume_key, 300)
  if (error || !signed) return new NextResponse('File unavailable', { status: 404 })
  return NextResponse.redirect(signed.signedUrl)
}
