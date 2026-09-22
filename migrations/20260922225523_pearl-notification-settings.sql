-- Form email settings (who gets notified, whether senders get a thank-you)
-- live in cms_settings under key 'notifications'. Unlike the other settings
-- they hold private email addresses, so only admins may read or change them;
-- the server reads them with the admin key when a form is submitted.

DROP POLICY IF EXISTS cms_settings_public_read ON public.cms_settings;
CREATE POLICY cms_settings_public_read ON public.cms_settings
  FOR SELECT TO anon, authenticated
  USING (key <> 'notifications' OR public.is_admin());

DROP POLICY IF EXISTS cms_settings_editor_write ON public.cms_settings;
CREATE POLICY cms_settings_editor_write ON public.cms_settings
  FOR ALL TO authenticated
  USING (CASE WHEN key = 'site' THEN public.has_section('global') OR public.has_section('seo')
              WHEN key = 'notifications' THEN public.is_admin()
              ELSE public.has_section('design') END)
  WITH CHECK (CASE WHEN key = 'site' THEN public.has_section('global') OR public.has_section('seo')
                   WHEN key = 'notifications' THEN public.is_admin()
                   ELSE public.has_section('design') END);
