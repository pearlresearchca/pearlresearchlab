-- The original site pages are now ordinary page-builder pages: any of them can
-- be deleted except the homepage (empty slug), which always serves "/".
DROP POLICY IF EXISTS cms_pages_editor_delete ON public.cms_pages;
CREATE POLICY cms_pages_editor_delete ON public.cms_pages
  FOR DELETE TO authenticated
  USING (public.has_section('pages') AND slug <> '');
