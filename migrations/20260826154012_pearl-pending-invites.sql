-- Invited-user role/section assignments waiting to be linked to a real
-- account. auth.users rows aren't reliably foreign-key-referenceable the
-- instant signUp() returns (observed delays of over a minute), so writing
-- straight to app_users right after inviting is racy. Instead we park the
-- intended access here (no FK to auth.users, so this insert can never race)
-- and apply it the moment the invited person actually verifies or signs in
-- — by which point their auth.users row is unquestionably real.

CREATE TABLE IF NOT EXISTS public.pending_invites (
  email text PRIMARY KEY,
  role text NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  sections text[] NOT NULL DEFAULT '{}',
  full_name text,
  invited_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_invites ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies for anon/authenticated: only the admin (API-key)
-- client should ever read or write this table.
