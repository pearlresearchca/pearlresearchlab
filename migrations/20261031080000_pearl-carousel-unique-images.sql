-- Homepage feature carousel: replace reused photos with images generated for
-- each slide (subject on the right, calm space on the left for the copy).
-- Registers the files in the media library and points each slide at its image.

INSERT INTO public.cms_media (url, key, filename, title, alt, mime_type, size_bytes, width, height)
SELECT v.url, v.key, v.key, v.title, v.alt, 'image/webp', v.size, 1920, 1080
FROM (VALUES
  ('https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-food-rescue-farm.webp', 'fc-food-rescue-farm.webp', 'food rescue farm', 'Two farmers loading crates of carrots, cabbages and squash into a van at the edge of a rural field', 272394),
  ('https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-patient-transfer-dusk.webp', 'fc-patient-transfer-dusk.webp', 'patient transfer dusk', 'Paramedics guiding an older patient on a stretcher out of a small rural health centre at dusk', 83640),
  ('https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-newcomer-doctor-clinic.webp', 'fc-newcomer-doctor-clinic.webp', 'newcomer doctor clinic', 'A doctor talking with an older couple on the steps of a small white clapboard clinic in autumn', 152340),
  ('https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-road-to-rural-hospital.webp', 'fc-road-to-rural-hospital.webp', 'road to rural hospital', 'Aerial view of an ambulance on a long forest road heading toward a distant hospital at dusk', 247068),
  ('https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-nurse-mentoring.webp', 'fc-nurse-mentoring.webp', 'nurse mentoring', 'An experienced nurse reviewing a patient chart with two younger nurses in a rural health centre', 72318),
  ('https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-market-food-security.webp', 'fc-market-food-security.webp', 'market food security', 'A smiling woman holding a cloth bag of fresh vegetables at a community market', 70674),
  ('https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-consent-photography.webp', 'fc-consent-photography.webp', 'consent photography', 'Health workers showing an older woman her photo on a camera screen so she can choose how she is pictured', 68502)
) AS v(url, key, title, alt, size)
WHERE NOT EXISTS (SELECT 1 FROM public.cms_media m WHERE m.key = v.key);

UPDATE public.cms_pages
SET content = CASE WHEN content->'sections'->3->'children'->1->>'type' = 'feature-carousel'
      THEN jsonb_set(content, '{sections,3,children,1,props,items}', (SELECT jsonb_agg(CASE it->>'id'
      WHEN 'xfcs00001' THEN it || jsonb_build_object('image', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-food-rescue-farm.webp', 'imageAlt', 'Two farmers loading crates of carrots, cabbages and squash into a van at the edge of a rural field')
      WHEN 'xfcs00002' THEN it || jsonb_build_object('image', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-patient-transfer-dusk.webp', 'imageAlt', 'Paramedics guiding an older patient on a stretcher out of a small rural health centre at dusk')
      WHEN 'xfcs00003' THEN it || jsonb_build_object('image', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-newcomer-doctor-clinic.webp', 'imageAlt', 'A doctor talking with an older couple on the steps of a small white clapboard clinic in autumn')
      WHEN 'xfcs00004' THEN it || jsonb_build_object('image', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-road-to-rural-hospital.webp', 'imageAlt', 'Aerial view of an ambulance on a long forest road heading toward a distant hospital at dusk')
      WHEN 'xfcs00005' THEN it || jsonb_build_object('image', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-nurse-mentoring.webp', 'imageAlt', 'An experienced nurse reviewing a patient chart with two younger nurses in a rural health centre')
      WHEN 'xfcs00006' THEN it || jsonb_build_object('image', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-market-food-security.webp', 'imageAlt', 'A smiling woman holding a cloth bag of fresh vegetables at a community market')
      WHEN 'xfcs00007' THEN it || jsonb_build_object('image', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-consent-photography.webp', 'imageAlt', 'Health workers showing an older woman her photo on a camera screen so she can choose how she is pictured')
      ELSE it END ORDER BY ord)
    FROM jsonb_array_elements(content->'sections'->3->'children'->1->'props'->'items') WITH ORDINALITY AS t(it, ord))) ELSE content END,
    published_content = jsonb_set(published_content, '{sections,3,children,1,props,items}', (SELECT jsonb_agg(CASE it->>'id'
      WHEN 'xfcs00001' THEN it || jsonb_build_object('image', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-food-rescue-farm.webp', 'imageAlt', 'Two farmers loading crates of carrots, cabbages and squash into a van at the edge of a rural field')
      WHEN 'xfcs00002' THEN it || jsonb_build_object('image', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-patient-transfer-dusk.webp', 'imageAlt', 'Paramedics guiding an older patient on a stretcher out of a small rural health centre at dusk')
      WHEN 'xfcs00003' THEN it || jsonb_build_object('image', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-newcomer-doctor-clinic.webp', 'imageAlt', 'A doctor talking with an older couple on the steps of a small white clapboard clinic in autumn')
      WHEN 'xfcs00004' THEN it || jsonb_build_object('image', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-road-to-rural-hospital.webp', 'imageAlt', 'Aerial view of an ambulance on a long forest road heading toward a distant hospital at dusk')
      WHEN 'xfcs00005' THEN it || jsonb_build_object('image', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-nurse-mentoring.webp', 'imageAlt', 'An experienced nurse reviewing a patient chart with two younger nurses in a rural health centre')
      WHEN 'xfcs00006' THEN it || jsonb_build_object('image', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-market-food-security.webp', 'imageAlt', 'A smiling woman holding a cloth bag of fresh vegetables at a community market')
      WHEN 'xfcs00007' THEN it || jsonb_build_object('image', 'https://376vyh7j.us-east.insforge.app/api/storage/buckets/site-images/objects/fc-consent-photography.webp', 'imageAlt', 'Health workers showing an older woman her photo on a camera screen so she can choose how she is pictured')
      ELSE it END ORDER BY ord)
    FROM jsonb_array_elements(published_content->'sections'->3->'children'->1->'props'->'items') WITH ORDINALITY AS t(it, ord))),
    updated_at = now()
WHERE slug = '' AND published_content->'sections'->3->'children'->1->>'type' = 'feature-carousel';
