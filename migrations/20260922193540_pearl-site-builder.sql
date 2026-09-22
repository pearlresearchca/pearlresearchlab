-- Visual site builder: dynamic pages (block-based JSON content), revisions,
-- templates, reusable/global blocks, media library, global site settings
-- (theme, navigation, header, footer, site/SEO), redirects and form
-- submissions.
--
-- Existing content tables are untouched. Original pages keep rendering from
-- them until a builder version of the page (cms_pages.legacy_key) is
-- published, so the migration to the builder is incremental and reversible.

-- ============================================================================
-- 1. Permission helpers
-- ============================================================================

-- New permission sections used below: 'pages', 'media', 'design', 'seo'.
-- Admins implicitly hold every section via public.has_section().

-- A builder page that replaces one of the original pages (home, about, ...)
-- can also be edited by anyone who already had access to that original page.
CREATE OR REPLACE FUNCTION public.can_edit_page(legacy text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT public.has_section('pages')
      OR public.has_section('seo')
      OR (legacy IS NOT NULL AND public.has_section(legacy));
$$;

-- ============================================================================
-- 2. Pages
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  -- '' is the homepage; otherwise a lowercase path such as 'about' or 'services/consulting'.
  slug text NOT NULL,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'unpublished', 'scheduled', 'private')),
  parent_id uuid REFERENCES public.cms_pages(id) ON DELETE SET NULL,
  template text,
  -- Set for builder versions of the original hardcoded pages ('home', 'about', ...).
  legacy_key text UNIQUE,
  content jsonb NOT NULL DEFAULT '{"version":1,"sections":[]}'::jsonb,
  published_content jsonb,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  featured_image text,
  scheduled_at timestamptz,
  published_at timestamptz,
  published_by uuid REFERENCES auth.users(id),
  -- Bumped on every update; the builder saves with `.eq('version', n)` so a
  -- concurrent edit elsewhere is detected instead of silently overwritten.
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  CONSTRAINT cms_pages_slug_format CHECK (slug ~ '^([a-z0-9]+(-[a-z0-9]+)*)(/[a-z0-9]+(-[a-z0-9]+)*)*$' OR slug = '')
);

CREATE UNIQUE INDEX IF NOT EXISTS cms_pages_slug_key ON public.cms_pages (slug);
CREATE INDEX IF NOT EXISTS cms_pages_status_idx ON public.cms_pages (status);
CREATE INDEX IF NOT EXISTS cms_pages_updated_at_idx ON public.cms_pages (updated_at DESC);

CREATE OR REPLACE FUNCTION public.cms_pages_bump_version()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.version := OLD.version + 1;
  RETURN NEW;
END;
$$;

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

-- Visitors only ever see live pages. Scheduled pages go live on their own
-- once scheduled_at passes (no cron needed).
CREATE POLICY cms_pages_public_read ON public.cms_pages
  FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    OR (status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= now())
    OR public.is_editor_or_admin()
  );

CREATE POLICY cms_pages_editor_insert ON public.cms_pages
  FOR INSERT TO authenticated
  WITH CHECK (public.has_section('pages'));

CREATE POLICY cms_pages_editor_update ON public.cms_pages
  FOR UPDATE TO authenticated
  USING (public.can_edit_page(legacy_key))
  WITH CHECK (public.can_edit_page(legacy_key));

CREATE POLICY cms_pages_editor_delete ON public.cms_pages
  FOR DELETE TO authenticated
  USING (public.has_section('pages') AND legacy_key IS NULL);

-- Anonymous visitors never need the working draft; only the published copy.
REVOKE ALL ON public.cms_pages FROM anon;
GRANT SELECT (id, title, slug, status, parent_id, legacy_key, published_content, seo, featured_image, scheduled_at, published_at, updated_at)
  ON public.cms_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_pages TO authenticated;

CREATE TRIGGER cms_pages_updated_at BEFORE UPDATE ON public.cms_pages
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER cms_pages_updated_by BEFORE INSERT OR UPDATE ON public.cms_pages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();
CREATE TRIGGER cms_pages_version BEFORE UPDATE ON public.cms_pages
  FOR EACH ROW EXECUTE FUNCTION public.cms_pages_bump_version();
-- Page audit entries leave out the (large) content JSON and skip plain draft
-- saves: the revision history covers content, the activity log covers
-- lifecycle events (create, rename, URL change, publish, delete).
CREATE OR REPLACE FUNCTION public.log_page_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
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
$$;

