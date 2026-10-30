import { createInsForgeAdminClient } from '@/lib/insforge/server'
import { applicationCutoff } from '@/lib/cms/posts-jobs'

// Removes job applications older than the retention period and deletes the
// résumé files of every removed application from private storage.
//
// Deleting a row queues its file (database trigger), and a nightly InsForge
// schedule ("Purge expired job applications") deletes expired rows even if the
// app is idle — this routine finishes the job by clearing the queued files. It runs after each new application,
// when admins open Job openings, and from the daily cron route.
export async function purgeExpiredApplications(): Promise<{ applications: number; files: number }> {
  const admin = createInsForgeAdminClient()
  const expired = await admin.database.from('job_applications').delete().lt('created_at', applicationCutoff()).select('id')
  const applications = (expired.data ?? []).length

  let files = 0
  const { data: queued } = await admin.database.from('job_application_file_purges').select('resume_key').limit(200)
  for (const { resume_key } of (queued ?? []) as { resume_key: string }[]) {
    const { error } = await admin.storage.from('form-uploads').remove(resume_key)
    // A file that's already gone counts as removed.
    if (!error || /not.?found|404/i.test(error.message ?? '')) {
      await admin.database.from('job_application_file_purges').delete().eq('resume_key', resume_key)
      files++
    }
  }
  return { applications, files }
}
