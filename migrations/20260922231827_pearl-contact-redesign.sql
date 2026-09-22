-- Contact page redesign: tag the builder sections with the pc-* classes styled in
-- app/globals.css (Areas of Interest cards, How We Can Connect / Our Approach cards),
-- drop the hard-coded interests background and widen/stretch the two-column row.
-- Guarded on node ids so an edited page layout is left alone.

UPDATE public.cms_pages SET content = jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(content, '{sections,1,advanced}', '{"className":"pc-partnerships"}'::jsonb, true), '{sections,2,advanced}', '{"className":"pc-interests"}'::jsonb, true), '{sections,2,style}', '{}'::jsonb, true), '{sections,2,children,2,advanced}', '{"className":"pc-interest-note"}'::jsonb, true), '{sections,3,advanced}', '{"className":"pc-connect"}'::jsonb, true), '{sections,3,children,0,style,desktop}', '{"gap":"28px","alignItems":"stretch"}'::jsonb, true), '{sections,3,children,0,children,0,advanced}', '{"className":"pc-connect-card"}'::jsonb, true), '{sections,3,children,0,children,0,children,3,advanced}', '{"className":"pc-connect-note"}'::jsonb, true), '{sections,3,children,0,children,1,advanced}', '{"className":"pc-approach-card"}'::jsonb, true), '{sections,3,children,0,children,1,children,2,advanced}', '{"className":"pc-approach-note"}'::jsonb, true), '{sections,3,children,0,children,1,children,2,style}', '{}'::jsonb, true)
WHERE legacy_key = 'contact'
  AND content->'sections'->1->>'id' = 'xoo8snlhr'
  AND content->'sections'->2->>'id' = 'xku00t5fb'
  AND content->'sections'->3->>'id' = 'xcdp3oeq3';

UPDATE public.cms_pages SET published_content = jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(jsonb_set(published_content, '{sections,1,advanced}', '{"className":"pc-partnerships"}'::jsonb, true), '{sections,2,advanced}', '{"className":"pc-interests"}'::jsonb, true), '{sections,2,style}', '{}'::jsonb, true), '{sections,2,children,2,advanced}', '{"className":"pc-interest-note"}'::jsonb, true), '{sections,3,advanced}', '{"className":"pc-connect"}'::jsonb, true), '{sections,3,children,0,style,desktop}', '{"gap":"28px","alignItems":"stretch"}'::jsonb, true), '{sections,3,children,0,children,0,advanced}', '{"className":"pc-connect-card"}'::jsonb, true), '{sections,3,children,0,children,0,children,3,advanced}', '{"className":"pc-connect-note"}'::jsonb, true), '{sections,3,children,0,children,1,advanced}', '{"className":"pc-approach-card"}'::jsonb, true), '{sections,3,children,0,children,1,children,2,advanced}', '{"className":"pc-approach-note"}'::jsonb, true), '{sections,3,children,0,children,1,children,2,style}', '{}'::jsonb, true)
WHERE legacy_key = 'contact'
  AND published_content->'sections'->1->>'id' = 'xoo8snlhr'
  AND published_content->'sections'->2->>'id' = 'xku00t5fb'
  AND published_content->'sections'->3->>'id' = 'xcdp3oeq3';

