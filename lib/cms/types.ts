export type ContentValueType = 'text' | 'prose' | 'image'

export type PageContentRow = {
  id: string
  page: string
  key: string
  value_type: ContentValueType
  value: string | null
  image_key: string | null
}

export type PageContentMap = Record<string, PageContentRow>

export type ResearchArea = {
  id: string
  title: string
  summary: string
  home_summary: string | null
  icon_name: string | null
  image_url: string | null
  image_key: string | null
  show_on_home: boolean
  sort_order: number
}

export type AboutValue = {
  id: string
  letter: string
  title: string
  body: string
  sort_order: number
}

export type Partner = {
  id: string
  name: string
  image_url: string
  image_key: string
}

export type PartnerPlacement = {
  id: string
  partner_id: string
  context: string
  sort_order: number
  partners: Partner
}

export type Project = {
  id: string
  slug: string
  index_label: string | null
  category_label: string | null
  title: string
  project_name: string | null
  subtitle: string | null
  meta_line: string[]
  banner_image_url: string | null
  banner_image_key: string | null
  intro_paragraphs: string[]
  partners_context: string | null
  published: boolean
  sort_order: number
}

export type ProjectSection = {
  id: string
  project_id: string
  heading: string
  body_paragraphs: string[]
  image_url: string | null
  image_key: string | null
  partners_context: string | null
  sort_order: number
}

export type TeamGroupKey = 'leadership' | 'tfs' | 'ift' | 'past'

export type TeamMember = {
  id: string
  name: string
  role: string
  image_url: string | null
  image_key: string | null
  bio_paragraphs: string[]
  group_key: TeamGroupKey
  active: boolean
  sort_order: number
}

export type AppUserRole = 'admin' | 'editor'

export type AppUser = {
  id: string
  email: string
  full_name: string | null
  role: AppUserRole
  created_at: string
}

export type AuditLogEntry = {
  id: string
  table_name: string
  record_id: string | null
  action: 'insert' | 'update' | 'delete'
  changed_by: string | null
  changed_by_email: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  changed_at: string
}
