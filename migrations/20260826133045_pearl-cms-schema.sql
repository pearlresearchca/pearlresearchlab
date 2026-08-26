-- PEARL CMS schema: content tables, roles, audit log, RLS, and seed data
-- matching the current hardcoded site content.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ============================================================================
-- 1. Users & roles
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Any signed-in admin/editor can see the team roster. Writes only happen
-- through server-side admin-key actions (see app/admin), never directly by
-- anon/authenticated roles, so there are no INSERT/UPDATE/DELETE policies here.
CREATE POLICY app_users_select_authenticated ON public.app_users
  FOR SELECT TO authenticated
  USING (true);

GRANT SELECT ON public.app_users TO authenticated;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_editor_or_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'editor')
  );
$$;

-- ============================================================================
-- 2. Audit log
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.content_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  changed_by uuid REFERENCES auth.users(id),
  changed_by_email text,
  old_data jsonb,
  new_data jsonb,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_audit_log_changed_at_idx ON public.content_audit_log (changed_at DESC);
CREATE INDEX IF NOT EXISTS content_audit_log_table_record_idx ON public.content_audit_log (table_name, record_id);

ALTER TABLE public.content_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_audit_log_select_editor ON public.content_audit_log
  FOR SELECT TO authenticated
  USING (public.is_editor_or_admin());

GRANT SELECT ON public.content_audit_log TO authenticated;

CREATE OR REPLACE FUNCTION public.log_content_change()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.set_updated_by()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. page_content — singular text/image blocks per page
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.page_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL,
  key text NOT NULL,
  value_type text NOT NULL DEFAULT 'text' CHECK (value_type IN ('text', 'prose', 'image')),
  value text,
  image_key text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id),
  UNIQUE (page, key)
);

ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY page_content_public_read ON public.page_content
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY page_content_editor_write ON public.page_content
  FOR ALL TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

GRANT SELECT ON public.page_content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.page_content TO authenticated;

CREATE TRIGGER page_content_updated_at BEFORE UPDATE ON public.page_content
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER page_content_updated_by BEFORE INSERT OR UPDATE ON public.page_content
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();
CREATE TRIGGER page_content_audit AFTER INSERT OR UPDATE OR DELETE ON public.page_content
  FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

-- ============================================================================
-- 4. research_areas — shared between Home "streams" and the Research page
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.research_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text NOT NULL,
  home_summary text,
  icon_name text,
  image_url text,
  image_key text,
  show_on_home boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.research_areas ENABLE ROW LEVEL SECURITY;

CREATE POLICY research_areas_public_read ON public.research_areas
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY research_areas_editor_write ON public.research_areas
  FOR ALL TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

GRANT SELECT ON public.research_areas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.research_areas TO authenticated;

CREATE TRIGGER research_areas_updated_at BEFORE UPDATE ON public.research_areas
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER research_areas_updated_by BEFORE INSERT OR UPDATE ON public.research_areas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();
CREATE TRIGGER research_areas_audit AFTER INSERT OR UPDATE OR DELETE ON public.research_areas
  FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

-- ============================================================================
-- 5. about_values — the P·E·A·R·L values grid
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.about_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  letter text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.about_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY about_values_public_read ON public.about_values
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY about_values_editor_write ON public.about_values
  FOR ALL TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

GRANT SELECT ON public.about_values TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.about_values TO authenticated;

CREATE TRIGGER about_values_updated_at BEFORE UPDATE ON public.about_values
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER about_values_updated_by BEFORE INSERT OR UPDATE ON public.about_values
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();
CREATE TRIGGER about_values_audit AFTER INSERT OR UPDATE OR DELETE ON public.about_values
  FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

-- ============================================================================
-- 6. partners — logo library + per-page placements
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text NOT NULL,
  image_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY partners_public_read ON public.partners
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY partners_editor_write ON public.partners
  FOR ALL TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

GRANT SELECT ON public.partners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.partners TO authenticated;

CREATE TRIGGER partners_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER partners_updated_by BEFORE INSERT OR UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();
CREATE TRIGGER partners_audit AFTER INSERT OR UPDATE OR DELETE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

CREATE TABLE IF NOT EXISTS public.partner_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  context text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (partner_id, context)
);

CREATE INDEX IF NOT EXISTS partner_placements_context_idx ON public.partner_placements (context, sort_order);

ALTER TABLE public.partner_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY partner_placements_public_read ON public.partner_placements
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY partner_placements_editor_write ON public.partner_placements
  FOR ALL TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

GRANT SELECT ON public.partner_placements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.partner_placements TO authenticated;

CREATE TRIGGER partner_placements_audit AFTER INSERT OR UPDATE OR DELETE ON public.partner_placements
  FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

-- ============================================================================
-- 7. projects & project_sections
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  index_label text,
  category_label text,
  title text NOT NULL,
  project_name text,
  subtitle text,
  meta_line jsonb NOT NULL DEFAULT '[]'::jsonb,
  banner_image_url text,
  banner_image_key text,
  intro_paragraphs jsonb NOT NULL DEFAULT '[]'::jsonb,
  partners_context text,
  published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_public_read ON public.projects
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY projects_editor_write ON public.projects
  FOR ALL TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

GRANT SELECT ON public.projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.projects TO authenticated;

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER projects_updated_by BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();
CREATE TRIGGER projects_audit AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

