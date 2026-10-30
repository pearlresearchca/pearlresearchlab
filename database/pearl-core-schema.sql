-- PEARL Research Lab — database core schema (structure only)
-- Generated 2026-10-30T19:20:26.956Z by scripts/db-export.mjs
--
-- Restores the public schema into an InsForge (or any Supabase-style) Postgres
-- that already provides: the auth schema (auth.users, auth.uid()), the
-- system.update_updated_at() trigger function and the anon / authenticated
-- roles. See database/README.md.

SET client_min_messages = warning;
SET check_function_bodies = off;
SET search_path = public, pg_catalog;
BEGIN;

-- ==========================================================================
-- Functions
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.can_edit_page(legacy text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
  SELECT public.has_section('pages')
      OR public.has_section('seo')
      OR (legacy IS NOT NULL AND public.has_section(legacy));
$function$;

CREATE OR REPLACE FUNCTION public.cms_pages_bump_version()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cms_prune_revisions()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
BEGIN
  DELETE FROM public.cms_page_revisions
  WHERE page_id = NEW.page_id
    AND id NOT IN (
      SELECT id FROM public.cms_page_revisions
      WHERE page_id = NEW.page_id
      ORDER BY created_at DESC
      LIMIT 40
    );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cms_revision_author()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.created_by := auth.uid();
  SELECT email INTO NEW.created_by_email FROM public.app_users WHERE id = auth.uid();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.count_job_application()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.content_daily_metrics (kind, item_id, applications) VALUES ('job', NEW.job_id, 1)
  ON CONFLICT (kind, item_id, day) DO UPDATE SET applications = content_daily_metrics.applications + 1;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_section(section text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = (SELECT auth.uid())
      AND (role = 'admin' OR section = ANY(sections))
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_editor_or_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = (SELECT auth.uid())
      AND (role = 'admin' OR cardinality(sections) > 0)
  );
$function$;

CREATE OR REPLACE FUNCTION public.log_content_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  actor uuid := auth.uid();
  actor_email text;
BEGIN
  IF actor IS NOT NULL THEN
    SELECT email INTO actor_email FROM public.app_users WHERE id = actor;
  END IF;

  INSERT INTO public.content_audit_log (table_name, record_id, action, changed_by, changed_by_email, old_data, new_data)
  VALUES (
    TG_TABLE_NAME,
    COALESCE((to_jsonb(NEW)->>'id')::uuid, (to_jsonb(OLD)->>'id')::uuid),
    lower(TG_OP),
    actor,
    actor_email,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_page_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  actor uuid := auth.uid();
  actor_email text;
  old_meta jsonb := CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) - 'content' - 'published_content' ELSE NULL END;
  new_meta jsonb := CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) - 'content' - 'published_content' ELSE NULL END;
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.title = NEW.title AND OLD.slug = NEW.slug AND OLD.status = NEW.status
     AND OLD.published_at IS NOT DISTINCT FROM NEW.published_at
     AND OLD.seo = NEW.seo THEN
    RETURN NEW;
  END IF;

  IF actor IS NOT NULL THEN
    SELECT email INTO actor_email FROM public.app_users WHERE id = actor;
  END IF;

  INSERT INTO public.content_audit_log (table_name, record_id, action, changed_by, changed_by_email, old_data, new_data)
  VALUES (TG_TABLE_NAME, COALESCE(NEW.id, OLD.id), lower(TG_OP), actor, actor_email, old_meta, new_meta);
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.purge_expired_job_applications()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
DECLARE
  removed integer;
BEGIN
  DELETE FROM public.job_applications WHERE created_at < now() - interval '7 days';
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$function$;

