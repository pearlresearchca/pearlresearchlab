-- Blog posts, job postings and job applications.
--
-- Blog posts and job postings are edited in the admin (Blog posts / Job
-- openings) and shown on the site by the "Blog posts" and "Job openings"
-- page-builder blocks, with their own detail pages (/blogs/<slug>,
-- /careers/<slug>).
--
-- Job applications are personal data and are kept for 7 days only: a nightly
-- schedule deletes older applications and queues their résumé files, which
-- the app then removes from the private "form-uploads" bucket.

-- ============================================================================
-- Blog posts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE CONSTRAINT blog_posts_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  excerpt text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  cover_image_url text,
  cover_image_key text,
  author text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  featured boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS blog_posts_published_idx ON public.blog_posts (status, published_at DESC);

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blog_posts_public_read ON public.blog_posts;
CREATE POLICY blog_posts_public_read ON public.blog_posts
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR public.has_section('pages'));

DROP POLICY IF EXISTS blog_posts_editor_write ON public.blog_posts;
CREATE POLICY blog_posts_editor_write ON public.blog_posts
  FOR ALL TO authenticated
  USING (public.has_section('pages'))
  WITH CHECK (public.has_section('pages'));

GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;

DROP TRIGGER IF EXISTS blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
DROP TRIGGER IF EXISTS blog_posts_updated_by ON public.blog_posts;
CREATE TRIGGER blog_posts_updated_by BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();
DROP TRIGGER IF EXISTS blog_posts_audit ON public.blog_posts;
CREATE TRIGGER blog_posts_audit AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

-- ============================================================================
-- Job postings
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE CONSTRAINT job_postings_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  team text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  employment_type text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  description_html text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
  closes_on date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_postings_public_read ON public.job_postings;
CREATE POLICY job_postings_public_read ON public.job_postings
  FOR SELECT TO anon, authenticated
  USING (status = 'open' OR public.has_section('pages'));

DROP POLICY IF EXISTS job_postings_editor_write ON public.job_postings;
CREATE POLICY job_postings_editor_write ON public.job_postings
  FOR ALL TO authenticated
  USING (public.has_section('pages'))
  WITH CHECK (public.has_section('pages'));

GRANT SELECT ON public.job_postings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.job_postings TO authenticated;

DROP TRIGGER IF EXISTS job_postings_updated_at ON public.job_postings;
CREATE TRIGGER job_postings_updated_at BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
DROP TRIGGER IF EXISTS job_postings_updated_by ON public.job_postings;
CREATE TRIGGER job_postings_updated_by BEFORE INSERT OR UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();
DROP TRIGGER IF EXISTS job_postings_audit ON public.job_postings;
CREATE TRIGGER job_postings_audit AFTER INSERT OR UPDATE OR DELETE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

