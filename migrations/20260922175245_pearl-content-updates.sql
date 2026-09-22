-- Content updates: Contact page (community partnerships + message form copy),
-- sample images for TFS/IFT sections, and cleanup of the completed-research
-- project that was started in the admin panel (slug 'research').

-- ============================================================================
-- 1. Contact page copy
-- ============================================================================

INSERT INTO public.page_content (page, key, value_type, value) VALUES
  ('contact', 'partnerships_title', 'text', 'Community Partnerships and Engagement'),
  ('contact', 'partnerships_intro', 'prose', $$PEARL welcomes connections with community members, community-based organizations, health-system partners, hospitals and health centres, public-health and social-service providers, professional associations, policymakers, advocacy groups, researchers, and networks working to advance health equity and community well-being.

Our work is grounded in reciprocal, respectful, and community-informed engagement. We value the knowledge held by communities, people with lived and living experience, frontline providers, health professionals, and partner organizations. We seek to listen, learn, share evidence, and explore collaborative responses to priorities identified by communities and partners.$$),
  ('contact', 'interests_title', 'text', 'Areas of Interest'),
  ('contact', 'interests_list', 'prose', $$Health equity and social determinants of health
Food security, food rescue, and sustainable food systems
Poverty reduction, affordable housing, and social inclusion
Health systems, health policy, and equitable access to care
Rural health, transportation, and access to services
Health-workforce equity, integration, and retention
Racialized, immigrant, refugee, and newcomer health
Women's health and gender equity
Other community-identified priorities related to health and well-being$$),
  ('contact', 'interests_note', 'text', 'These areas are a starting point, not a fixed boundary. We welcome conversations about emerging priorities where social, economic, cultural, geographic, gender-related, racialized, or policy-related conditions influence health and well-being.'),
  ('contact', 'connect_title', 'text', 'How We Can Connect'),
  ('contact', 'connect_lead', 'text', 'PEARL welcomes opportunities to:'),
  ('contact', 'connect_list', 'prose', $$Discuss a community priority, concern, question, or emerging issue
Develop community-informed research, evaluation, or quality-improvement initiatives
Support evidence synthesis and knowledge mobilization
Explore program planning, service development, or community consultation
Connect on student, practicum, internship, or research opportunities
Explore collaborative grant and proposal development
Share or amplify relevant community resources, initiatives, and research
Provide or receive feedback on PEARL's research and community engagement$$),
  ('contact', 'connect_note', 'text', 'Health-system and health-service partners are also welcome to connect regarding research, evaluation, quality improvement, health-workforce planning, evidence synthesis, knowledge mobilization, and equity-oriented service development.'),
  ('contact', 'approach_title', 'text', 'Our Approach'),
  ('contact', 'approach_body', 'prose', $$PEARL does not view community engagement as a one-way process of sharing academic research. We aim to build relationships in which community priorities help shape research questions, methods, interpretation, and knowledge sharing.

Depending on the context, collaboration may include listening sessions, advisory involvement, collaborative research or evaluation, co-development of resources, community consultation, student-engaged initiatives, policy or program support, and knowledge mobilization.$$),
  ('contact', 'approach_note', 'text', 'An initial conversation does not require a formal proposal.'),
  ('contact', 'cta_label', 'text', 'Contact PEARL / Send us a message'),
  ('contact', 'form_title', 'text', 'Send us a message'),
  ('contact', 'form_intro', 'text', 'Please use the form below to share your question, community priority, idea, or potential collaboration. You do not need to have a formal research proposal to get in touch.'),
  ('contact', 'sensitive_notice', 'text', 'Please do not include confidential, personal health information, or other sensitive information in this form. Information submitted through this form will be used to respond to your inquiry.'),
  ('contact', 'confirmation_title', 'text', 'Thank you for contacting PEARL.'),
  ('contact', 'confirmation_body', 'text', 'Your message has been received. A member of the PEARL team will review your inquiry and respond as appropriate.')
ON CONFLICT (page, key) DO NOTHING;

UPDATE public.page_content SET value = $$Let's Connect$$ WHERE page = 'contact' AND key = 'start_title';
UPDATE public.page_content SET value_type = 'prose', value = $$Have a community priority, question, idea, or potential collaboration?

We welcome your questions, ideas, and perspectives.$$ WHERE page = 'contact' AND key = 'start_body';

-- ============================================================================
-- 2. Sample images for TFS / IFT sections (replace from the admin panel)
-- ============================================================================

UPDATE public.project_sections s
SET image_url = '/placeholder.jpg', image_key = NULL
FROM public.projects p
WHERE p.id = s.project_id
  AND s.image_url IS NULL
  AND (
    (p.slug = 'surplus-to-solutions' AND s.heading IN (
      'Food redistribution as a systems issue',
      'Collaborative and community-based research',
      'Building a more connected rural food system'))
    OR
    (p.slug = 'interfacility-patient-transfers' AND s.heading IN (
      'PEARL''s research program',
      'Health equity as a central theme',
      'The next stage'))
  );

-- ============================================================================
-- 3. Completed research project (slug 'research')
-- ============================================================================

UPDATE public.projects SET
  index_label = '02',
  category_label = 'Completed research / Rural health & health equity',
  title = 'Co-Creating Capacity for Successful Settlement of Newcomer Healthcare Practitioners and Their Families in Rural Nova Scotia',
  subtitle = 'A Multimethod Study of the Mid Valley Region',
  meta_line = '["Rural Nova Scotia", "Community-based participatory research"]'::jsonb,
  intro_paragraphs = jsonb_build_array(
    $$Canada continues to face persistent challenges in recruiting and retaining physicians, particularly in rural and remote communities. In Nova Scotia, the Mid Valley Region Physician Recruitment & Retention (MVRPRR) Committee supports the recruitment and retention of healthcare professionals and their families, including internationally trained physicians, primarily from West Africa, in rural communities across the region.$$,
    $$Co-Creating Capacity for Successful Settlement of Newcomer Healthcare Practitioners and Their Families in Rural Nova Scotia examined what has made the settlement process easier or more challenging for newcomer physicians and their families. The project explored the barriers, enablers, and opportunities for strengthening recruitment, settlement, integration, and retention of internationally trained physicians in the Mid Valley Region and other rural communities.$$,
    $$The research brought together academic researchers, community partners, physicians and their families, and key informants from professional organizations and government agencies to understand settlement as a broader social, cultural, and systemic process.$$
  )
WHERE slug = 'research';

-- Paragraphs that were pasted into a single box get split back out.
UPDATE public.project_sections s SET body_paragraphs = jsonb_build_array(
  $$The project also examined the formation, mandate, and current practices of the Mid Valley Region Physician Recruitment & Retention Committee through a case study of its efforts to date.$$,
  $$Document analysis, observations, and interviews with committee members and participants were used to explore the strengths, challenges, processes, and successes of the Committee's initiatives.$$,
  $$The research also examined resources and approaches used in other jurisdictions to address cultural barriers and support the settlement of newcomer healthcare practitioners in rural communities. A review of academic and grey literature was undertaken to identify innovative approaches, resources, and practices that could inform settlement and retention efforts locally, provincially, and nationally.$$
)
FROM public.projects p
WHERE p.id = s.project_id AND p.slug = 'research' AND s.heading = 'Understanding community capacity for recruitment and retention';

UPDATE public.project_sections s SET body_paragraphs = jsonb_build_array(
  $$The project was guided by community-based participatory research and socioecological and anti-racist frameworks.$$,
  $$The research team worked with community partners throughout the project. This included engagement with the Change Lab Action Research Initiative (CLARI) and members of the MVRPRR Committee, as well as an initial community gathering in November 2024 where potential participants were introduced to the project and provided feedback on the research plan and data collection tools.$$,
  $$Multiple methods were used to collect and interpret data, including semi-structured individual interviews, focus group discussions, key informant interviews, document review, literature review, and observations.$$,
  $$The use of multiple data sources and methods allowed the research team to examine the experiences of newcomer physicians and their families alongside the broader community and organizational context surrounding recruitment and retention.$$
)
FROM public.projects p
WHERE p.id = s.project_id AND p.slug = 'research' AND s.heading = 'A community-based and participatory approach';

-- This box also held the next two sections' text; they become their own sections below.
UPDATE public.project_sections s SET body_paragraphs = jsonb_build_array(
  $$An important component of the project was engaging research participants and community partners in reviewing and interpreting the findings.$$,
  $$On April 12, 2025, participatory workshops were held with physicians and their spouses and with members of the MVRPRR Committee. Findings were shared with participants, who provided feedback, identified perspectives that may have been missed, discussed the implications of the findings, and contributed ideas for practices, policies, and future research.$$,
  $$This process supported the co-creation of recommendations to address cultural and social barriers and strengthen settlement and retention of internationally trained physicians in rural communities.$$
)
FROM public.projects p
WHERE p.id = s.project_id AND p.slug = 'research' AND s.heading = 'Co-creating recommendations with the community';

UPDATE public.project_sections s SET sort_order = 6
FROM public.projects p
WHERE p.id = s.project_id AND p.slug = 'research' AND s.heading = 'Research collaboration';

INSERT INTO public.project_sections (project_id, heading, body_paragraphs, image_url, image_key, partners_context, sort_order)
SELECT p.id, v.heading, v.body, '/placeholder.jpg', NULL, NULL, v.sort_order
FROM public.projects p
CROSS JOIN (VALUES
  (
    'From recruitment to long-term settlement',
    jsonb_build_array(
      $$The findings indicate that internationally trained physicians bring valuable expertise and a strong commitment to serving rural communities, while also experiencing systemic barriers including licensing challenges, discrimination, and processes that do not always reflect principles of equity.$$,
      $$The research also identified challenges related to family-centred support. These factors can affect professional satisfaction and personal well-being and may influence longer-term retention.$$,
      $$At the same time, the findings highlight the importance of feeling genuinely welcomed, integrated, and connected to the community. A strong sense of belonging, community integration, cultural sensitivity, and cultural humility can play an important role in supporting settlement and retention.$$,
      $$The case study also identified the MVRPRR Committee as a successful bottom-up initiative and public/private civil society partnership. The findings highlight the importance of continued capacity building and succession planning to support the sustainability of this work.$$
    ),
    4
  ),
  (
    'Building more equitable and sustainable rural communities',
    jsonb_build_array(
      $$The project highlights the need to move beyond short-term recruitment toward longer-term, sustainable settlement and retention of internationally trained physicians and their families.$$,
      $$Supporting successful settlement requires a coordinated approach that considers professional and family needs alongside community integration, equity, systemic barriers, and trust. The research points to the importance of incorporating Equity, Diversity, Inclusion, and Accessibility (EDIA) into community initiatives and building capacity for cultural sensitivity and cultural humility within organizations and the broader communities they serve.$$,
      $$The study provides insights for communities and policymakers at the local, provincial, and national levels seeking to strengthen approaches to the recruitment, settlement, and retention of internationally trained physicians in rural communities.$$,
      $$By bringing together the experiences of physicians and their families with the perspectives of community organizations, researchers, and other stakeholders, the project contributes to a broader understanding of what is needed to support newcomer healthcare practitioners not only to work in rural communities, but to settle, integrate, and build lasting connections within them.$$
    ),
    5
  )
) AS v(heading, body, sort_order)
WHERE p.slug = 'research'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_sections e WHERE e.project_id = p.id AND e.heading = v.heading
  );
