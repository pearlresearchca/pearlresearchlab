# Database export & restore

Two SQL scripts let you move the PEARL database to another InsForge project
(or any Supabase-style Postgres).

| File | Contents | In Git? |
| --- | --- | --- |
| `database/pearl-core-schema.sql` | Structure only: 24 tables with primary keys, checks and foreign keys, indexes, functions, row-level security policies, triggers and API privileges | Yes |
| `db-exports/pearl-full-with-data.sql` | The same structure **plus every row** (pages, content, settings, posts, jobs, admin users, form messages, activity log…) | **No** — contains personal data; `db-exports/` is git-ignored |

Both are generated from Postgres' own catalog by `scripts/db-export.mjs` and
were test-restored into an empty Postgres 18 database with no errors.

## Regenerate

From the project root (uses `INSFORGE_URL` / `INSFORGE_API_KEY` from
`.env.local`, or the linked InsForge CLI project):

```bash
npm run db:export        # both files
npm run db:export:core   # structure only
```

Re-run it after schema changes so `pearl-core-schema.sql` stays current, and
keep the full export somewhere private (it is not committed).

## Restore into a new InsForge project

1. Create and link the new project: `npx -y @insforge/cli create` (or `link`).
2. Restore **one** of the scripts (each runs in a single transaction):
   - empty site with the same structure:
     `npx -y @insforge/cli db import database/pearl-core-schema.sql`
   - full copy: `npx -y @insforge/cli db import db-exports/pearl-full-with-data.sql`

   The scripts were verified with `psql`; if the CLI importer rejects a file,
   run it with direct Postgres access instead:
   `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f <file>`.
3. Recreate what lives outside the `public` schema:
   - **Storage buckets** — `site-images` (public) and `form-uploads` (private):
     `npx -y @insforge/cli storage create-bucket site-images` and
     `npx -y @insforge/cli storage create-bucket form-uploads --private`.
     Image URLs in the data still point at the old project's storage; copy the
     files across (or keep the old project) for them to keep loading.
   - **Admin accounts** — users sign in through InsForge Auth (`auth.users`),
     which isn't part of this export. Invite admins again; foreign keys to
     users were added `NOT VALID` so existing rows still load.
   - **Nightly clean-up schedule** for expired job applications:
     ```bash
     npx -y @insforge/cli schedules create --name "Purge expired job applications" \
       --cron "15 3 * * *" --method POST \
       --url "https://<new-app>.<region>.insforge.app/api/database/rpc/purge_expired_job_applications" \
       --headers '{"Authorization": "Bearer ${{secrets.API_KEY}}", "Content-Type": "application/json"}' --body '{}'
     ```
4. Point the app at the new project (`.env.local` / Vercel environment
   variables: `NEXT_PUBLIC_INSFORGE_URL`, `NEXT_PUBLIC_INSFORGE_ANON_KEY`,
   `INSFORGE_URL`, `INSFORGE_API_KEY`).

## What the scripts expect from the target

InsForge provides these; a plain Postgres needs stand-ins first:
the `auth` schema with `auth.users` and `auth.uid()`, the
`system.update_updated_at()` trigger function, and the `anon` and
`authenticated` roles.