-- ============================================================================
-- Job applications (inserted server-side only; kept 7 days)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  profile_url text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  resume_key text,
  resume_name text,
  ip_hash text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_applications_job_idx ON public.job_applications (job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS job_applications_created_idx ON public.job_applications (created_at);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_applications_editor_read ON public.job_applications;
CREATE POLICY job_applications_editor_read ON public.job_applications
  FOR SELECT TO authenticated USING (public.has_section('pages') OR public.has_section('contact'));
DROP POLICY IF EXISTS job_applications_editor_update ON public.job_applications;
CREATE POLICY job_applications_editor_update ON public.job_applications
  FOR UPDATE TO authenticated
  USING (public.has_section('pages') OR public.has_section('contact'))
  WITH CHECK (public.has_section('pages') OR public.has_section('contact'));
DROP POLICY IF EXISTS job_applications_editor_delete ON public.job_applications;
CREATE POLICY job_applications_editor_delete ON public.job_applications
  FOR DELETE TO authenticated USING (public.has_section('pages') OR public.has_section('contact'));

REVOKE ALL ON public.job_applications FROM anon;
REVOKE INSERT ON public.job_applications FROM authenticated;
GRANT SELECT, UPDATE, DELETE ON public.job_applications TO authenticated;

-- Résumé files whose application was deleted, waiting to be removed from storage.
CREATE TABLE IF NOT EXISTS public.job_application_file_purges (
  resume_key text PRIMARY KEY,
  queued_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.job_application_file_purges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_application_file_purges FROM anon, authenticated;

-- Any deleted application (expired or removed by an editor) queues its file.
CREATE OR REPLACE FUNCTION public.queue_job_application_file_purge()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF OLD.resume_key IS NOT NULL THEN
    INSERT INTO public.job_application_file_purges (resume_key) VALUES (OLD.resume_key)
    ON CONFLICT (resume_key) DO NOTHING;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS job_applications_queue_file_purge ON public.job_applications;
CREATE TRIGGER job_applications_queue_file_purge AFTER DELETE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.queue_job_application_file_purge();

CREATE OR REPLACE FUNCTION public.purge_expired_job_applications()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  removed integer;
BEGIN
  DELETE FROM public.job_applications WHERE created_at < now() - interval '7 days';
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END;
$$;
REVOKE ALL ON FUNCTION public.purge_expired_job_applications() FROM PUBLIC, anon, authenticated;

-- Run nightly by an InsForge schedule (see `insforge schedules list`), which
-- calls this function through the database RPC endpoint.

-- ============================================================================
-- Analytics: anonymous daily counters for posts and jobs (no personal data).
-- They outlive the 7-day application data, so trends stay available.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.content_daily_metrics (
  kind text NOT NULL CHECK (kind IN ('post', 'job')),
  item_id uuid NOT NULL,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  views integer NOT NULL DEFAULT 0,
  applications integer NOT NULL DEFAULT 0,
  PRIMARY KEY (kind, item_id, day)
);
CREATE INDEX IF NOT EXISTS content_daily_metrics_day_idx ON public.content_daily_metrics (kind, day);

ALTER TABLE public.content_daily_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS content_daily_metrics_editor_read ON public.content_daily_metrics;
CREATE POLICY content_daily_metrics_editor_read ON public.content_daily_metrics
  FOR SELECT TO authenticated USING (public.has_section('pages') OR public.has_section('contact'));
REVOKE ALL ON public.content_daily_metrics FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.content_daily_metrics FROM authenticated;
GRANT SELECT ON public.content_daily_metrics TO authenticated;

-- Counts one view of a published post or an open job. Anyone may call it, but
-- it only counts items that are actually public.
CREATE OR REPLACE FUNCTION public.record_content_view(p_kind text, p_item uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF p_kind = 'post' AND NOT EXISTS (SELECT 1 FROM public.blog_posts WHERE id = p_item AND status = 'published') THEN RETURN; END IF;
  IF p_kind = 'job' AND NOT EXISTS (SELECT 1 FROM public.job_postings WHERE id = p_item AND status = 'open') THEN RETURN; END IF;
  IF p_kind NOT IN ('post', 'job') THEN RETURN; END IF;
  INSERT INTO public.content_daily_metrics (kind, item_id, views) VALUES (p_kind, p_item, 1)
  ON CONFLICT (kind, item_id, day) DO UPDATE SET views = content_daily_metrics.views + 1;
END;
$$;
REVOKE ALL ON FUNCTION public.record_content_view(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_content_view(text, uuid) TO anon, authenticated;

-- Every new application bumps that job's daily application counter.
CREATE OR REPLACE FUNCTION public.count_job_application()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  INSERT INTO public.content_daily_metrics (kind, item_id, applications) VALUES ('job', NEW.job_id, 1)
  ON CONFLICT (kind, item_id, day) DO UPDATE SET applications = content_daily_metrics.applications + 1;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS job_applications_count ON public.job_applications;
CREATE TRIGGER job_applications_count AFTER INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.count_job_application();