CREATE OR REPLACE FUNCTION public.queue_job_application_file_purge()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
BEGIN
  IF OLD.resume_key IS NOT NULL THEN
    INSERT INTO public.job_application_file_purges (resume_key) VALUES (OLD.resume_key)
    ON CONFLICT (resume_key) DO NOTHING;
  END IF;
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_content_view(p_kind text, p_item uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
BEGIN
  IF p_kind = 'post' AND NOT EXISTS (SELECT 1 FROM public.blog_posts WHERE id = p_item AND status = 'published') THEN RETURN; END IF;
  IF p_kind = 'job' AND NOT EXISTS (SELECT 1 FROM public.job_postings WHERE id = p_item AND status = 'open') THEN RETURN; END IF;
  IF p_kind NOT IN ('post', 'job') THEN RETURN; END IF;
  INSERT INTO public.content_daily_metrics (kind, item_id, views) VALUES (p_kind, p_item, 1)
  ON CONFLICT (kind, item_id, day) DO UPDATE SET views = content_daily_metrics.views + 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_page_content_fields(p_page text, p_values jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.page_content (page, key, value_type, value)
  SELECT p_page, e.key, 'text', e.value
  FROM jsonb_each_text(p_values) AS e
  ON CONFLICT (page, key) DO UPDATE SET value = EXCLUDED.value;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_by()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$function$;


-- ==========================================================================
-- Tables
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.about_values (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  letter text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid
);
ALTER TABLE public.about_values ADD CONSTRAINT about_values_pkey PRIMARY KEY (id);

CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  role text DEFAULT 'editor'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  sections text[] DEFAULT '{}'::text[] NOT NULL,
  phone text,
  job_title text,
  bio text,
  profile_completed_at timestamp with time zone
);
ALTER TABLE public.app_users ADD CONSTRAINT app_users_pkey PRIMARY KEY (id);
ALTER TABLE public.app_users ADD CONSTRAINT app_users_profile_lengths CHECK ((((full_name IS NULL) OR (char_length(full_name) <= 120)) AND ((phone IS NULL) OR (char_length(phone) <= 40)) AND ((job_title IS NULL) OR (char_length(job_title) <= 120)) AND ((bio IS NULL) OR (char_length(bio) <= 1000))));
ALTER TABLE public.app_users ADD CONSTRAINT app_users_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'editor'::text])));

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  excerpt text DEFAULT ''::text NOT NULL,
  body_html text DEFAULT ''::text NOT NULL,
  cover_image_url text,
  cover_image_key text,
  author text DEFAULT ''::text NOT NULL,
  category text DEFAULT ''::text NOT NULL,
  status text DEFAULT 'draft'::text NOT NULL,
  featured boolean DEFAULT false NOT NULL,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid,
  style text DEFAULT 'classic'::text NOT NULL,
  blocks jsonb DEFAULT '[]'::jsonb NOT NULL
);
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_blocks_array CHECK ((jsonb_typeof(blocks) = 'array'::text));
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_slug_format CHECK ((slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text));
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text])));

CREATE TABLE IF NOT EXISTS public.cms_blocks (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  block jsonb NOT NULL,
  is_global boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid,
  version integer DEFAULT 1 NOT NULL
);
ALTER TABLE public.cms_blocks ADD CONSTRAINT cms_blocks_pkey PRIMARY KEY (id);

CREATE TABLE IF NOT EXISTS public.cms_form_submissions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  page_id uuid,
  form_name text DEFAULT 'Contact form'::text NOT NULL,
  data jsonb NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  client_token uuid,
  ip_hash text,
  email_log jsonb DEFAULT '{}'::jsonb NOT NULL
);
ALTER TABLE public.cms_form_submissions ADD CONSTRAINT cms_form_submissions_pkey PRIMARY KEY (id);

CREATE TABLE IF NOT EXISTS public.cms_media (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  url text NOT NULL,
  key text NOT NULL,
  filename text NOT NULL,
  title text,
  alt text,
  caption text,
  description text,
  mime_type text NOT NULL,
  size_bytes bigint DEFAULT 0 NOT NULL,
  width integer,
  height integer,
  checksum text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid
);
ALTER TABLE public.cms_media ADD CONSTRAINT cms_media_pkey PRIMARY KEY (id);
ALTER TABLE public.cms_media ADD CONSTRAINT cms_media_key_key UNIQUE (key);

CREATE TABLE IF NOT EXISTS public.cms_page_revisions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  page_id uuid NOT NULL,
  title text NOT NULL,
  content jsonb NOT NULL,
  seo jsonb DEFAULT '{}'::jsonb NOT NULL,
  reason text DEFAULT 'save'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid DEFAULT auth.uid(),
  created_by_email text
);
ALTER TABLE public.cms_page_revisions ADD CONSTRAINT cms_page_revisions_pkey PRIMARY KEY (id);
ALTER TABLE public.cms_page_revisions ADD CONSTRAINT cms_page_revisions_reason_check CHECK ((reason = ANY (ARRAY['save'::text, 'autosave'::text, 'publish'::text, 'restore'::text, 'import'::text])));

CREATE TABLE IF NOT EXISTS public.cms_pages (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  status text DEFAULT 'draft'::text NOT NULL,
  parent_id uuid,
  template text,
  legacy_key text,
  content jsonb DEFAULT '{"version": 1, "sections": []}'::jsonb NOT NULL,
  published_content jsonb,
  seo jsonb DEFAULT '{}'::jsonb NOT NULL,
  featured_image text,
  scheduled_at timestamp with time zone,
  published_at timestamp with time zone,
  published_by uuid,
  version integer DEFAULT 1 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid
);
ALTER TABLE public.cms_pages ADD CONSTRAINT cms_pages_pkey PRIMARY KEY (id);
ALTER TABLE public.cms_pages ADD CONSTRAINT cms_pages_legacy_key_key UNIQUE (legacy_key);
ALTER TABLE public.cms_pages ADD CONSTRAINT cms_pages_slug_format CHECK (((slug ~ '^([a-z0-9]+(-[a-z0-9]+)*)(/[a-z0-9]+(-[a-z0-9]+)*)*$'::text) OR (slug = ''::text)));
ALTER TABLE public.cms_pages ADD CONSTRAINT cms_pages_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'unpublished'::text, 'scheduled'::text, 'private'::text])));

