-- Reliability fixes from the failure-scenario audit.

-- ============================================================================
-- F6: duplicate form submissions and flooding
-- ============================================================================

-- One token per form fill; a resubmit of the same fill is ignored.
ALTER TABLE public.cms_form_submissions ADD COLUMN IF NOT EXISTS client_token uuid;
-- Salted hash of the sender's IP, only used for rate limiting.
ALTER TABLE public.cms_form_submissions ADD COLUMN IF NOT EXISTS ip_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS cms_form_submissions_client_token_key ON public.cms_form_submissions (client_token);
CREATE INDEX IF NOT EXISTS cms_form_submissions_ip_recent_idx ON public.cms_form_submissions (ip_hash, created_at DESC);

-- ============================================================================
-- F9: optimistic concurrency for global settings and reusable blocks
-- ============================================================================

ALTER TABLE public.cms_settings ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
ALTER TABLE public.cms_blocks ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

DROP TRIGGER IF EXISTS cms_settings_version ON public.cms_settings;
CREATE TRIGGER cms_settings_version BEFORE UPDATE ON public.cms_settings
  FOR EACH ROW EXECUTE FUNCTION public.cms_pages_bump_version();
DROP TRIGGER IF EXISTS cms_blocks_version ON public.cms_blocks;
CREATE TRIGGER cms_blocks_version BEFORE UPDATE ON public.cms_blocks
  FOR EACH ROW EXECUTE FUNCTION public.cms_pages_bump_version();

-- ============================================================================
-- F15: the same file can't be stored twice in the media library
-- ============================================================================

DROP INDEX IF EXISTS public.cms_media_checksum_idx;
CREATE UNIQUE INDEX IF NOT EXISTS cms_media_checksum_key ON public.cms_media (checksum) WHERE checksum IS NOT NULL;

-- ============================================================================
-- F10: classic editors save all fields of a form in one transaction
-- ============================================================================

-- SECURITY INVOKER: row-level security still decides what the caller may write.
CREATE OR REPLACE FUNCTION public.set_page_content_fields(p_page text, p_values jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  INSERT INTO public.page_content (page, key, value_type, value)
  SELECT p_page, e.key, 'text', e.value
  FROM jsonb_each_text(p_values) AS e
  ON CONFLICT (page, key) DO UPDATE SET value = EXCLUDED.value;
END;
$$;

REVOKE ALL ON FUNCTION public.set_page_content_fields(text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_page_content_fields(text, jsonb) TO authenticated;
