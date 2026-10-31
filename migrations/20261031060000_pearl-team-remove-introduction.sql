-- Team page: remove the "A collaborative lab" introduction section. The
-- previous layout is kept as a page revision. Guarded on the section id.

INSERT INTO public.cms_page_revisions (page_id, title, content, seo, reason)
SELECT id, title || ' (before removing introduction)', published_content, seo, 'publish'
FROM public.cms_pages
WHERE slug = 'team' AND published_content->'sections'->1->>'id' = 'x6hjzpggr';

UPDATE public.cms_pages
SET content = CASE WHEN content->'sections'->1->>'id' = 'x6hjzpggr' THEN content #- '{sections,1}' ELSE content END,
    published_content = published_content #- '{sections,1}',
    updated_at = now()
WHERE slug = 'team' AND published_content->'sections'->1->>'id' = 'x6hjzpggr';