CREATE TABLE IF NOT EXISTS public.cms_redirects (
  from_path text NOT NULL,
  to_path text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid DEFAULT auth.uid()
);
ALTER TABLE public.cms_redirects ADD CONSTRAINT cms_redirects_pkey PRIMARY KEY (from_path);

CREATE TABLE IF NOT EXISTS public.cms_settings (
  key text NOT NULL,
  value jsonb DEFAULT '{}'::jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid,
  version integer DEFAULT 1 NOT NULL
);
ALTER TABLE public.cms_settings ADD CONSTRAINT cms_settings_pkey PRIMARY KEY (key);
ALTER TABLE public.cms_settings ADD CONSTRAINT cms_settings_key_check CHECK ((key = ANY (ARRAY['theme'::text, 'navigation'::text, 'header'::text, 'footer'::text, 'site'::text])));

CREATE TABLE IF NOT EXISTS public.cms_templates (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  description text,
  content jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  created_by uuid DEFAULT auth.uid(),
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid
);
ALTER TABLE public.cms_templates ADD CONSTRAINT cms_templates_pkey PRIMARY KEY (id);

CREATE TABLE IF NOT EXISTS public.content_audit_log (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL,
  changed_by uuid,
  changed_by_email text,
  old_data jsonb,
  new_data jsonb,
  changed_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.content_audit_log ADD CONSTRAINT content_audit_log_pkey PRIMARY KEY (id);
ALTER TABLE public.content_audit_log ADD CONSTRAINT content_audit_log_action_check CHECK ((action = ANY (ARRAY['insert'::text, 'update'::text, 'delete'::text])));

CREATE TABLE IF NOT EXISTS public.content_daily_metrics (
  kind text NOT NULL,
  item_id uuid NOT NULL,
  day date DEFAULT ((now() AT TIME ZONE 'utc'::text))::date NOT NULL,
  views integer DEFAULT 0 NOT NULL,
  applications integer DEFAULT 0 NOT NULL
);
ALTER TABLE public.content_daily_metrics ADD CONSTRAINT content_daily_metrics_pkey PRIMARY KEY (kind, item_id, day);
ALTER TABLE public.content_daily_metrics ADD CONSTRAINT content_daily_metrics_kind_check CHECK ((kind = ANY (ARRAY['post'::text, 'job'::text])));

CREATE TABLE IF NOT EXISTS public.job_application_file_purges (
  resume_key text NOT NULL,
  queued_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.job_application_file_purges ADD CONSTRAINT job_application_file_purges_pkey PRIMARY KEY (resume_key);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  job_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT ''::text NOT NULL,
  profile_url text DEFAULT ''::text NOT NULL,
  message text DEFAULT ''::text NOT NULL,
  resume_key text,
  resume_name text,
  ip_hash text,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_pkey PRIMARY KEY (id);

CREATE TABLE IF NOT EXISTS public.job_postings (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  team text DEFAULT ''::text NOT NULL,
  location text DEFAULT ''::text NOT NULL,
  employment_type text DEFAULT ''::text NOT NULL,
  summary text DEFAULT ''::text NOT NULL,
  description_html text DEFAULT ''::text NOT NULL,
  status text DEFAULT 'draft'::text NOT NULL,
  closes_on date,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid
);
ALTER TABLE public.job_postings ADD CONSTRAINT job_postings_pkey PRIMARY KEY (id);
ALTER TABLE public.job_postings ADD CONSTRAINT job_postings_slug_key UNIQUE (slug);
ALTER TABLE public.job_postings ADD CONSTRAINT job_postings_slug_format CHECK ((slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'::text));
ALTER TABLE public.job_postings ADD CONSTRAINT job_postings_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'open'::text, 'closed'::text])));

CREATE TABLE IF NOT EXISTS public.page_content (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  page text NOT NULL,
  key text NOT NULL,
  value_type text DEFAULT 'text'::text NOT NULL,
  value text,
  image_key text,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid
);
ALTER TABLE public.page_content ADD CONSTRAINT page_content_pkey PRIMARY KEY (id);
ALTER TABLE public.page_content ADD CONSTRAINT page_content_page_key_key UNIQUE (page, key);
ALTER TABLE public.page_content ADD CONSTRAINT page_content_value_type_check CHECK ((value_type = ANY (ARRAY['text'::text, 'prose'::text, 'image'::text])));

CREATE TABLE IF NOT EXISTS public.partner_placements (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  partner_id uuid NOT NULL,
  context text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL
);
ALTER TABLE public.partner_placements ADD CONSTRAINT partner_placements_pkey PRIMARY KEY (id);
ALTER TABLE public.partner_placements ADD CONSTRAINT partner_placements_partner_id_context_key UNIQUE (partner_id, context);

