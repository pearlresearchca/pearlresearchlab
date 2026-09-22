-- Records whether the notification (site team) and thank-you (sender)
-- emails for each form submission were sent, and why not if they failed.
-- Shape: { "team": { "status": "sent" | "failed" | "skipped", "at": ..., "to": [...], "error"?: ... },
--          "sender": { ... } }
ALTER TABLE public.cms_form_submissions ADD COLUMN IF NOT EXISTS email_log jsonb NOT NULL DEFAULT '{}'::jsonb;