CREATE TABLE IF NOT EXISTS public.project_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  heading text NOT NULL,
  body_paragraphs jsonb NOT NULL DEFAULT '[]'::jsonb,
  image_url text,
  image_key text,
  partners_context text,
  sort_order integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS project_sections_project_idx ON public.project_sections (project_id, sort_order);

ALTER TABLE public.project_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_sections_public_read ON public.project_sections
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY project_sections_editor_write ON public.project_sections
  FOR ALL TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

GRANT SELECT ON public.project_sections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.project_sections TO authenticated;

CREATE TRIGGER project_sections_updated_at BEFORE UPDATE ON public.project_sections
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER project_sections_updated_by BEFORE INSERT OR UPDATE ON public.project_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();
CREATE TRIGGER project_sections_audit AFTER INSERT OR UPDATE OR DELETE ON public.project_sections
  FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

-- ============================================================================
-- 8. team_members
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  image_url text,
  image_key text,
  bio_paragraphs jsonb NOT NULL DEFAULT '[]'::jsonb,
  group_key text NOT NULL CHECK (group_key IN ('leadership', 'tfs', 'ift', 'past')),
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS team_members_group_idx ON public.team_members (group_key, sort_order);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_members_public_read ON public.team_members
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY team_members_editor_write ON public.team_members
  FOR ALL TO authenticated
  USING (public.is_editor_or_admin())
  WITH CHECK (public.is_editor_or_admin());

GRANT SELECT ON public.team_members TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.team_members TO authenticated;

CREATE TRIGGER team_members_updated_at BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
CREATE TRIGGER team_members_updated_by BEFORE INSERT OR UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_by();
CREATE TRIGGER team_members_audit AFTER INSERT OR UPDATE OR DELETE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.log_content_change();

-- ============================================================================
-- 9. storage.objects RLS for the site-images bucket
-- ============================================================================

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS storage_objects_owner_select ON storage.objects;
DROP POLICY IF EXISTS storage_objects_owner_insert ON storage.objects;
DROP POLICY IF EXISTS storage_objects_owner_update ON storage.objects;
DROP POLICY IF EXISTS storage_objects_owner_delete ON storage.objects;

CREATE POLICY site_images_public_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket = 'site-images');

CREATE POLICY site_images_editor_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket = 'site-images' AND public.is_editor_or_admin());

CREATE POLICY site_images_editor_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket = 'site-images' AND public.is_editor_or_admin())
  WITH CHECK (bucket = 'site-images' AND public.is_editor_or_admin());

CREATE POLICY site_images_editor_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket = 'site-images' AND public.is_editor_or_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT USAGE ON SCHEMA storage TO anon, authenticated;

-- ============================================================================
-- 10. Seed data — matches the current hardcoded site content
-- ============================================================================

-- 10a. page_content -------------------------------------------------------

