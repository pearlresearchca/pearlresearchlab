export type Submission = {
  id: string
  page_id: string | null
  form_name: string
  data: { label: string; kind: string; value: string; fileKey?: string; fileName?: string }[]
  is_read: boolean
  created_at: string
}
