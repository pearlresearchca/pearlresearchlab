#!/usr/bin/env node
// Exports the PEARL database (public schema) as two restorable SQL scripts:
//
//   database/pearl-core-schema.sql   structure only — tables, keys, checks,
//                                    indexes, functions, RLS policies,
//                                    triggers and grants (safe to commit)
//   db-exports/pearl-full-with-data.sql  the same plus every row of data
//                                    (contains personal data — git-ignored)
//
// Built from Postgres' own catalog functions (pg_get_functiondef,
// pg_get_constraintdef, pg_get_indexdef, pg_get_triggerdef…), so objects are
// reproduced exactly. Restore order: functions → tables → data → foreign
// keys → indexes → RLS & policies → triggers → grants, so data loads without
// firing triggers or tripping foreign keys.
//
// Usage (from the project root, with the InsForge CLI linked):
//   node scripts/db-export.mjs            both files
//   node scripts/db-export.mjs --core     structure only
//
// See database/README.md for how to restore.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const coreOnly = process.argv.includes('--core')

// Project URL and admin API key: INSFORGE_URL / INSFORGE_API_KEY from the
// environment or .env.local, else the CLI's .insforge/project.json.
function credentials() {
  const env = { ...process.env }
  const envFile = join(ROOT, '.env.local')
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
    }
  }
  if (env.INSFORGE_URL && env.INSFORGE_API_KEY) return { url: env.INSFORGE_URL.replace(/\/$/, ''), key: env.INSFORGE_API_KEY }
  const cfg = join(ROOT, '.insforge', 'project.json')
  if (existsSync(cfg)) {
    const c = JSON.parse(readFileSync(cfg, 'utf8'))
    return { url: c.oss_host.replace(/\/$/, ''), key: c.api_key }
  }
  throw new Error('Set INSFORGE_URL and INSFORGE_API_KEY (or link the project with the InsForge CLI).')
}
const { url: BASE, key: API_KEY } = credentials()

// Runs read-only catalog SQL through the InsForge raw SQL endpoint.
async function query(sql) {
  const res = await fetch(`${BASE}/api/database/advance/rawsql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ query: sql }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`Query failed (${res.status}): ${body.message ?? body.error ?? 'unknown error'}\n${sql.slice(0, 200)}`)
  return body.rows ?? body.data ?? []
}

const q = (s) => s.replace(/\s+/g, ' ').trim()
const ident = (s) => (/^[a-z_][a-z0-9_]*$/.test(s) ? s : `"${s.replace(/"/g, '""')}"`)

// Objects created by extensions (pgcrypto, vector…) are not ours to export.
const NOT_EXTENSION = (oidExpr, catalog) => `NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = ${oidExpr} AND d.classid = '${catalog}'::regclass AND d.deptype = 'e')`

console.log('Reading database structure…')

const tables = await query(q(`
  SELECT c.relname AS name, c.relrowsecurity AS rls, c.relforcerowsecurity AS force_rls
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND ${NOT_EXTENSION('c.oid', 'pg_class')}
  ORDER BY c.relname`))

const columns = await query(q(`
  SELECT c.relname AS tbl, a.attname AS col, format_type(a.atttypid, a.atttypmod) AS type, a.attnotnull AS notnull,
         pg_get_expr(d.adbin, d.adrelid) AS def, a.attidentity AS identity, a.attgenerated AS generated
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND a.attnum > 0 AND NOT a.attisdropped
  ORDER BY c.relname, a.attnum`))

const constraints = await query(q(`
  SELECT c.relname AS tbl, k.conname AS name, k.contype AS type, pg_get_constraintdef(k.oid) AS def,
         (SELECT n2.nspname FROM pg_class r JOIN pg_namespace n2 ON n2.oid = r.relnamespace WHERE r.oid = k.confrelid) AS ref_schema
  FROM pg_constraint k JOIN pg_class c ON c.oid = k.conrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND k.contype IN ('p', 'u', 'c', 'f', 'x')
  ORDER BY c.relname, CASE k.contype WHEN 'p' THEN 0 WHEN 'u' THEN 1 WHEN 'c' THEN 2 WHEN 'x' THEN 3 ELSE 4 END, k.conname`))

const indexes = await query(q(`
  SELECT c.relname AS tbl, pg_get_indexdef(i.indexrelid) AS def
  FROM pg_index i JOIN pg_class c ON c.oid = i.indrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
    AND NOT EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conindid = i.indexrelid)
    AND ${NOT_EXTENSION('i.indexrelid', 'pg_class')}
  ORDER BY c.relname, 2`))

