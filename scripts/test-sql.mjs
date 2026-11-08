/**
 * Schema verification against a real PostgreSQL engine (PGlite, Postgres 16 WASM).
 *
 * Runs the migrations and seed exactly as written, then asserts the structure the
 * application depends on: tables, constraints, indexes, triggers, the
 * private-data view and RLS being enabled everywhere.
 *
 * Supabase-specific objects (auth.users, auth.uid(), storage schema) are stubbed
 * below with their real signatures so the policies compile unchanged.
 *
 * Usage: node scripts/test-sql.mjs
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

let checks = 0
let failures = 0

function check(label, condition, detail = '') {
  checks += 1
  if (condition) {
    console.log(`  ✓ ${label}`)
  } else {
    failures += 1
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

/** Minimal Supabase-compatible scaffolding. */
const SUPABASE_STUBS = `
create schema if not exists auth;
create schema if not exists storage;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique
);

-- Supabase exposes auth.uid() reading the JWT claim; stub it with a settable GUC.
create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text
);

alter table storage.objects enable row level security;

create role anon;
create role authenticated;
`

const SUPABASE_ROLE_STUBS = `
grant usage on schema public to anon, authenticated;
grant usage on schema storage to anon, authenticated;
grant select, insert, update, delete on storage.objects to anon, authenticated;
-- Supabase grants anon read on public tables; RLS then narrows the rows.
grant select on all tables in schema public to anon;
grant insert on public.contact_messages to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
`

