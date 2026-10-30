export type ContentValueType = 'text' | 'prose' | 'image'

// Optional because not every query selects these columns (e.g. public-facing
// reads skip them to keep responses small) — present whenever the admin
// queries below fetch them, so admin UI can show "last edited by / at".
export type Editable = {
  updated_at?: string
  updated_by?: string | null
}

export type PageContentRow = Editable & {
  id: string
  page: string
  key: string
  value_type: ContentValueType
  value: string | null
  image_key: string | null
}

export type PageContentMap = Record<string, PageContentRow>

export type ResearchArea = Editable & {
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

export type AboutValue = Editable & {
  id: string
  letter: string
  title: string
  body: string
  sort_order: number
}

export type Partner = Editable & {
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

export type Project = Editable & {
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

export type ProjectSection = Editable & {
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

export type TeamMember = Editable & {
  id: string
  name: string
  role: string
  image_url: string | null
  image_key: string | null
  bio_paragraphs: string[]
  // Optional page the member's name links to (site path or https:// URL).
  profile_url?: string | null
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
  sections: string[]
  created_at: string
  phone?: string | null
  job_title?: string | null
  bio?: string | null
  profile_completed_at?: string | null
}

export type UserDirectory = Record<string, { email: string; full_name: string | null }>

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

export type BlogPost = Editable & {
  id: string
  title: string
  slug: string
  excerpt: string
  body_html: string
  cover_image_url: string | null
  cover_image_key: string | null
  author: string
  category: string
  status: 'draft' | 'published'
  featured: boolean
  // Visual style key (lib/blog/blocks.ts POST_STYLES) and content blocks.
  style: string
  blocks: import('@/lib/blog/blocks').PostBlock[]
  published_at: string | null
  created_at: string
}

export type JobPosting = Editable & {
  id: string
  title: string
  slug: string
  team: string
  location: string
  employment_type: string
  summary: string
  description_html: string
  status: 'draft' | 'open' | 'closed'
  closes_on: string | null
  sort_order: number
  created_at: string
}

export type JobApplication = {
  id: string
  job_id: string
  name: string
  email: string
  phone: string
  profile_url: string
  message: string
  resume_key: string | null
  resume_name: string | null
  is_read: boolean
  created_at: string
}

export type DailyMetric = { kind: 'post' | 'job'; item_id: string; day: string; views: number; applications: number }