CREATE TRIGGER cms_pages_audit AFTER INSERT OR UPDATE OR DELETE ON public.cms_pages
  FOR EACH ROW EXECUTE FUNCTION public.log_page_change();

-- ============================================================================
-- 3. Page revisions (append-only, pruned to the most recent 40 per page)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cms_page_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
  title text NOT NULL,
  content jsonb NOT NULL,
  seo jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text NOT NULL DEFAULT 'save' CHECK (reason IN ('save', 'autosave', 'publish', 'restore', 'import')),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  created_by_email text
);

CREATE INDEX IF NOT EXISTS cms_page_revisions_page_idx ON public.cms_page_revisions (page_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.cms_prune_revisions()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.cms_revision_author()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  NEW.created_by := auth.uid();
  SELECT email INTO NEW.created_by_email FROM public.app_users WHERE id = auth.uid();
  RETURN NEW;
END;
$$;

ALTER TABLE public.cms_page_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY cms_page_revisions_editor_read ON public.cms_page_revisions
  FOR SELECT TO authenticated
  USING (public.is_editor_or_admin());

CREATE POLICY cms_page_revisions_editor_insert ON public.cms_page_revisions
  FOR INSERT TO authenticated
  WITH CHECK (public.is_editor_or_admin());

REVOKE ALL ON public.cms_page_revisions FROM anon;
REVOKE UPDATE, DELETE ON public.cms_page_revisions FROM authenticated;
GRANT SELECT, INSERT ON public.cms_page_revisions TO authenticated;

CREATE TRIGGER cms_page_revisions_author BEFORE INSERT ON public.cms_page_revisions
  FOR EACH ROW EXECUTE FUNCTION public.cms_revision_author();
CREATE TRIGGER cms_page_revisions_prune AFTER INSERT ON public.cms_page_revisions
  FOR EACH ROW EXECUTE FUNCTION public.cms_prune_revisions();

-- ============================================================================
-- 4. Templates and reusable / global blocks
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cms_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  content jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.cms_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY cms_templates_editor_read ON public.cms_templates
  FOR SELECT TO authenticated USING (public.is_editor_or_admin());
CREATE POLICY cms_templates_editor_write ON public.cms_templates
  FOR ALL TO authenticated
  USING (public.has_section('pages'))
  WITH CHECK (public.has_section('pages'));

REVOKE ALL ON public.cms_templates FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_templates TO authenticated;

CREATE TRIGGER cms_templates_updated_at BEFORE UPDATE ON public.cms_templates
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER cms_templates_updated_by BEFORE INSERT OR UPDATE ON public.cms_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

CREATE TABLE IF NOT EXISTS public.cms_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  -- A single builder node (usually a section) stored as JSON.
  block jsonb NOT NULL,
  -- Global blocks are referenced (not copied) by pages, so editing one updates everywhere.
  is_global boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.cms_blocks ENABLE ROW LEVEL SECURITY;

-- Global blocks are rendered on public pages, so they're publicly readable.
CREATE POLICY cms_blocks_public_read ON public.cms_blocks
  FOR SELECT TO anon, authenticated USING (is_global OR public.is_editor_or_admin());
CREATE POLICY cms_blocks_editor_write ON public.cms_blocks
  FOR ALL TO authenticated
  USING (public.has_section('pages'))
  WITH CHECK (public.has_section('pages'));

REVOKE ALL ON public.cms_blocks FROM anon;
GRANT SELECT ON public.cms_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_blocks TO authenticated;

CREATE TRIGGER cms_blocks_updated_at BEFORE UPDATE ON public.cms_blocks
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER cms_blocks_updated_by BEFORE INSERT OR UPDATE ON public.cms_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();
CREATE TRIGGER cms_blocks_audit AFTER INSERT OR UPDATE OR DELETE ON public.cms_blocks
  FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

-- ============================================================================
-- 5. Media library (files live in the existing site-images bucket)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cms_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  key text NOT NULL UNIQUE,
  filename text NOT NULL,
  title text,
  alt text,
  caption text,
  description text,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL DEFAULT 0,
  width integer,
  height integer,
  -- SHA-256 of the uploaded bytes, so re-uploading the same file reuses it.
  checksum text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS cms_media_created_at_idx ON public.cms_media (created_at DESC);
CREATE INDEX IF NOT EXISTS cms_media_checksum_idx ON public.cms_media (checksum);

ALTER TABLE public.cms_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY cms_media_editor_read ON public.cms_media
  FOR SELECT TO authenticated USING (public.is_editor_or_admin());
-- Anyone who can edit content can upload (e.g. from inside the page builder)...
CREATE POLICY cms_media_editor_insert ON public.cms_media
  FOR INSERT TO authenticated WITH CHECK (public.is_editor_or_admin());
-- ...but editing metadata, replacing and deleting is for media managers.
CREATE POLICY cms_media_manager_update ON public.cms_media
  FOR UPDATE TO authenticated
  USING (public.has_section('media') OR created_by = (SELECT auth.uid()))
  WITH CHECK (public.has_section('media') OR created_by = (SELECT auth.uid()));
CREATE POLICY cms_media_manager_delete ON public.cms_media
  FOR DELETE TO authenticated
  USING (public.has_section('media'));

REVOKE ALL ON public.cms_media FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_media TO authenticated;

CREATE TRIGGER cms_media_updated_at BEFORE UPDATE ON public.cms_media
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER cms_media_updated_by BEFORE INSERT OR UPDATE ON public.cms_media
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();

-- ============================================================================
-- 6. Global site settings: theme, navigation, header, footer, site
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cms_settings (
  key text PRIMARY KEY CHECK (key IN ('theme', 'navigation', 'header', 'footer', 'site')),
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.cms_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY cms_settings_public_read ON public.cms_settings
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cms_settings_editor_write ON public.cms_settings
  FOR ALL TO authenticated
  USING (CASE WHEN key = 'site' THEN public.has_section('global') OR public.has_section('seo') ELSE public.has_section('design') END)
  WITH CHECK (CASE WHEN key = 'site' THEN public.has_section('global') OR public.has_section('seo') ELSE public.has_section('design') END);

REVOKE ALL ON public.cms_settings FROM anon;
GRANT SELECT ON public.cms_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.cms_settings TO authenticated;

CREATE TRIGGER cms_settings_updated_at BEFORE UPDATE ON public.cms_settings
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER cms_settings_updated_by BEFORE INSERT OR UPDATE ON public.cms_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();
CREATE TRIGGER cms_settings_audit AFTER INSERT OR UPDATE OR DELETE ON public.cms_settings
  FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

-- The audit trigger records NEW.id; cms_settings has a text key instead.
-- log_content_change() reads to_jsonb(NEW)->>'id', which is NULL here, which
-- is fine: record_id is nullable and table_name + new_data identify the row.

-- ============================================================================
-- 7. Redirects (created automatically when a page URL changes)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cms_redirects (
  from_path text PRIMARY KEY,
  to_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) DEFAULT auth.uid()
);

ALTER TABLE public.cms_redirects ENABLE ROW LEVEL SECURITY;

CREATE POLICY cms_redirects_public_read ON public.cms_redirects
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cms_redirects_editor_write ON public.cms_redirects
  FOR ALL TO authenticated
  USING (public.has_section('pages') OR public.has_section('seo'))
  WITH CHECK (public.has_section('pages') OR public.has_section('seo'));

REVOKE ALL ON public.cms_redirects FROM anon;
GRANT SELECT ON public.cms_redirects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cms_redirects TO authenticated;

-- ============================================================================
-- 8. Form submissions (from builder form blocks)
-- ============================================================================

-- Inserted only by a server action using the admin client after validation,
-- so there is no anon/authenticated insert policy.
CREATE TABLE IF NOT EXISTS public.cms_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid REFERENCES public.cms_pages(id) ON DELETE SET NULL,
  form_name text NOT NULL DEFAULT 'Contact form',
  data jsonb NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cms_form_submissions_created_idx ON public.cms_form_submissions (created_at DESC);

ALTER TABLE public.cms_form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY cms_form_submissions_editor_read ON public.cms_form_submissions
  FOR SELECT TO authenticated USING (public.has_section('pages') OR public.has_section('contact'));
CREATE POLICY cms_form_submissions_editor_update ON public.cms_form_submissions
  FOR UPDATE TO authenticated
  USING (public.has_section('pages') OR public.has_section('contact'))
  WITH CHECK (public.has_section('pages') OR public.has_section('contact'));
CREATE POLICY cms_form_submissions_editor_delete ON public.cms_form_submissions
  FOR DELETE TO authenticated USING (public.has_section('pages') OR public.has_section('contact'));

REVOKE ALL ON public.cms_form_submissions FROM anon;
REVOKE INSERT ON public.cms_form_submissions FROM authenticated;
GRANT SELECT, UPDATE, DELETE ON public.cms_form_submissions TO authenticated;