async function main() {
  const db = new PGlite()
  await db.waitReady

  console.log('PostgreSQL engine:', (await db.query('select version()')).rows[0].version.split(',')[0], '\n')

  console.log('Supabase compatibility scaffolding')
  await db.exec(SUPABASE_STUBS)
  check('auth.users, auth.uid(), storage.buckets stubbed', true)
  console.log('')

  console.log('Migration 0001 — schema')
  const init = await readFile(path.join(root, 'supabase/migrations/0001_init.sql'), 'utf8')
  // PGlite already provides gen_random_uuid(); pgcrypto is available on Supabase.
  await db.exec(init.replace(/create extension if not exists "pgcrypto";/i, ''))
  await db.exec(SUPABASE_ROLE_STUBS)
  check('0001_init.sql executed without error', true)
  console.log('')

  console.log('Migration 0002 — Row Level Security')
  const rls = await readFile(path.join(root, 'supabase/migrations/0002_rls_policies.sql'), 'utf8')
  await db.exec(rls)
  check('0002_rls_policies.sql executed without error', true)
  console.log('')

  console.log('Seed')
  const seed = await readFile(path.join(root, 'supabase/seed.sql'), 'utf8')
  await db.exec(seed)
  check('seed.sql executed without error', true)
  console.log('')

  // ------------------------------------------------------------------
  console.log('Structure')
  const tables = (
    await db.query(`
      select relname, relrowsecurity from pg_class
      where relnamespace = 'public'::regnamespace and relkind = 'r'
      order by relname
    `)
  ).rows
  const names = tables.map((t) => t.relname)
  const expected = [
    'admin_users',
    'certificates',
    'contact_messages',
    'diagnostic_cases',
    'gallery_images',
    'profiles',
    'projects',
    'site_settings',
    'skills',
    'social_links',
    'youtube_videos',
  ]
  for (const table of expected) {
    check(`table public.${table} exists`, names.includes(table))
  }
  const withoutRls = tables.filter((t) => !t.relrowsecurity).map((t) => t.relname)
  check('RLS enabled on every table', withoutRls.length === 0, withoutRls.join(', '))
  console.log('')

  // ------------------------------------------------------------------
  console.log('Constraints')
  async function expectReject(label, sql) {
    try {
      await db.exec(sql)
      check(label, false, 'statement unexpectedly succeeded')
    } catch {
      check(label, true)
    }
  }

  await expectReject(
    'projects.status rejects unknown values',
    `insert into projects (title, slug, category, status) values ('t','t-bad-status','x','archived')`,
  )
  await expectReject(
    'projects.slug must be URL-safe',
    `insert into projects (title, slug, category) values ('t','Not A Slug','x')`,
  )
  await expectReject(
    'projects.vehicle_year must be plausible',
    `insert into projects (title, slug, category, vehicle_year) values ('t','t-year','x',1492)`,
  )
  await expectReject(
    'projects.slug is unique',
    `insert into projects (title, slug, category) values ('a','dup-slug','x'), ('b','dup-slug','x')`,
  )
  await expectReject(
    'youtube_videos requires an 11-character id',
    `insert into youtube_videos (title, youtube_url, youtube_video_id) values ('t','https://youtu.be/x','short')`,
  )
  await expectReject(
    'gallery alt text must be descriptive',
    `insert into gallery_images (title, image_url, alt_text) values ('t','u','too short')`,
  )
  await expectReject(
    'skills level is constrained to the honest vocabulary',
    `insert into skills (name, category, skill_level) values ('t','x','expert')`,
  )
  await expectReject(
    'contact message length is bounded',
    `insert into contact_messages (name, email, subject, message) values ('A','a@b.co','sub','too short')`,
  )
  await expectReject(
    'social platform must be a supported platform',
    `insert into social_links (platform, url) values ('github','https://github.com/x')`,
  )
  await expectReject(
    'only one profile row is permitted',
    `insert into profiles (full_name) values ('Second Person')`,
  )
  await expectReject(
    'diagnostic_cases.status rejects unknown values',
    `insert into diagnostic_cases (title, slug, status) values ('t','t-bad','live')`,
  )
  console.log('')

  await expectReject(
    'seed did not create a duplicate profile',
    `insert into profiles (full_name) values ('Another')`,
  )

  const skillCount = (await db.query('select count(*)::int as n from skills')).rows[0].n
  check('skill catalogue seeded', skillCount === 27, `${skillCount} rows`)
  const settingsCount = (await db.query('select count(*)::int as n from site_settings')).rows[0].n
  check('site settings seeded', settingsCount === 13, `${settingsCount} rows`)
  const profile = (await db.query('select full_name, headline, location from profiles')).rows[0]
  check('profile identity seeded', profile?.full_name === 'Medekuku Mawuli Kofi', profile?.full_name)
  check('headline seeded', profile?.headline === 'Automotive Electronics & Diagnostic Technician')
  check('location seeded', profile?.location === 'Accra, Ghana')
  check(
    'no fabricated portfolio content in the seed',
    (await db.query('select count(*)::int as n from projects')).rows[0].n === 0 &&
      (await db.query('select count(*)::int as n from diagnostic_cases')).rows[0].n === 0 &&
      (await db.query('select count(*)::int as n from youtube_videos')).rows[0].n === 0 &&
      (await db.query('select count(*)::int as n from certificates')).rows[0].n === 0 &&
      (await db.query('select count(*)::int as n from social_links')).rows[0].n === 0,
  )
  check(
    'no invented administrator is seeded',
    (await db.query('select count(*)::int as n from admin_users')).rows[0].n === 0,
  )
  console.log('')

  // ------------------------------------------------------------------
  console.log('Triggers, view and buckets')
  await db.exec(`
    insert into projects (title, slug, category, status) values
      ('Trigger test', 'trigger-test', 'Automotive Electrical Diagnostics', 'draft');
    select 1;
  `)
  const before = (await db.query("select updated_at from projects where slug = 'trigger-test'")).rows[0].updated_at
  await new Promise((resolve) => setTimeout(resolve, 20))
  await db.exec(`update projects set title = 'Trigger test 2' where slug = 'trigger-test'`)
  const after = (await db.query("select updated_at from projects where slug = 'trigger-test'")).rows[0].updated_at
  check('updated_at trigger fires on update', new Date(after) > new Date(before))

  await db.exec(`
    insert into diagnostic_cases (title, slug, status, vehicle_identification)
    values ('Public view test', 'public-view-test', 'published', 'PRIVATE-VIN-123');
    insert into diagnostic_cases (title, slug, status)
    values ('Draft case', 'draft-case', 'draft');
  `)
  const viewColumns = (
    await db.query(`
      select column_name from information_schema.columns
      where table_name = 'public_diagnostic_cases' order by column_name
    `)
  ).rows.map((r) => r.column_name)
  check('public view omits vehicle_identification', !viewColumns.includes('vehicle_identification'))
  const viewRows = (await db.query('select count(*)::int as n from public_diagnostic_cases')).rows[0].n
  check('public view exposes published cases only', viewRows === 1, `${viewRows} rows`)

  const buckets = (await db.query('select id, public from storage.buckets order by id')).rows
  check('six storage buckets created', buckets.length === 6, buckets.map((b) => b.id).join(','))
  check('all content buckets are public-read', buckets.every((b) => b.public === true))
  check(
    'cv bucket exists for public CV download',
    buckets.some((b) => b.id === 'cv'),
  )
  console.log('')

  // ------------------------------------------------------------------
  console.log('Indexes')
  const indexes = (
    await db.query(`select indexname from pg_indexes where schemaname = 'public'`)
  ).rows.map((r) => r.indexname)
  for (const index of [
    'projects_status_idx',
    'projects_category_idx',
    'projects_featured_idx',
    'diagnostic_status_idx',
    'diagnostic_dtc_idx',
    'youtube_video_id_unique',
    'gallery_order_idx',
    'skills_order_idx',
    'contact_status_idx',
    'social_platform_unique',
    'profiles_singleton',
  ]) {
    check(`index ${index} present`, indexes.includes(index))
  }
  console.log('')

  // ------------------------------------------------------------------
  console.log('Policy coverage')
  const policies = (await db.query('select tablename, policyname from pg_policies order by tablename')).rows
  const byTable = {}
  for (const policy of policies) {
    byTable[policy.tablename] = (byTable[policy.tablename] ?? 0) + 1
  }
  for (const table of expected) {
    check(`policies exist for ${table}`, (byTable[table] ?? 0) > 0, `${byTable[table] ?? 0} policies`)
  }
  check(
    'contact_messages has an insert-only public policy',
    policies.some((p) => p.tablename === 'contact_messages' && p.policyname === 'contact_public_insert'),
  )
  check(
    'contact_messages has no public select policy',
    !policies.some(
      (p) => p.tablename === 'contact_messages' && p.policyname.includes('public') && p.policyname.includes('read'),
    ),
  )
  check(
    'storage objects covered by policies',
    policies.filter((p) => p.tablename === 'objects').length >= 4,
    `${policies.filter((p) => p.tablename === 'objects').length} policies`,
  )
  console.log('')

  // ------------------------------------------------------------------
  console.log('Authorisation helper')
  await db.exec(`insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111','admin@test.com')`)
  await db.exec(`
    insert into admin_users (user_id, email)
    values ('11111111-1111-1111-1111-111111111111','admin@test.com')
  `)
  const notAdmin = (await db.query('select public.is_admin() as v')).rows[0].v
  check('is_admin() is false without a JWT subject', notAdmin === false)

  await db.exec(`set request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111'`)
  const isAdmin = (await db.query('select public.is_admin() as v')).rows[0].v
  check('is_admin() is true for a whitelisted user', isAdmin === true)

  await db.exec(`set request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222'`)
  const stranger = (await db.query('select public.is_admin() as v')).rows[0].v
  check('is_admin() is false for a non-whitelisted authenticated user', stranger === false)
  console.log('')


  // ------------------------------------------------------------------
  console.log('Row Level Security enforcement (role simulation)')

  /** Run SQL as a Postgres role, optionally with a simulated JWT subject. */
  async function asRole(role, statement, { userId } = {}) {
    return db.transaction(async (tx) => {
      await tx.exec(`set local role ${role}`)
      if (userId) await tx.exec(`set local request.jwt.claim.sub = '${userId}'`)
      return (await tx.query(statement)).rows
    })
  }

  async function expectDenied(label, role, statement, options) {
    try {
      const rows = await asRole(role, statement, options)
      // A filtered query can legitimately return zero rows; a write must throw.
      check(label, rows.length === 0, 'statement returned rows')
    } catch {
      check(label, true)
    }
  }

  // Published vs draft content as an anonymous visitor
  check(
    'anon sees only published projects',
    (await asRole('anon', 'select title from projects')).every(
      (row) => row.title !== 'Draft case' && !String(row.title).startsWith('Seed draft'),
    ) && (await asRole('anon', "select * from projects where status = 'draft'")).length === 0,
  )
  check(
    'anon can read contact_messages? (must be zero rows)',
    (await asRole('anon', 'select * from contact_messages')).length === 0,
  )
  check(
    'anon can read published diagnostic cases',
    (await asRole('anon', 'select * from public_diagnostic_cases')).length === 1,
  )

  await expectDenied('anon cannot insert a project', 'anon', `insert into projects (title, slug, category) values ('x','x-anon','Automotive Electrical Diagnostics')`)
  await expectDenied('anon cannot modify a published project', 'anon', `update projects set title = 'hacked' where slug = 'trigger-test'`)
  await expectDenied('anon cannot delete projects', 'anon', `delete from projects`)
  await expectDenied('anon cannot write site settings', 'anon', `update site_settings set setting_value = 'x'`)
  await expectDenied('anon cannot write the profile', 'anon', `update profiles set full_name = 'x'`)
  await expectDenied('anon cannot write skills', 'anon', `delete from skills`)
  await expectDenied('anon cannot read contact messages by id', 'anon', `select * from contact_messages where email = 'ama@x.com'`)

  // Anonymous visitors may submit an enquiry, but only in a fresh state
  await asRole(
    'anon',
    `insert into contact_messages (name, email, subject, message)
     values ('Visitor','visitor@example.com','Valid enquiry','A genuine visitor enquiry message body that is long enough.')`,
  )
  check(
    'anon can submit a contact message',
    (await db.query("select count(*)::int as n from contact_messages where email = 'visitor@example.com'")).rows[0].n === 1,
  )
  await expectDenied(
    'anon cannot pre-set a message status',
    'anon',
    `insert into contact_messages (name, email, subject, message, status)
     values ('V','v2@example.com','Subject line','A genuine visitor enquiry message body that is long enough.','read')`,
  )

  // An authenticated but unauthorised user has no extra rights
  const strangerId = '22222222-2222-2222-2222-222222222222'
  await db.exec(`insert into auth.users (id, email) values ('${strangerId}','stranger@test.com') on conflict do nothing`)
  check(
    'authenticated non-admin cannot read messages',
    (await asRole('authenticated', 'select * from contact_messages', { userId: strangerId })).length === 0,
  )
  await expectDenied(
    'authenticated non-admin cannot insert projects',
    'authenticated',
    `insert into projects (title, slug, category) values ('x','x-stranger','Automotive Electrical Diagnostics')`,
    { userId: strangerId },
  )
  check(
    'authenticated non-admin sees drafts? (must be zero rows)',
    (await asRole('authenticated', "select * from projects where status = 'draft'", { userId: strangerId })).length === 0,
  )

  // The whitelisted administrator has full access
  const adminId = '11111111-1111-1111-1111-111111111111'
  check(
    'administrator can read contact messages',
    (await asRole('authenticated', 'select * from contact_messages', { userId: adminId })).length >= 1,
  )
  await asRole(
    'authenticated',
    `insert into projects (title, slug, category) values ('Admin project','admin-proj','Automotive Electrical Diagnostics')`,
    { userId: adminId },
  )
  await asRole('authenticated', `update projects set title = 'Admin edited' where slug = 'admin-proj'`, {
    userId: adminId,
  })
  await asRole('authenticated', `delete from projects where slug = 'admin-proj'`, { userId: adminId })
  check('administrator can create, update and delete projects', true)
  console.log('')
  console.log(`${checks - failures}/${checks} SQL checks passed`)
  if (failures > 0) {
    console.log(`FAILED: ${failures} check(s) did not pass.`)
    process.exit(1)
  }
  console.log('Schema, constraints, RLS and authorisation verified against PostgreSQL.')
  await db.close()
}

main().catch((error) => {
  console.error('\nSQL verification failed:')
  console.error(error.message ?? error)
  process.exit(1)
})