CREATE TABLE IF NOT EXISTS public.partners (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  image_url text NOT NULL,
  image_key text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid
);
ALTER TABLE public.partners ADD CONSTRAINT partners_pkey PRIMARY KEY (id);

CREATE TABLE IF NOT EXISTS public.pending_invites (
  email text NOT NULL,
  role text DEFAULT 'editor'::text NOT NULL,
  sections text[] DEFAULT '{}'::text[] NOT NULL,
  full_name text,
  invited_by uuid,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.pending_invites ADD CONSTRAINT pending_invites_pkey PRIMARY KEY (email);
ALTER TABLE public.pending_invites ADD CONSTRAINT pending_invites_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'editor'::text])));

CREATE TABLE IF NOT EXISTS public.project_sections (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL,
  heading text NOT NULL,
  body_paragraphs jsonb DEFAULT '[]'::jsonb NOT NULL,
  image_url text,
  image_key text,
  partners_context text,
  sort_order integer DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid
);
ALTER TABLE public.project_sections ADD CONSTRAINT project_sections_pkey PRIMARY KEY (id);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  slug text NOT NULL,
  index_label text,
  category_label text,
  title text NOT NULL,
  project_name text,
  subtitle text,
  meta_line jsonb DEFAULT '[]'::jsonb NOT NULL,
  banner_image_url text,
  banner_image_key text,
  intro_paragraphs jsonb DEFAULT '[]'::jsonb NOT NULL,
  partners_context text,
  published boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid
);
ALTER TABLE public.projects ADD CONSTRAINT projects_pkey PRIMARY KEY (id);
ALTER TABLE public.projects ADD CONSTRAINT projects_slug_key UNIQUE (slug);

CREATE TABLE IF NOT EXISTS public.research_areas (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  title text NOT NULL,
  summary text NOT NULL,
  home_summary text,
  icon_name text,
  image_url text,
  image_key text,
  show_on_home boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid
);
ALTER TABLE public.research_areas ADD CONSTRAINT research_areas_pkey PRIMARY KEY (id);

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  image_url text,
  image_key text,
  bio_paragraphs jsonb DEFAULT '[]'::jsonb NOT NULL,
  group_key text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_by uuid,
  profile_url text
);
ALTER TABLE public.team_members ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);
ALTER TABLE public.team_members ADD CONSTRAINT team_members_group_key_check CHECK ((group_key = ANY (ARRAY['leadership'::text, 'tfs'::text, 'ift'::text, 'past'::text])));
ALTER TABLE public.team_members ADD CONSTRAINT team_members_profile_url_format CHECK (((profile_url IS NULL) OR (profile_url ~ '^(/|https?://)'::text)));


-- ==========================================================================
-- Foreign keys
-- ==========================================================================
ALTER TABLE public.about_values ADD CONSTRAINT about_values_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.app_users ADD CONSTRAINT app_users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.cms_blocks ADD CONSTRAINT cms_blocks_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.cms_blocks ADD CONSTRAINT cms_blocks_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.cms_form_submissions ADD CONSTRAINT cms_form_submissions_page_id_fkey FOREIGN KEY (page_id) REFERENCES cms_pages(id) ON DELETE SET NULL;
ALTER TABLE public.cms_media ADD CONSTRAINT cms_media_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.cms_media ADD CONSTRAINT cms_media_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.cms_page_revisions ADD CONSTRAINT cms_page_revisions_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.cms_page_revisions ADD CONSTRAINT cms_page_revisions_page_id_fkey FOREIGN KEY (page_id) REFERENCES cms_pages(id) ON DELETE CASCADE;
ALTER TABLE public.cms_pages ADD CONSTRAINT cms_pages_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.cms_pages ADD CONSTRAINT cms_pages_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES cms_pages(id) ON DELETE SET NULL;
ALTER TABLE public.cms_pages ADD CONSTRAINT cms_pages_published_by_fkey FOREIGN KEY (published_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.cms_pages ADD CONSTRAINT cms_pages_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.cms_redirects ADD CONSTRAINT cms_redirects_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.cms_settings ADD CONSTRAINT cms_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.cms_templates ADD CONSTRAINT cms_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.cms_templates ADD CONSTRAINT cms_templates_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.content_audit_log ADD CONSTRAINT content_audit_log_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE;
ALTER TABLE public.job_postings ADD CONSTRAINT job_postings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.page_content ADD CONSTRAINT page_content_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.partner_placements ADD CONSTRAINT partner_placements_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE;
ALTER TABLE public.partners ADD CONSTRAINT partners_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.pending_invites ADD CONSTRAINT pending_invites_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.project_sections ADD CONSTRAINT project_sections_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE public.project_sections ADD CONSTRAINT project_sections_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.projects ADD CONSTRAINT projects_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.research_areas ADD CONSTRAINT research_areas_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) NOT VALID;
ALTER TABLE public.team_members ADD CONSTRAINT team_members_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) NOT VALID;

