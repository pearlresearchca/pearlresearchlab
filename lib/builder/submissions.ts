import type { EmailLog } from '@/lib/email/form-notifications'

export type Submission = {
  id: string
  page_id: string | null
  form_name: string
  data: { label: string; kind: string; value: string; fileKey?: string; fileName?: string }[]
  is_read: boolean
  email_log?: EmailLog
  created_at: string
}
