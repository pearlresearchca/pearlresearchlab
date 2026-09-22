-- Admin profiles: basic details each admin/editor fills in after their first
-- sign-in and can edit any time. Writes go through a server action that only
-- ever updates the signed-in person's own row (admin-key client), so no new
-- RLS write policies are needed.

ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS bio text;
-- Null until the person has completed the first-sign-in profile step.
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS profile_completed_at timestamptz;

ALTER TABLE public.app_users DROP CONSTRAINT IF EXISTS app_users_profile_lengths;
ALTER TABLE public.app_users ADD CONSTRAINT app_users_profile_lengths CHECK (
  (full_name IS NULL OR char_length(full_name) <= 120)
  AND (phone IS NULL OR char_length(phone) <= 40)
  AND (job_title IS NULL OR char_length(job_title) <= 120)
  AND (bio IS NULL OR char_length(bio) <= 1000)
);
