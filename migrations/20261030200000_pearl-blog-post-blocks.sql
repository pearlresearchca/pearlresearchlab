-- Blog posts are composed from simple content blocks and shown in one of
-- several visual styles. body_html stays for posts written before blocks.
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS style text NOT NULL DEFAULT 'classic';
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS blocks jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_blocks_array;
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_blocks_array CHECK (jsonb_typeof(blocks) = 'array');