const functions = await query(q(`
  SELECT p.proname AS name, pg_get_functiondef(p.oid) AS def
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p') AND ${NOT_EXTENSION('p.oid', 'pg_proc')}
  ORDER BY p.proname`))

const functionGrants = await query(q(`
  SELECT p.oid::regprocedure::text AS sig, p.proacl IS NOT NULL AS has_acl,
         COALESCE((SELECT string_agg(CASE WHEN a.grantee = 0 THEN 'PUBLIC' ELSE quote_ident(r.rolname) END, ',')
                   FROM aclexplode(p.proacl) a LEFT JOIN pg_roles r ON r.oid = a.grantee
                   WHERE a.privilege_type = 'EXECUTE' AND (a.grantee = 0 OR r.rolname IN ('anon', 'authenticated'))), '') AS grantees
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind IN ('f', 'p') AND ${NOT_EXTENSION('p.oid', 'pg_proc')}`))

const policies = await query(q(`
  SELECT tablename AS tbl, policyname AS name, permissive, roles::text[] AS roles, cmd, qual, with_check
  FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname`))

const triggers = await query(q(`
  SELECT c.relname AS tbl, pg_get_triggerdef(t.oid) AS def
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND NOT t.tgisinternal
  ORDER BY c.relname, t.tgname`))

// Table and column privileges for the API roles.
const tableGrants = await query(q(`
  SELECT c.relname AS tbl, r.rolname AS role, string_agg(DISTINCT a.privilege_type, ', ' ORDER BY a.privilege_type) AS privs
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace, aclexplode(c.relacl) a JOIN pg_roles r ON r.oid = a.grantee
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p') AND r.rolname IN ('anon', 'authenticated')
  GROUP BY c.relname, r.rolname ORDER BY 1, 2`))

const columnGrants = await query(q(`
  SELECT c.relname AS tbl, r.rolname AS role, a.privilege_type AS priv, string_agg(quote_ident(att.attname), ', ' ORDER BY att.attnum) AS cols
  FROM pg_attribute att JOIN pg_class c ON c.oid = att.attrelid JOIN pg_namespace n ON n.oid = c.relnamespace,
       aclexplode(att.attacl) a JOIN pg_roles r ON r.oid = a.grantee
  WHERE n.nspname = 'public' AND att.attacl IS NOT NULL AND r.rolname IN ('anon', 'authenticated')
  GROUP BY 1, 2, 3 ORDER BY 1, 2, 3`))

// ---------------------------------------------------------------- build
const lines = []
const out = (...s) => lines.push(...s)
const section = (title) => out('', `-- ${'='.repeat(74)}`, `-- ${title}`, `-- ${'='.repeat(74)}`)

function header(withData) {
  return [
    `-- PEARL Research Lab — database ${withData ? 'full export (structure + data)' : 'core schema (structure only)'}`,
    `-- Generated ${new Date().toISOString()} by scripts/db-export.mjs`,
    '--',
    '-- Restores the public schema into an InsForge (or any Supabase-style) Postgres',
    '-- that already provides: the auth schema (auth.users, auth.uid()), the',
    '-- system.update_updated_at() trigger function and the anon / authenticated',
    '-- roles. See database/README.md.',
    '',
    'SET client_min_messages = warning;',
    'SET check_function_bodies = off;',
    "SET search_path = public, pg_catalog;",
    'BEGIN;',
  ]
}

section('Functions')
for (const f of functions) out(`${f.def.trim()};`, '')

section('Tables')
const colsBy = Object.groupBy ? Object.groupBy(columns, (c) => c.tbl) : columns.reduce((m, c) => ((m[c.tbl] ??= []).push(c), m), {})
for (const t of tables) {
  const cols = (colsBy[t.name] ?? []).map((c) => {
    let s = `  ${ident(c.col)} ${c.type}`
    if (c.generated === 's') s += ` GENERATED ALWAYS AS (${c.def}) STORED`
    else if (c.identity === 'a') s += ' GENERATED ALWAYS AS IDENTITY'
    else if (c.identity === 'd') s += ' GENERATED BY DEFAULT AS IDENTITY'
    else if (c.def != null) s += ` DEFAULT ${c.def}`
    if (c.notnull) s += ' NOT NULL'
    return s
  })
  out(`CREATE TABLE IF NOT EXISTS public.${ident(t.name)} (`, cols.join(',\n'), ');')
  for (const k of constraints.filter((k) => k.tbl === t.name && k.type !== 'f')) {
    out(`ALTER TABLE public.${ident(t.name)} ADD CONSTRAINT ${ident(k.name)} ${k.def};`)
  }
  out('')
}

