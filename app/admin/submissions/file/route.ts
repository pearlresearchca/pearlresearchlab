import { NextResponse, type NextRequest } from 'next/server'
import { getCurrentAdmin } from '@/lib/cms/auth'
import { canAccess } from '@/lib/cms/permissions'
import { createInsForgeAdminClient, createInsForgeServerClient } from '@/lib/insforge/server'

// Files attached to form submissions live in a private bucket. Admins get a
// short-lived signed link, and only for keys that belong to a submission
// they're allowed to see.
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key') ?? ''
  const admin = await getCurrentAdmin()
  if (!admin?.profile || !(canAccess(admin.profile, 'pages') || canAccess(admin.profile, 'contact'))) {
    return new NextResponse('Not allowed', { status: 403 })
  }
  const insforge = await createInsForgeServerClient()
  const { data } = await insforge.database.from('cms_form_submissions').select('id, data').limit(1000)
  const known = ((data ?? []) as { data: { fileKey?: string }[] }[]).some((s) => s.data.some((f) => f.fileKey === key))
  if (!key || !known) return new NextResponse('Not found', { status: 404 })

  const { data: signed, error } = await createInsForgeAdminClient().storage.from('form-uploads').createSignedUrl(key, 300)
  if (error || !signed) return new NextResponse('File unavailable', { status: 404 })
  return NextResponse.redirect(signed.signedUrl)
}
