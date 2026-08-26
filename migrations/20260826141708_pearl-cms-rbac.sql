-- Section-level RBAC: editors are granted specific sections instead of
-- blanket write access to every content table.

ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS sections text[] NOT NULL DEFAULT '{}';

-- Admins implicitly have every section; editors need the section in their list.
CREATE OR REPLACE FUNCTION public.has_section(section text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = (SELECT auth.uid())
      AND (role = 'admin' OR section = ANY(sections))
  );
$$;

-- "Has access to the admin panel at all" — any granted section, or admin.
CREATE OR REPLACE FUNCTION public.is_editor_or_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = (SELECT auth.uid())
      AND (role = 'admin' OR cardinality(sections) > 0)
  );
$$;

-- page_content spans multiple sections via its `page` column.
DROP POLICY IF EXISTS page_content_editor_write ON public.page_content;
CREATE POLICY page_content_editor_write ON public.page_content
  FOR ALL TO authenticated
  USING (public.has_section(page))
  WITH CHECK (public.has_section(page));

DROP POLICY IF EXISTS research_areas_editor_write ON public.research_areas;
CREATE POLICY research_areas_editor_write ON public.research_areas
  FOR ALL TO authenticated
  USING (public.has_section('research'))
  WITH CHECK (public.has_section('research'));

DROP POLICY IF EXISTS about_values_editor_write ON public.about_values;
CREATE POLICY about_values_editor_write ON public.about_values
  FOR ALL TO authenticated
  USING (public.has_section('about'))
  WITH CHECK (public.has_section('about'));

DROP POLICY IF EXISTS partners_editor_write ON public.partners;
CREATE POLICY partners_editor_write ON public.partners
  FOR ALL TO authenticated
  USING (public.has_section('partners'))
  WITH CHECK (public.has_section('partners'));

DROP POLICY IF EXISTS partner_placements_editor_write ON public.partner_placements;
CREATE POLICY partner_placements_editor_write ON public.partner_placements
  FOR ALL TO authenticated
  USING (public.has_section('partners'))
  WITH CHECK (public.has_section('partners'));

DROP POLICY IF EXISTS projects_editor_write ON public.projects;
CREATE POLICY projects_editor_write ON public.projects
  FOR ALL TO authenticated
  USING (public.has_section('projects'))
  WITH CHECK (public.has_section('projects'));

DROP POLICY IF EXISTS project_sections_editor_write ON public.project_sections;
CREATE POLICY project_sections_editor_write ON public.project_sections
  FOR ALL TO authenticated
  USING (public.has_section('projects'))
  WITH CHECK (public.has_section('projects'));

DROP POLICY IF EXISTS team_members_editor_write ON public.team_members;
CREATE POLICY team_members_editor_write ON public.team_members
  FOR ALL TO authenticated
  USING (public.has_section('team'))
  WITH CHECK (public.has_section('team'));

-- Existing admin accounts keep working (role = 'admin' bypasses has_section),
-- but give any pre-existing non-admin accounts full access to every section
-- so nobody currently relying on the old blanket-editor behavior is locked out.
UPDATE public.app_users
SET sections = ARRAY['home','about','research','projects','team','partners','contact','global']
WHERE role != 'admin' AND cardinality(sections) = 0;