const dataStart = lines.length
section('Data')
const dataSection = []
if (!coreOnly) {
  console.log('Reading data…')
  for (const t of tables) {
    const rows = (await query(`SELECT COALESCE(json_agg(t), '[]'::json) AS data FROM public.${ident(t.name)} t`))[0]?.data ?? []
    if (!rows.length) continue
    const json = JSON.stringify(rows)
    let tag = 'pearl'
    while (json.includes(`$${tag}$`)) tag += 'x'
    dataSection.push(`-- ${t.name}: ${rows.length} row${rows.length === 1 ? '' : 's'}`)
    dataSection.push(`INSERT INTO public.${ident(t.name)} SELECT * FROM jsonb_populate_recordset(NULL::public.${ident(t.name)}, $${tag}$${json}$${tag}$::jsonb);`)
    console.log(`  ${t.name}: ${rows.length}`)
  }
}
const afterData = lines.length

section('Foreign keys')
for (const k of constraints.filter((k) => k.type === 'f')) {
  // Users live in the auth schema, which isn't part of this export: those
  // keys are added NOT VALID so existing rows still load in a new project.
  const notValid = k.ref_schema && k.ref_schema !== 'public' ? ' NOT VALID' : ''
  out(`ALTER TABLE public.${ident(k.tbl)} ADD CONSTRAINT ${ident(k.name)} ${k.def}${notValid};`)
}

section('Indexes')
for (const i of indexes) out(`${i.def.replace(/^CREATE (UNIQUE )?INDEX /, 'CREATE $1INDEX IF NOT EXISTS ')};`)

section('Row-level security')
for (const t of tables) {
  if (t.rls) out(`ALTER TABLE public.${ident(t.name)} ENABLE ROW LEVEL SECURITY;`)
  if (t.force_rls) out(`ALTER TABLE public.${ident(t.name)} FORCE ROW LEVEL SECURITY;`)
}
out('')
for (const p of policies) {
  const roles = (Array.isArray(p.roles) ? p.roles : String(p.roles).replace(/[{}]/g, '').split(',')).map((r) => (r === 'public' ? 'public' : ident(r))).join(', ')
  let s = `CREATE POLICY ${ident(p.name)} ON public.${ident(p.tbl)} AS ${p.permissive} FOR ${p.cmd} TO ${roles}`
  if (p.qual) s += ` USING (${p.qual})`
  if (p.with_check) s += ` WITH CHECK (${p.with_check})`
  out(`${s};`)
}

section('Triggers')
for (const t of triggers) out(`${t.def};`)

section('Privileges for the API roles')
for (const t of tables) out(`REVOKE ALL ON public.${ident(t.name)} FROM anon, authenticated;`)
for (const g of tableGrants) out(`GRANT ${g.privs} ON public.${ident(g.tbl)} TO ${ident(g.role)};`)
for (const g of columnGrants) out(`GRANT ${g.priv} (${g.cols}) ON public.${ident(g.tbl)} TO ${ident(g.role)};`)
for (const f of functionGrants) {
  if (!f.has_acl) continue // default: executable by PUBLIC
  const grantees = f.grantees ? f.grantees.split(',') : []
  if (!grantees.includes('PUBLIC')) out(`REVOKE ALL ON FUNCTION ${f.sig} FROM PUBLIC;`)
  for (const g of grantees.filter((x) => x !== 'PUBLIC')) out(`GRANT EXECUTE ON FUNCTION ${f.sig} TO ${g};`)
}

out('', 'COMMIT;', '')

// Core: everything except the data section.
const coreSql = [...header(false), ...lines.slice(0, dataStart), ...lines.slice(afterData)].join('\n')
mkdirSync(join(ROOT, 'database'), { recursive: true })
writeFileSync(join(ROOT, 'database', 'pearl-core-schema.sql'), coreSql)
console.log('Wrote database/pearl-core-schema.sql')

if (!coreOnly) {
  const fullSql = [...header(true), ...lines.slice(0, afterData), ...dataSection, ...lines.slice(afterData)].join('\n')
  mkdirSync(join(ROOT, 'db-exports'), { recursive: true })
  writeFileSync(join(ROOT, 'db-exports', 'pearl-full-with-data.sql'), fullSql)
  console.log('Wrote db-exports/pearl-full-with-data.sql (contains personal data — keep it private)')
}