-- ==========================================================================
-- Indexes
-- ==========================================================================
CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON public.blog_posts USING btree (status, published_at DESC);
CREATE INDEX IF NOT EXISTS cms_form_submissions_created_idx ON public.cms_form_submissions USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS cms_form_submissions_ip_recent_idx ON public.cms_form_submissions USING btree (ip_hash, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS cms_form_submissions_client_token_key ON public.cms_form_submissions USING btree (client_token);
CREATE INDEX IF NOT EXISTS cms_media_created_at_idx ON public.cms_media USING btree (created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS cms_media_checksum_key ON public.cms_media USING btree (checksum) WHERE (checksum IS NOT NULL);
CREATE INDEX IF NOT EXISTS cms_page_revisions_page_idx ON public.cms_page_revisions USING btree (page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS cms_pages_status_idx ON public.cms_pages USING btree (status);
CREATE INDEX IF NOT EXISTS cms_pages_updated_at_idx ON public.cms_pages USING btree (updated_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS cms_pages_slug_key ON public.cms_pages USING btree (slug);
CREATE INDEX IF NOT EXISTS content_audit_log_changed_at_idx ON public.content_audit_log USING btree (changed_at DESC);
CREATE INDEX IF NOT EXISTS content_audit_log_table_record_idx ON public.content_audit_log USING btree (table_name, record_id);
CREATE INDEX IF NOT EXISTS content_daily_metrics_day_idx ON public.content_daily_metrics USING btree (kind, day);
CREATE INDEX IF NOT EXISTS job_applications_created_idx ON public.job_applications USING btree (created_at);
CREATE INDEX IF NOT EXISTS job_applications_job_idx ON public.job_applications USING btree (job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS partner_placements_context_idx ON public.partner_placements USING btree (context, sort_order);
CREATE INDEX IF NOT EXISTS project_sections_project_idx ON public.project_sections USING btree (project_id, sort_order);
CREATE INDEX IF NOT EXISTS team_members_group_idx ON public.team_members USING btree (group_key, sort_order);

-- ==========================================================================
-- Row-level security
-- ==========================================================================
ALTER TABLE public.about_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_page_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_redirects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_application_file_purges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY about_values_editor_write ON public.about_values AS PERMISSIVE FOR ALL TO authenticated USING (has_section('about'::text)) WITH CHECK (has_section('about'::text));
CREATE POLICY about_values_public_read ON public.about_values AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY app_users_select_authenticated ON public.app_users AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY blog_posts_editor_write ON public.blog_posts AS PERMISSIVE FOR ALL TO authenticated USING (has_section('pages'::text)) WITH CHECK (has_section('pages'::text));
CREATE POLICY blog_posts_public_read ON public.blog_posts AS PERMISSIVE FOR SELECT TO anon, authenticated USING (((status = 'published'::text) OR has_section('pages'::text)));
CREATE POLICY cms_blocks_editor_write ON public.cms_blocks AS PERMISSIVE FOR ALL TO authenticated USING (has_section('pages'::text)) WITH CHECK (has_section('pages'::text));
CREATE POLICY cms_blocks_public_read ON public.cms_blocks AS PERMISSIVE FOR SELECT TO anon, authenticated USING ((is_global OR is_editor_or_admin()));
CREATE POLICY cms_form_submissions_editor_delete ON public.cms_form_submissions AS PERMISSIVE FOR DELETE TO authenticated USING ((has_section('pages'::text) OR has_section('contact'::text)));
CREATE POLICY cms_form_submissions_editor_read ON public.cms_form_submissions AS PERMISSIVE FOR SELECT TO authenticated USING ((has_section('pages'::text) OR has_section('contact'::text)));
CREATE POLICY cms_form_submissions_editor_update ON public.cms_form_submissions AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_section('pages'::text) OR has_section('contact'::text))) WITH CHECK ((has_section('pages'::text) OR has_section('contact'::text)));
CREATE POLICY cms_media_editor_insert ON public.cms_media AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_editor_or_admin());
CREATE POLICY cms_media_editor_read ON public.cms_media AS PERMISSIVE FOR SELECT TO authenticated USING (is_editor_or_admin());
CREATE POLICY cms_media_manager_delete ON public.cms_media AS PERMISSIVE FOR DELETE TO authenticated USING (has_section('media'::text));
CREATE POLICY cms_media_manager_update ON public.cms_media AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_section('media'::text) OR (created_by = ( SELECT auth.uid() AS uid)))) WITH CHECK ((has_section('media'::text) OR (created_by = ( SELECT auth.uid() AS uid))));
CREATE POLICY cms_page_revisions_editor_insert ON public.cms_page_revisions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (is_editor_or_admin());
CREATE POLICY cms_page_revisions_editor_read ON public.cms_page_revisions AS PERMISSIVE FOR SELECT TO authenticated USING (is_editor_or_admin());
CREATE POLICY cms_pages_editor_delete ON public.cms_pages AS PERMISSIVE FOR DELETE TO authenticated USING ((has_section('pages'::text) AND (slug <> ''::text)));
CREATE POLICY cms_pages_editor_insert ON public.cms_pages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_section('pages'::text));
CREATE POLICY cms_pages_editor_update ON public.cms_pages AS PERMISSIVE FOR UPDATE TO authenticated USING (can_edit_page(legacy_key)) WITH CHECK (can_edit_page(legacy_key));
CREATE POLICY cms_pages_public_read ON public.cms_pages AS PERMISSIVE FOR SELECT TO anon, authenticated USING (((status = 'published'::text) OR ((status = 'scheduled'::text) AND (scheduled_at IS NOT NULL) AND (scheduled_at <= now())) OR is_editor_or_admin()));
CREATE POLICY cms_redirects_editor_write ON public.cms_redirects AS PERMISSIVE FOR ALL TO authenticated USING ((has_section('pages'::text) OR has_section('seo'::text))) WITH CHECK ((has_section('pages'::text) OR has_section('seo'::text)));
CREATE POLICY cms_redirects_public_read ON public.cms_redirects AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cms_settings_editor_write ON public.cms_settings AS PERMISSIVE FOR ALL TO authenticated USING (
CASE
    WHEN (key = 'site'::text) THEN (has_section('global'::text) OR has_section('seo'::text))
    WHEN (key = 'notifications'::text) THEN is_admin()
    ELSE has_section('design'::text)
END) WITH CHECK (
CASE
    WHEN (key = 'site'::text) THEN (has_section('global'::text) OR has_section('seo'::text))
    WHEN (key = 'notifications'::text) THEN is_admin()
    ELSE has_section('design'::text)
END);
CREATE POLICY cms_settings_public_read ON public.cms_settings AS PERMISSIVE FOR SELECT TO anon, authenticated USING (((key <> 'notifications'::text) OR is_admin()));
CREATE POLICY cms_templates_editor_read ON public.cms_templates AS PERMISSIVE FOR SELECT TO authenticated USING (is_editor_or_admin());
CREATE POLICY cms_templates_editor_write ON public.cms_templates AS PERMISSIVE FOR ALL TO authenticated USING (has_section('pages'::text)) WITH CHECK (has_section('pages'::text));
CREATE POLICY content_audit_log_select_editor ON public.content_audit_log AS PERMISSIVE FOR SELECT TO authenticated USING (is_editor_or_admin());
CREATE POLICY content_daily_metrics_editor_read ON public.content_daily_metrics AS PERMISSIVE FOR SELECT TO authenticated USING ((has_section('pages'::text) OR has_section('contact'::text)));
CREATE POLICY job_applications_editor_delete ON public.job_applications AS PERMISSIVE FOR DELETE TO authenticated USING ((has_section('pages'::text) OR has_section('contact'::text)));
CREATE POLICY job_applications_editor_read ON public.job_applications AS PERMISSIVE FOR SELECT TO authenticated USING ((has_section('pages'::text) OR has_section('contact'::text)));
CREATE POLICY job_applications_editor_update ON public.job_applications AS PERMISSIVE FOR UPDATE TO authenticated USING ((has_section('pages'::text) OR has_section('contact'::text))) WITH CHECK ((has_section('pages'::text) OR has_section('contact'::text)));
CREATE POLICY job_postings_editor_write ON public.job_postings AS PERMISSIVE FOR ALL TO authenticated USING (has_section('pages'::text)) WITH CHECK (has_section('pages'::text));
CREATE POLICY job_postings_public_read ON public.job_postings AS PERMISSIVE FOR SELECT TO anon, authenticated USING (((status = 'open'::text) OR has_section('pages'::text)));
CREATE POLICY page_content_editor_write ON public.page_content AS PERMISSIVE FOR ALL TO authenticated USING (has_section(page)) WITH CHECK (has_section(page));
CREATE POLICY page_content_public_read ON public.page_content AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY partner_placements_editor_write ON public.partner_placements AS PERMISSIVE FOR ALL TO authenticated USING (has_section('partners'::text)) WITH CHECK (has_section('partners'::text));
CREATE POLICY partner_placements_public_read ON public.partner_placements AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY partners_editor_write ON public.partners AS PERMISSIVE FOR ALL TO authenticated USING (has_section('partners'::text)) WITH CHECK (has_section('partners'::text));
CREATE POLICY partners_public_read ON public.partners AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY project_sections_editor_write ON public.project_sections AS PERMISSIVE FOR ALL TO authenticated USING (has_section('projects'::text)) WITH CHECK (has_section('projects'::text));
CREATE POLICY project_sections_public_read ON public.project_sections AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY projects_editor_write ON public.projects AS PERMISSIVE FOR ALL TO authenticated USING (has_section('projects'::text)) WITH CHECK (has_section('projects'::text));
CREATE POLICY projects_public_read ON public.projects AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY research_areas_editor_write ON public.research_areas AS PERMISSIVE FOR ALL TO authenticated USING (has_section('research'::text)) WITH CHECK (has_section('research'::text));
CREATE POLICY research_areas_public_read ON public.research_areas AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY team_members_editor_write ON public.team_members AS PERMISSIVE FOR ALL TO authenticated USING (has_section('team'::text)) WITH CHECK (has_section('team'::text));
CREATE POLICY team_members_public_read ON public.team_members AS PERMISSIVE FOR SELECT TO anon, authenticated USING (true);

