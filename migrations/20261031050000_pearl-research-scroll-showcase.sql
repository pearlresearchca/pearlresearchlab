-- Research page: show the research streams with the Research areas block's new
-- "scroll" layout (pinned image panel that cross-fades as each stream scrolls by).
UPDATE public.cms_pages
SET content = jsonb_set(content, '{sections,1,children,1,props,variant}', '"scroll"'),
    published_content = jsonb_set(published_content, '{sections,1,children,1,props,variant}', '"scroll"'),
    updated_at = now()
WHERE slug = 'research'
  AND published_content->'sections'->1->'children'->1->>'id' = 'x5j8y8s3e'
  AND content->'sections'->1->'children'->1->>'id' = 'x5j8y8s3e';
