-- Blogs page masthead: a centred editorial header (one intro sentence, short
-- accent rule) in place of the split header with a full-width divider; styled by
-- .pbl-masthead in app/builder.css. Only section 0 is replaced, so unpublished
-- edits elsewhere on the page are kept. Previous layout kept as a page revision.

INSERT INTO public.cms_page_revisions (page_id, title, content, seo, reason)
SELECT id, title || ' (before masthead redesign)', published_content, seo, 'publish'
FROM public.cms_pages
WHERE slug = 'blogs'
  AND published_content->'sections'->0->>'id' = 'xa2ca412e'
  AND content->'sections'->0 = published_content->'sections'->0;

UPDATE public.cms_pages
SET content = jsonb_set(content, '{sections,0}', $pbl${"id":"xa2ca412e","type":"section","props":{"tone":"auto","label":"Masthead","width":"narrow","contentAlign":"center","verticalAlign":"top"},"advanced":{"className":"pbl-masthead"},"style":{"mobile":{"padding":{"top":"64px","bottom":"56px"}},"desktop":{"padding":{"top":"104px","bottom":"88px"}}},"children":[{"id":"xojjzwyve","type":"heading","props":{"text":"News & stories","level":"p","preset":"eyebrow"},"animation":{"type":"fade","easing":"ease-out","duration":700}},{"id":"x77n88px4","type":"heading","props":{"text":"Insights & Perspectives","level":"h1","preset":"default"},"animation":{"type":"slide-up","easing":"ease-out","duration":700,"delay":80}},{"id":"xq92t6off","type":"paragraph","props":{"size":"lead","text":"News, milestones, and reflections from PEARL’s researchers, students, and community partners, along with perspectives on public health, global health, and health equity.","muted":true},"animation":{"type":"slide-up","easing":"ease-out","duration":700,"delay":160}}]}$pbl$::jsonb),
    published_content = jsonb_set(published_content, '{sections,0}', $pbl${"id":"xa2ca412e","type":"section","props":{"tone":"auto","label":"Masthead","width":"narrow","contentAlign":"center","verticalAlign":"top"},"advanced":{"className":"pbl-masthead"},"style":{"mobile":{"padding":{"top":"64px","bottom":"56px"}},"desktop":{"padding":{"top":"104px","bottom":"88px"}}},"children":[{"id":"xojjzwyve","type":"heading","props":{"text":"News & stories","level":"p","preset":"eyebrow"},"animation":{"type":"fade","easing":"ease-out","duration":700}},{"id":"x77n88px4","type":"heading","props":{"text":"Insights & Perspectives","level":"h1","preset":"default"},"animation":{"type":"slide-up","easing":"ease-out","duration":700,"delay":80}},{"id":"xq92t6off","type":"paragraph","props":{"size":"lead","text":"News, milestones, and reflections from PEARL’s researchers, students, and community partners, along with perspectives on public health, global health, and health equity.","muted":true},"animation":{"type":"slide-up","easing":"ease-out","duration":700,"delay":160}}]}$pbl$::jsonb),
    updated_at = now()
WHERE slug = 'blogs'
  AND published_content->'sections'->0->>'id' = 'xa2ca412e'
  AND content->'sections'->0 = published_content->'sections'->0;