-- ==========================================================================
-- Triggers
-- ==========================================================================
CREATE TRIGGER about_values_audit AFTER INSERT OR DELETE OR UPDATE ON public.about_values FOR EACH ROW EXECUTE FUNCTION log_content_change();
CREATE TRIGGER about_values_updated_at BEFORE UPDATE ON public.about_values FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER about_values_updated_by BEFORE INSERT OR UPDATE ON public.about_values FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER blog_posts_audit AFTER INSERT OR DELETE OR UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION log_content_change();
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER blog_posts_updated_by BEFORE INSERT OR UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER cms_blocks_audit AFTER INSERT OR DELETE OR UPDATE ON public.cms_blocks FOR EACH ROW EXECUTE FUNCTION log_content_change();
CREATE TRIGGER cms_blocks_updated_at BEFORE UPDATE ON public.cms_blocks FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER cms_blocks_updated_by BEFORE INSERT OR UPDATE ON public.cms_blocks FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER cms_blocks_version BEFORE UPDATE ON public.cms_blocks FOR EACH ROW EXECUTE FUNCTION cms_pages_bump_version();
CREATE TRIGGER cms_media_updated_at BEFORE UPDATE ON public.cms_media FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER cms_media_updated_by BEFORE INSERT OR UPDATE ON public.cms_media FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER cms_page_revisions_author BEFORE INSERT ON public.cms_page_revisions FOR EACH ROW EXECUTE FUNCTION cms_revision_author();
CREATE TRIGGER cms_page_revisions_prune AFTER INSERT ON public.cms_page_revisions FOR EACH ROW EXECUTE FUNCTION cms_prune_revisions();
CREATE TRIGGER cms_pages_audit AFTER INSERT OR DELETE OR UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION log_page_change();
CREATE TRIGGER cms_pages_updated_at BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER cms_pages_updated_by BEFORE INSERT OR UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER cms_pages_version BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION cms_pages_bump_version();
CREATE TRIGGER cms_settings_audit AFTER INSERT OR DELETE OR UPDATE ON public.cms_settings FOR EACH ROW EXECUTE FUNCTION log_content_change();
CREATE TRIGGER cms_settings_updated_at BEFORE UPDATE ON public.cms_settings FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER cms_settings_updated_by BEFORE INSERT OR UPDATE ON public.cms_settings FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER cms_settings_version BEFORE UPDATE ON public.cms_settings FOR EACH ROW EXECUTE FUNCTION cms_pages_bump_version();
CREATE TRIGGER cms_templates_updated_at BEFORE UPDATE ON public.cms_templates FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER cms_templates_updated_by BEFORE INSERT OR UPDATE ON public.cms_templates FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER job_applications_count AFTER INSERT ON public.job_applications FOR EACH ROW EXECUTE FUNCTION count_job_application();
CREATE TRIGGER job_applications_queue_file_purge AFTER DELETE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION queue_job_application_file_purge();
CREATE TRIGGER job_postings_audit AFTER INSERT OR DELETE OR UPDATE ON public.job_postings FOR EACH ROW EXECUTE FUNCTION log_content_change();
CREATE TRIGGER job_postings_updated_at BEFORE UPDATE ON public.job_postings FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER job_postings_updated_by BEFORE INSERT OR UPDATE ON public.job_postings FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER page_content_audit AFTER INSERT OR DELETE OR UPDATE ON public.page_content FOR EACH ROW EXECUTE FUNCTION log_content_change();
CREATE TRIGGER page_content_updated_at BEFORE UPDATE ON public.page_content FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER page_content_updated_by BEFORE INSERT OR UPDATE ON public.page_content FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER partner_placements_audit AFTER INSERT OR DELETE OR UPDATE ON public.partner_placements FOR EACH ROW EXECUTE FUNCTION log_content_change();
CREATE TRIGGER partners_audit AFTER INSERT OR DELETE OR UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION log_content_change();
CREATE TRIGGER partners_updated_at BEFORE UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER partners_updated_by BEFORE INSERT OR UPDATE ON public.partners FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER project_sections_audit AFTER INSERT OR DELETE OR UPDATE ON public.project_sections FOR EACH ROW EXECUTE FUNCTION log_content_change();
CREATE TRIGGER project_sections_updated_at BEFORE UPDATE ON public.project_sections FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER project_sections_updated_by BEFORE INSERT OR UPDATE ON public.project_sections FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER projects_audit AFTER INSERT OR DELETE OR UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION log_content_change();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER projects_updated_by BEFORE INSERT OR UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER research_areas_audit AFTER INSERT OR DELETE OR UPDATE ON public.research_areas FOR EACH ROW EXECUTE FUNCTION log_content_change();
CREATE TRIGGER research_areas_updated_at BEFORE UPDATE ON public.research_areas FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER research_areas_updated_by BEFORE INSERT OR UPDATE ON public.research_areas FOR EACH ROW EXECUTE FUNCTION set_updated_by();
CREATE TRIGGER team_members_audit AFTER INSERT OR DELETE OR UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION log_content_change();
CREATE TRIGGER team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER team_members_updated_by BEFORE INSERT OR UPDATE ON public.team_members FOR EACH ROW EXECUTE FUNCTION set_updated_by();

