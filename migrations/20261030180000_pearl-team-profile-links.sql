-- Optional link from a team member's name to a page about them (e.g. a
-- portfolio page). Relative site paths or full https:// URLs.
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS profile_url text;
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_profile_url_format;
ALTER TABLE public.team_members ADD CONSTRAINT team_members_profile_url_format
  CHECK (profile_url IS NULL OR profile_url ~ '^(/|https?://)');

-- Link the director's name on the Team page to her portfolio page.
UPDATE public.team_members SET profile_url = '/portfolio'
WHERE id = '7d6c7b64-4173-4a84-baae-65ee921b468d' AND profile_url IS NULL;