INSERT INTO public.page_content (page, key, value_type, value, image_key) VALUES
  ('global', 'brand_logo', 'image', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fimage.png?v=64e5f450f4c288770d0ebf2fce8d892d', 'seed/image.png'),
  ('global', 'footer_blurb', 'text', 'Advancing public health equity through research, advocacy, and collaboration.', NULL),
  ('global', 'footer_tagline', 'text', 'Research for healthier, more equitable communities.', NULL),
  ('global', 'copyright_line', 'text', '© 2026 PEARL Research Lab', NULL),

  ('home', 'hero_eyebrow', 'text', 'Public health equity advocacy research lab', NULL),
  ('home', 'hero_title', 'text', 'Evidence that moves communities forward.', NULL),
  ('home', 'hero_intro', 'text', 'PEARL brings people, systems, and research together to advance healthier, more equitable communities.', NULL),
  ('home', 'hero_image', 'image', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fpatient-community-engagement.png?v=696a691346c9c88ba65e9d1163647eec', 'seed/patient-community-engagement.png'),
  ('home', 'hero_image_caption_1', 'text', 'Community-engaged research in action', NULL),
  ('home', 'hero_image_caption_2', 'text', 'Antigonish, Nova Scotia', NULL),
  ('home', 'statement_eyebrow', 'text', 'Our purpose', NULL),
  ('home', 'statement_title', 'text', 'Health equity is not an outcome we wait for. It is a practice we build into every question, partnership, and decision.', NULL),
  ('home', 'streams_eyebrow', 'text', 'Research at a glance', NULL),
  ('home', 'streams_title', 'text', 'Five connected streams. One shared commitment.', NULL),
  ('home', 'streams_body', 'text', 'Our interdisciplinary work examines the systems and conditions that influence health — and turns evidence into meaningful action.', NULL),
  ('home', 'feature_eyebrow', 'text', 'Featured project', NULL),
  ('home', 'feature_title', 'text', 'Surplus to Solutions', NULL),
  ('home', 'feature_text', 'text', 'Understanding how avoidable food waste is generated and managed at the farm level — and how good food can reach communities instead.', NULL),
  ('home', 'feature_image', 'image', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Ftransforming-food-systems.jpeg?v=67c05551d598dfaa33ddd77c9df93253', 'seed/transforming-food-systems.jpeg'),
  ('home', 'partners_eyebrow', 'text', 'Working alongside', NULL),
  ('home', 'cta_eyebrow', 'text', 'Build better health together', NULL),
  ('home', 'cta_title', 'text', 'Have a question, an idea, or a shared challenge?', NULL),
  ('home', 'cta_text', 'text', 'We welcome collaborations across Canada and internationally.', NULL),

  ('about', 'hero_kicker', 'text', 'About PEARL', NULL),
  ('about', 'hero_title', 'text', 'Research with people, not just about people.', NULL),
  ('about', 'hero_intro', 'text', 'PEARL is an interdisciplinary research lab dedicated to advancing health equity through collaborative, community-engaged, and policy-relevant research.', NULL),
  ('about', 'mission_eyebrow', 'text', 'Our mission', NULL),
  ('about', 'mission_title', 'text', 'To generate actionable, equity-centred research that improves public health and strengthens health systems.', NULL),
  ('about', 'mission_body', 'prose', E'We bring together researchers, students, healthcare providers, policymakers, and community partners to address complex health and social challenges through innovative, evidence-informed approaches.\n\nOur work spans health systems improvement, food security, social determinants of health, patient and caregiver experiences, and the structural factors that shape health outcomes and inequities.', NULL),
  ('about', 'vision_eyebrow', 'text', 'Our vision', NULL),
  ('about', 'vision_title', 'text', 'A future where all individuals and communities have equitable opportunities to achieve health and wellbeing.', NULL),
  ('about', 'vision_body', 'text', 'Where health systems and policies are designed through inclusive, evidence-based, and justice-oriented approaches that address the root causes of inequity.', NULL),
  ('about', 'values_eyebrow', 'text', 'What guides us', NULL),
  ('about', 'values_title', 'text', 'PEARL values', NULL),
  ('about', 'partners_eyebrow', 'text', 'In good company', NULL),
  ('about', 'partners_title', 'text', 'Collaboration is at the heart of our work.', NULL),
  ('about', 'partners_body', 'text', 'We partner with community organizations, healthcare providers, academic institutions, policymakers, and industry partners to conduct research that addresses real-world challenges and is translated into meaningful action.', NULL),

  ('research', 'hero_kicker', 'text', 'Research', NULL),
  ('research', 'hero_title', 'text', 'Research that connects evidence to action.', NULL),
  ('research', 'hero_intro', 'text', E'Our work is grounded in the belief that improving health requires action across the social, economic, environmental, and policy systems that influence people''s lives.', NULL),

  ('projects', 'hero_kicker', 'text', 'Projects', NULL),
  ('projects', 'hero_title', 'text', 'Current work, built for real-world change.', NULL),
  ('projects', 'hero_intro', 'text', 'Explore the projects where PEARL researchers and partners are working together to make health systems and communities more equitable.', NULL),

  ('team', 'hero_kicker', 'text', 'The people behind the work', NULL),
  ('team', 'hero_title', 'text', 'Meet the PEARL team.', NULL),
  ('team', 'hero_intro', 'text', 'We are researchers, students, practitioners, and community partners working across disciplines and lived experiences.', NULL),
  ('team', 'intro_eyebrow', 'text', 'A collaborative lab', NULL),
  ('team', 'intro_title', 'text', 'Different disciplines. One shared commitment to health equity.', NULL),
  ('team', 'intro_body', 'text', 'PEARL brings together researchers and emerging scholars whose work connects public health, health systems, food systems, policy, and community experience. Our team works across research streams to turn evidence into meaningful change.', NULL),
  ('team', 'leadership_eyebrow', 'text', 'Leadership & coordination', NULL),
  ('team', 'leadership_title', 'text', 'Guiding the work', NULL),
  ('team', 'research_team_eyebrow', 'text', 'Research team', NULL),
  ('team', 'research_team_title', 'text', 'Working across PEARL research streams', NULL),
  ('team', 'cta_eyebrow', 'text', 'Work with us', NULL),
  ('team', 'cta_title', 'text', 'Have a question about our research or a potential collaboration?', NULL),

  ('contact', 'hero_kicker', 'text', 'Get in touch', NULL),
  ('contact', 'hero_title', 'text', E'Let''s build healthier communities together.', NULL),
  ('contact', 'hero_intro', 'text', 'Whether you are interested in collaborating on research, exploring partnership opportunities, or joining the PEARL team, we would be happy to connect.', NULL),
  ('contact', 'collab_eyebrow', 'text', 'Ways to work with us', NULL),
  ('contact', 'collab_title', 'text', 'We want to hear from you.', NULL),
  ('contact', 'collab_body', 'text', 'Two of the most common ways people work with PEARL — if either sounds like you, reach out below.', NULL),
  ('contact', 'start_title', 'text', 'Start a conversation', NULL),
  ('contact', 'start_body', 'text', 'Tell us a little about what you are working on or how we might collaborate.', NULL),
  ('contact', 'address', 'prose', E'PEARL Research Lab\nSt. Francis Xavier University\nAntigonish, Nova Scotia', NULL),
  ('contact', 'hours', 'text', 'Monday – Friday, 9am – 5pm', NULL)
ON CONFLICT (page, key) DO NOTHING;

-- 10b. research_areas -------------------------------------------------------

INSERT INTO public.research_areas (title, summary, home_summary, icon_name, image_url, image_key, show_on_home, sort_order) VALUES
  ('Health systems & services',
   'How healthcare services are organized, delivered, and experienced to improve access, quality, efficiency, and equity.',
   'Improving how care is organized, delivered, and experienced to strengthen access, quality, and equity.',
   'HeartPulse',
   'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fhealth-systems-services.jpeg?v=b6530b9b9d21abe7a7bab24648dcdd6c', 'seed/health-systems-services.jpeg',
   true, 0),
  ('Health equity & access to care',
   'Identifying and addressing the structural and social barriers that contribute to inequities in health outcomes and healthcare access.',
   'Addressing structural and social barriers that shape health outcomes and healthcare access.',
   'Scale',
   'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fhealth-equity-access-to-care.jpeg?v=9090a896de772faa711caee1b725436e', 'seed/health-equity-access-to-care.jpeg',
   true, 1),
  ('Transforming food systems',
   'Exploring pathways toward more sustainable, equitable, and resilient food systems that promote food security and community wellbeing.',
   'Exploring sustainable, equitable, and resilient food systems that support food security and wellbeing.',
   'Leaf',
   'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Ftransforming-food-systems.jpeg?v=67c05551d598dfaa33ddd77c9df93253', 'seed/transforming-food-systems.jpeg',
   true, 2),
  ('Patient & community engagement',
   E'Partnering with patients, caregivers, and communities to ensure research reflects lived experiences, local priorities, and meaningful participation.',
   E'Partnering with communities to ensure research reflects lived experience and local priorities.',
   'Network',
   'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fpatient-community-engagement.png?v=696a691346c9c88ba65e9d1163647eec', 'seed/patient-community-engagement.png',
   true, 3),
  ('Health policy, implementation & advocacy',
   'Generating evidence that informs policy, supports implementation, and drives meaningful change across health and social systems.',
   NULL, NULL,
   'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fhealth-policy-implementation-advocacy.jpeg?v=2a1296f3438231255f0daaefbe0cf587', 'seed/health-policy-implementation-advocacy.jpeg',
   false, 4);

-- 10c. about_values -----------------------------------------------------

INSERT INTO public.about_values (letter, title, body, sort_order) VALUES
  ('P', 'Partnership', 'Building meaningful collaborations with communities, patients, researchers, and policymakers.', 0),
  ('E', 'Equity', 'Centering health equity and social justice in all aspects of our work.', 1),
  ('A', 'Advocacy', 'Translating evidence into action to advance policy and systems change.', 2),
  ('R', 'Research excellence', 'Conducting rigorous, ethical, and innovative interdisciplinary research.', 3),
  ('L', 'Leadership', 'Fostering future leaders and driving transformative change in public health.', 4);

-- 10d. partners + placements ----------------------------------------------

INSERT INTO public.partners (id, name, image_url, image_key) VALUES
  ('22222222-2222-4222-8222-222222222201', 'St. Francis Xavier University', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fpartners.png?v=0e3d5395a12b6603008702b7960319f2', 'seed/partners.png'),
  ('22222222-2222-4222-8222-222222222202', 'Acadia University', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fpartners-2-.png?v=ba5d10cda8df30b964a378b90f66fdc6', 'seed/partners-2-.png'),
  ('22222222-2222-4222-8222-222222222203', 'Second Harvest', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fpartners-3-.png?v=e69fc8e50b8154d4bb249c422a1a1be4', 'seed/partners-3-.png'),
  ('22222222-2222-4222-8222-222222222204', E'Farmers'' Market Antigonish', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fpartners-4-.png?v=12afc0f4bf10aade7a62aa17ded0f670', 'seed/partners-4-.png'),
  ('22222222-2222-4222-8222-222222222205', 'FarmWorks Investment Co-operative', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fpartners-5-.png?v=585a8a25a4318695933190b47afe98b4', 'seed/partners-5-.png'),
  ('22222222-2222-4222-8222-222222222206', 'Mount Saint Vincent University', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fpartners-6-.png?v=6fd44799567528b29650610a251c5ea1', 'seed/partners-6-.png'),
  ('22222222-2222-4222-8222-222222222207', 'Rural Futures Research Collaborative', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fpartners-7-.png?v=4d25ffc9241d0989ec2bd288505c376d', 'seed/partners-7-.png'),
  ('22222222-2222-4222-8222-222222222208', 'Nova Scotia Federation of Agriculture', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fpartners-8-.png?v=e32575e873299b0cd48b3b453a53f52a', 'seed/partners-8-.png'),
  ('22222222-2222-4222-8222-222222222209', 'Dalhousie University', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fdalhouse.png?v=8917873fec70bfa6728834e08359bf81', 'seed/dalhouse.png'),
  ('22222222-2222-4222-8222-222222222210', 'Emergency Health Services', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fehs.png?v=653195bf1f7d092391a5f95e8410d42f', 'seed/ehs.png'),
  ('22222222-2222-4222-8222-222222222211', 'EMC', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Femc.png?v=61d76506bcf269544b760777671b3828', 'seed/emc.png'),
  ('22222222-2222-4222-8222-222222222212', 'Nova Scotia Health', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fnv-health.png?v=c7b9ab554f9e95e392ce2aadf8994543', 'seed/nv-health.png'),
  ('22222222-2222-4222-8222-222222222213', 'Care Coordination Centre', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fc3-vertical.png?v=48c82eaa1fd3af8daa5861dd83e584c7', 'seed/c3-vertical.png');

INSERT INTO public.partner_placements (partner_id, context, sort_order) VALUES
  ('22222222-2222-4222-8222-222222222201', 'home', 0),
  ('22222222-2222-4222-8222-222222222202', 'home', 1),
  ('22222222-2222-4222-8222-222222222203', 'home', 2),
  ('22222222-2222-4222-8222-222222222206', 'home', 3),
  ('22222222-2222-4222-8222-222222222209', 'home', 4),
  ('22222222-2222-4222-8222-222222222210', 'home', 5),
  ('22222222-2222-4222-8222-222222222212', 'home', 6),
  ('22222222-2222-4222-8222-222222222205', 'home', 7),

  ('22222222-2222-4222-8222-222222222203', 'about', 0),
  ('22222222-2222-4222-8222-222222222202', 'about', 1),
  ('22222222-2222-4222-8222-222222222207', 'about', 2),
  ('22222222-2222-4222-8222-222222222201', 'about', 3),
  ('22222222-2222-4222-8222-222222222204', 'about', 4),
  ('22222222-2222-4222-8222-222222222206', 'about', 5),
  ('22222222-2222-4222-8222-222222222205', 'about', 6),
  ('22222222-2222-4222-8222-222222222208', 'about', 7),

  ('22222222-2222-4222-8222-222222222206', 'project-tfs', 0),
  ('22222222-2222-4222-8222-222222222209', 'project-tfs', 1),
  ('22222222-2222-4222-8222-222222222202', 'project-tfs', 2),
  ('22222222-2222-4222-8222-222222222203', 'project-tfs', 3),
  ('22222222-2222-4222-8222-222222222205', 'project-tfs', 4),

  ('22222222-2222-4222-8222-222222222210', 'project-ift', 0),
  ('22222222-2222-4222-8222-222222222211', 'project-ift', 1),
  ('22222222-2222-4222-8222-222222222212', 'project-ift', 2),
  ('22222222-2222-4222-8222-222222222213', 'project-ift', 3);

-- 10e. projects + project_sections ------------------------------------------

INSERT INTO public.projects (id, slug, index_label, category_label, title, project_name, subtitle, meta_line, banner_image_url, banner_image_key, intro_paragraphs, partners_context, sort_order) VALUES
(
  '11111111-1111-4111-8111-111111111101',
  'surplus-to-solutions',
  '01',
  'Active research / Food systems',
  'Transforming Food Systems',
  'Surplus to Solutions',
  'Enhancing farm-level food redistribution of avoidable edible food waste in rural Nova Scotia',
  '["Rural Nova Scotia", "Community-based participatory research"]'::jsonb,
  'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Ftfs.jpeg?v=de02054b4a9f90612ef0f6cb83fee0ad',
  'seed/tfs.jpeg',
  jsonb_build_array(
    $$Food waste and food insecurity exist alongside one another across Canada. While substantial amounts of food are lost or wasted throughout the food system, many communities continue to face barriers to accessing nutritious and affordable food. In rural Nova Scotia, these challenges are shaped by the realities of agricultural production, geography, transportation, infrastructure, seasonal availability, labour, markets, and connections between producers and community food organizations.$$,
    $$Surplus to Solutions examines how avoidable food waste is generated and managed at the farm level and how food that could still be consumed can be redirected to communities rather than becoming waste. The project focuses on the pathways through which farm-level surplus moves, or does not move, toward food rescue organizations and community food programs, and on the conditions that make redistribution possible.$$,
    $$The project brings together researchers, farmers, food rescue organizations, food-system partners, and community stakeholders to examine avoidable food waste as a systems issue rather than simply an issue of individual behaviour. Decisions about surplus are influenced by interconnected economic, logistical, social, behavioural, institutional, and policy factors. Understanding these factors is essential to developing approaches that are practical for farmers and sustainable for the organizations receiving and redistributing food.$$,
    $$The research is led through an interdisciplinary collaboration at PEARL Lab, St. Francis Xavier University, bringing together expertise in public health, food systems, agriculture, behavioural science, rural sociology, and community-based research. The project also involves collaborators from Mount Saint Vincent University, Dalhousie University, and Acadia University, alongside community and food-system partners including Second Harvest and FarmWorks Investment Co-operative. These partnerships connect academic expertise with the experiences and networks of farmers, food rescue organizations, and community food systems.$$
  ),
  'project-tfs',
  0
),
(
  '11111111-1111-4111-8111-111111111102',
  'interfacility-patient-transfers',
  '02',
  'Active research / Health systems & services',
  'Interfacility Patient Transfers',
  NULL,
  'Advancing equitable and integrated non-urgent interfacility patient transfers in Nova Scotia',
  '[]'::jsonb,
  NULL,
  NULL,
  jsonb_build_array(
    $$Non-urgent interfacility patient transfers (IFTs) are an essential but often overlooked component of healthcare delivery. Patients may need to move between healthcare facilities to access specialized consultations, diagnostic procedures, rehabilitation, ongoing treatment, or care closer to home. In Nova Scotia, where specialized services are often concentrated in regional centres and many communities are geographically dispersed, effective interfacility transfer systems are critical to ensuring that patients can access the care they need, when they need it.$$,
    $$Yet moving a patient between facilities is much more than arranging transportation. Every transfer involves clinical decision-making, coordination between sending and receiving facilities, transportation and staffing resources, communication across healthcare teams, and decisions about timing and prioritization. These processes operate across organizational and geographic boundaries, making non-urgent IFTs both operationally complex and important to health equity. As our research has demonstrated, an interfacility transfer can simultaneously be a clinical handoff, a logistical process, and an equity decision.$$
  ),
  NULL,
  1
);

INSERT INTO public.project_sections (project_id, heading, body_paragraphs, image_url, image_key, partners_context, sort_order) VALUES
(
  '11111111-1111-4111-8111-111111111101',
  'Understanding avoidable food waste at the farm level',
  jsonb_build_array(
    $$A central focus of the research is understanding what happens to food that is produced but does not enter conventional markets or reach consumers. Food may become surplus for many different reasons. Market conditions, changing demand, production volumes, seasonal timing, quality or appearance standards, labour availability, storage capacity, transportation, and limited connections to redistribution organizations can all influence what happens to food after it has been produced.$$,
    $$The project therefore looks beyond how much food is wasted to understand the pathways, decisions, and conditions that shape what happens to avoidable food waste.$$,
    $$We are particularly interested in understanding the experiences of farmers and the practical realities they face when considering whether and how surplus food can be redistributed. For redistribution to be a realistic option, farmers need pathways that fit within their existing operations and account for timing, labour, storage, transportation, food safety, costs, and connections with organizations that can receive the food.$$
  ),
  'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Ffarm-level.jpeg?v=bdc2c3d2c822b48eb1f93cd85d8453fa',
  'seed/farm-level.jpeg',
  NULL, 0
),
(
  '11111111-1111-4111-8111-111111111101',
  'Food redistribution as a systems issue',
  jsonb_build_array(
    $$Avoidable food waste does not occur within a single part of the food system. The ability to redistribute surplus depends on relationships between producers, food rescue organizations, community food programs, transportation providers, and other actors.$$,
    $$Our research therefore examines the broader system surrounding farm-level food redistribution, including the behavioural, logistical, economic, social, institutional, and policy factors that can enable or constrain action. This includes understanding where existing redistribution pathways work well, where they break down, and what gaps in infrastructure, resources, coordination, or partnerships may prevent food from reaching communities.$$
  ),
  NULL, NULL, NULL, 1
),
(
  '11111111-1111-4111-8111-111111111101',
  'Collaborative and community-based research',
  jsonb_build_array(
    $$The project uses a community-based participatory research approach, bringing people working within the food system into the research process. Farmers, food rescue organizations, food-system partners, service providers, and other stakeholders will contribute to understanding the current system, identifying priorities, and shaping potential solutions.$$,
    $$This collaborative approach allows research findings to be considered alongside practical knowledge from people who work directly within agricultural production, food rescue, and community food systems.$$
  ),
  NULL, NULL, NULL, 2
),
(
  '11111111-1111-4111-8111-111111111101',
  'Building a more connected rural food system',
  jsonb_build_array(
    $$Surplus to Solutions is about understanding how good food can remain within the food system for longer and reach people who can use it.$$,
    $$By connecting farmers, food rescue organizations, researchers, and community partners, the project aims to identify ways to reduce avoidable food waste while strengthening local food redistribution pathways. The goal is a more connected rural food system in which farmers have realistic options for managing surplus, food rescue organizations can access food through stronger and more reliable pathways, and communities can benefit from food that might otherwise be lost.$$
  ),
  NULL, NULL, NULL, 3
),
(
  '11111111-1111-4111-8111-111111111102',
  E'PEARL''s research program',
  jsonb_build_array(
    $$The Public Health, Equity, and Advocacy Research Lab (PEARL Lab) at St. Francis Xavier University examines how non-urgent interfacility transfer systems function across Nova Scotia and how they can better support timely, efficient, safe, and equitable access to healthcare. The work is conducted in collaboration with Emergency Health Services (EHS), Emergency Medical Care Inc. (EMC), Nova Scotia Health, the Care Coordination Centre, and other health-system and research partners.$$
  ),
  NULL, NULL, 'project-ift', 0
),
(
  '11111111-1111-4111-8111-111111111102',
  'A systems-level approach',
  jsonb_build_array(
    $$The program takes a systems-level approach to understanding interfacility transfers. Rather than examining transfer performance through a single measure or perspective, we consider how policies, governance structures, operational processes, technologies, healthcare capacity, geography, and patient and provider experiences interact to shape the transfer pathway. Our overarching question is: what works, for whom, under what circumstances, and through which mechanisms do non-urgent interfacility patient transfer systems support timely, efficient, and equitable access to healthcare?$$,
    $$Our work to date has included examining policies and practices governing non-urgent IFTs across federal, provincial, and organizational levels, with particular attention to how equity is reflected in transfer systems. We have explored the relationship between policy intent and day-to-day practice, including the effects of capacity constraints, communication and information gaps, technology-related workflow challenges, and coordination across organizations.$$,
    $$The research is also informed by evidence from Canada and internationally. Through realist-informed evidence synthesis and jurisdictional research, we examine how different transfer systems are organized, what approaches appear to support effective coordination, and how contextual factors influence outcomes. This includes consideration of patient and family involvement in transfer decision-making and care transitions, recognizing that the experience of an interfacility transfer extends beyond the healthcare organizations and transportation services involved.$$
  ),
  'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fapproach.jpeg?v=1449f399d5cad5b761e84b31c78c681d',
  'seed/approach.jpeg',
  NULL, 1
),
(
  '11111111-1111-4111-8111-111111111102',
  'Health equity as a central theme',
  jsonb_build_array(
    $$A central theme across the program is health equity. Traditional measures of transfer performance can provide useful information about overall system efficiency while obscuring differences between populations and communities. A province-wide average transfer time, for example, may not reveal whether rural communities experience longer waits, whether patients with complex mobility needs face different barriers, or whether certain groups experience higher cancellation or re-dispatch rates. Our research therefore considers how geography, rurality, patient and care needs, and other population characteristics can shape access to and experiences of the transfer system.$$,
    $$Building on this foundation, the research program is moving toward a more comprehensive evaluation of transfer-system performance. Quantitative analyses of operational and administrative data will examine patterns in transfer utilization, timeliness, efficiency, completion, cancellations, resource use, changes over time, and differences across geographic and population groups. These analyses will complement the qualitative and policy research by providing an empirical picture of how the system performs across Nova Scotia.$$,
    $$This work will also inform the development of an equity-informed key performance indicator framework for non-urgent IFTs. Rather than treating equity as an additional consideration after performance has been measured, the framework will explore how equity can be incorporated directly into routine monitoring and evaluation. Indicators will be considered not only for their relevance to efficiency and quality, but also for their ability to identify differences in transfer experiences and outcomes that may otherwise be hidden by aggregate reporting.$$
  ),
  NULL, NULL, NULL, 2
),
(
  '11111111-1111-4111-8111-111111111102',
  'The next stage',
  jsonb_build_array(
    $$The next stage of the program will also examine eBooking and structured prioritization approaches, including the development and evaluation of a prioritization matrix for non-urgent transfers. This work will build on what we have learned about policy, equity, system functioning, and operational realities to explore how transfer requests can be prioritized more consistently and transparently while accounting for patient needs, timing, system capacity, and equity considerations.$$,
    $$Together, these strands of research create a continuous pathway from understanding the current transfer system to identifying opportunities for improvement and evaluating whether those improvements make a meaningful difference. Evidence from policy analysis, realist research, stakeholder and patient perspectives, jurisdictional comparisons, quantitative system data, and emerging approaches to transfer coordination will be considered together rather than in isolation.$$,
    $$Ultimately, the goal of this research is not simply to move patients faster. It is to help build a transfer system in which patients can access the appropriate care safely, efficiently, and equitably, regardless of where they live or the circumstances that shape their healthcare journey. By connecting health-system research with policy, implementation, measurement, and equity, this program aims to generate practical evidence that can strengthen non-urgent interfacility transfers in Nova Scotia and contribute to broader efforts to improve integrated healthcare delivery.$$
  ),
  NULL, NULL, NULL, 3
);

-- 10f. team_members -----------------------------------------------------

INSERT INTO public.team_members (name, role, image_url, image_key, bio_paragraphs, group_key, sort_order) VALUES
(
  'Dr. Mahasti Khakpour', 'Supervisor & Director',
  'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fdr.-mahasti-khakpour.png?v=cf152e47268367b781cbf9cfc141726b', 'seed/dr.-mahasti-khakpour.png',
  jsonb_build_array(
    $$Dr. Mahasti Khakpour is the Director of the Public Health Equity Advocacy Research Lab (PEARL) and an Assistant Professor at St. Francis Xavier University. With over eight years of research experience, she is an interdisciplinary health researcher specializing in public health, health equity, food systems, and health economics.$$,
    $$She earned her Ph.D. from the University of Saskatchewan, where her research examined food security among refugees, laying the foundation for her ongoing work with vulnerable populations, including immigrants and refugees. Her research has spanned Canada, Pakistan, Iran, Switzerland, and Australia, focusing on improving health outcomes through innovative, community-engaged approaches.$$,
    $$Through PEARL, Dr. Khakpour leads collaborative research that advances equitable, sustainable, and evidence-informed solutions to complex public health challenges.$$
  ),
  'leadership', 0
),
(
  'Safa Zohara', 'Lab Manager',
  'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fsafa-zohara.jpeg?v=3121226012530a061a99535db3fcea89', 'seed/safa-zohara.jpeg',
  jsonb_build_array(
    $$Safa supports research focused on health systems, health equity, and food systems. Her work centers on improving access to care, addressing the social determinants of health, and advancing equitable health outcomes for underserved populations.$$,
    $$She has coordinated interdisciplinary research projects, conducted health policy and systems analyses, and supported grant development that has secured significant research funding.$$,
    $$Safa is passionate about translating evidence into practical solutions that strengthen health systems and improve community well-being.$$
  ),
  'leadership', 1
),
(
  'Evan Wilson', 'Masters Thesis Student',
  'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fevan.png?v=8b85546feb0b839f6bf9a52a58593711', 'seed/evan.png',
  jsonb_build_array(
    $$Evan supports research focused on sustainable agriculture, food security, and food sovereignty. His work explores how food systems can be transformed to promote environmental sustainability, community resilience, and equitable access to healthy food.$$,
    $$He is a Master of Environmental Sciences student at St. Francis Xavier University, where his research builds on his previous work in Human Nutrition. His honours research examined the development of a healthy Maritime dietary pattern using foods sourced from Atlantic Canada.$$,
    $$Alongside his academic work, Evan is a farmer, founder of the StFX Community Agriculture Program, and Co-President of the Second Harvest National Youth Council, advocating for more sustainable and equitable food systems across Canada.$$
  ),
  'tfs', 0
),
(
  'Sophie Purcell', 'Research Assistant',
  'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fsophie.jpeg?v=b925ab0a7e05c3d17e1b5204aef669ea', 'seed/sophie.jpeg',
  jsonb_build_array(
    $$Sophie is a fourth-year student at St. Francis Xavier University pursuing a Bachelor of Science in Human Nutrition with an Advanced Major in Food Entrepreneurship. Her academic interests include food product development, food systems, and sustainable living.$$,
    $$As a research assistant, Sophie contributes to a project on avoidable food waste at the primary production level in Nova Scotia. She is conducting a grey literature review to identify policies, best practices, and knowledge gaps related to food loss and food rescue, informing future data collection and recommendations for more sustainable and equitable food systems.$$,
    $$Outside this project, Sophie is active in the StFX community and has contributed to research on barriers to venture capital for diverse women-founded businesses.$$
  ),
  'tfs', 1
),
(
  'Najibah Kazi', 'Research Assistant',
  'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fnajibah.png?v=20c6f56a23b88c103d445bf57745709e', 'seed/najibah.png',
  jsonb_build_array(
    $$Najibah is a third-year BaSC student in Health. She started working as a research assistant for the PEARL Lab during the summer of 2025. Her research focuses on the impact of food policy and governance on health.$$,
    $$Najibah's hometown is Antigonish, where she enjoys volunteering around the town.$$,
    $$In the future, she hopes to continue exploring research around barriers to mental health and wellbeing.$$
  ),
  'tfs', 2
),
(
  'Paige Edgar', 'Research Assistant',
  'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fpaige.png?v=eccb4025f8e0146cd5a3de60133ab664', 'seed/paige.png',
  jsonb_build_array(
    $$Paige is a third-year student in the BASc Health program at St. Francis Xavier University and is working as a research assistant in the PEARL Lab.$$,
    $$She is contributing to the Transforming Food Systems project, with a focus on the facilitators and barriers that influence the use of digital tools to support the redistribution of food waste at the farm level.$$,
    $$Her research interests include the broader social determinants of health and their impact on individual and population health.$$
  ),
  'tfs', 3
),
(
  'Evelyn Christopher', 'Research Assistant',
  'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fevelyn.png?v=1afefa8ee392b0653f9fa97789881cda', 'seed/evelyn.png',
  jsonb_build_array(
    $$Evelyn recently graduated from Western University with a Master of Public Health. As a Research Assistant with the PEARL Lab, she supports the development of knowledge dissemination products and contributes to research aimed at advancing equitable, evidence-informed healthcare.$$,
    $$Evelyn is passionate about public health, health equity, and creating environments where people have the opportunity to achieve their best possible health. She is particularly interested in health promotion and translating research into accessible resources that can inform policy and practice.$$,
    $$Outside of research, Evelyn enjoys hiking, baking, painting, and playing basketball.$$
  ),
  'ift', 0
),
(
  'Erin Cunningham', 'Research Assistant',
  'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Ferin.jpeg?v=a1437e59879463b2fffae2766a054e2f', 'seed/erin.jpeg',
  jsonb_build_array(
    $$Erin graduated from St. Francis Xavier University with a Bachelor of Arts and Science in Health. She is a Research Assistant with the Public Health & Equity Advocacy Research Lab (PEARL).$$,
    $$She supports projects focused on health equity and informing systems through policy reviews, evidence synthesis, knowledge translation, and program evaluation.$$,
    $$Erin's interests include public health, health equity, program evaluation, and knowledge translation. She enjoys applying evidence to support practical solutions that strengthen communities and improve health outcomes.$$
  ),
  'ift', 1
),
(
  'Elmirah Ahmad', 'Research Assistant',
  'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Felmirah-ahmad-research-assistant.jpeg?v=bffd6b1918e2b8f64243697c9b7a6861', 'seed/elmirah-ahmad-research-assistant.jpeg',
  jsonb_build_array(
    $$Elmirah is a Master of Public Health student at Western University completing her practicum with the Public Health Equity Advocacy and Research (PEARL) Lab.$$,
    $$She is currently involved in the non-urgent interfacility transfers in Nova Scotia project, where she supports qualitative research and policy analysis to better understand barriers within the patient transfer system.$$,
    $$She is interested in health systems, health equity, and using research to inform practical solutions that improve access to care.$$
  ),
  'past', 0
),
(
  'Prachi Ajay Dabholkar', 'Research Assistant',
  'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/seed%2Fprachi-ajay-dabholkar-research-assistant.jpeg?v=7873121a01c2668d699b4e128d2a675d', 'seed/prachi-ajay-dabholkar-research-assistant.jpeg',
  jsonb_build_array(
    $$Prachi is a Research Assistant at the Public Health Equity Advocacy and Research (PEARL) Lab.$$,
    $$She is currently working on the Non-Urgent Interfacility Transfers in Nova Scotia project, where she contributes to equity-focused policy analysis, qualitative research, and geospatial analysis to better understand interfacility transfer patterns, access, and service delivery across the province.$$,
    $$Her research interests include health systems, health equity, and improving access to care for underserved and equity-deserving populations.$$
  ),
  'past', 1
);