-- ==========================================================================
-- Privileges for the API roles
-- ==========================================================================
REVOKE ALL ON public.about_values FROM anon, authenticated;
REVOKE ALL ON public.app_users FROM anon, authenticated;
REVOKE ALL ON public.blog_posts FROM anon, authenticated;
REVOKE ALL ON public.cms_blocks FROM anon, authenticated;
REVOKE ALL ON public.cms_form_submissions FROM anon, authenticated;
REVOKE ALL ON public.cms_media FROM anon, authenticated;
REVOKE ALL ON public.cms_page_revisions FROM anon, authenticated;
REVOKE ALL ON public.cms_pages FROM anon, authenticated;
REVOKE ALL ON public.cms_redirects FROM anon, authenticated;
REVOKE ALL ON public.cms_settings FROM anon, authenticated;
REVOKE ALL ON public.cms_templates FROM anon, authenticated;
REVOKE ALL ON public.content_audit_log FROM anon, authenticated;
REVOKE ALL ON public.content_daily_metrics FROM anon, authenticated;
REVOKE ALL ON public.job_application_file_purges FROM anon, authenticated;
REVOKE ALL ON public.job_applications FROM anon, authenticated;
REVOKE ALL ON public.job_postings FROM anon, authenticated;
REVOKE ALL ON public.page_content FROM anon, authenticated;
REVOKE ALL ON public.partner_placements FROM anon, authenticated;
REVOKE ALL ON public.partners FROM anon, authenticated;
REVOKE ALL ON public.pending_invites FROM anon, authenticated;
REVOKE ALL ON public.project_sections FROM anon, authenticated;
REVOKE ALL ON public.projects FROM anon, authenticated;
REVOKE ALL ON public.research_areas FROM anon, authenticated;
REVOKE ALL ON public.team_members FROM anon, authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.about_values TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.about_values TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.app_users TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.app_users TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.blog_posts TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.blog_posts TO authenticated;
GRANT SELECT ON public.cms_blocks TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.cms_blocks TO authenticated;
GRANT DELETE, SELECT, UPDATE ON public.cms_form_submissions TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.cms_media TO authenticated;
GRANT INSERT, SELECT ON public.cms_page_revisions TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.cms_pages TO authenticated;
GRANT SELECT ON public.cms_redirects TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.cms_redirects TO authenticated;
GRANT SELECT ON public.cms_settings TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.cms_settings TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.cms_templates TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.content_audit_log TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.content_audit_log TO authenticated;
GRANT SELECT ON public.content_daily_metrics TO authenticated;
GRANT DELETE, SELECT, UPDATE ON public.job_applications TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.job_postings TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.job_postings TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.page_content TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.page_content TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.partner_placements TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.partner_placements TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.partners TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.partners TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.pending_invites TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.pending_invites TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.project_sections TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.project_sections TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.projects TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.projects TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.research_areas TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.research_areas TO authenticated;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.team_members TO anon;
GRANT DELETE, INSERT, SELECT, UPDATE ON public.team_members TO authenticated;
GRANT SELECT (id, title, slug, status, parent_id, legacy_key, published_content, seo, featured_image, scheduled_at, published_at, updated_at) ON public.cms_pages TO anon;
REVOKE ALL ON FUNCTION set_page_content_fields(text,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_page_content_fields(text,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION purge_expired_job_applications() FROM PUBLIC;
REVOKE ALL ON FUNCTION record_content_view(text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION record_content_view(text,uuid) TO anon;
GRANT EXECUTE ON FUNCTION record_content_view(text,uuid) TO authenticated;

COMMIT;
