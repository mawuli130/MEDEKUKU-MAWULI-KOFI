-- =====================================================================
-- Mawuli Engineering & Diagnostic Services
-- 0001 — Schema, indexes and constraints
-- =====================================================================
-- Run in the Supabase SQL editor (or `supabase db push`) before the
-- policies migration. Safe to re-run: every object is created IF NOT EXISTS.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Shared helper: keep updated_at accurate on every write
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Administrator whitelist
-- Membership of this table is what makes an authenticated user an admin.
-- Populated manually (see README) — never exposed to the public API.
-- ---------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  display_name text,
  created_at  timestamptz not null default now()
);

comment on table public.admin_users is
  'Whitelist of administrators. RLS policies check membership here for every write.';

-- Security-definer helper avoids recursive RLS evaluation on admin_users.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------
-- profiles (singleton row)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key default gen_random_uuid(),
  full_name             text not null default 'Medekuku Mawuli Kofi',
  headline              text not null default 'Automotive Electronics & Diagnostic Technician',
  biography             text not null default '',
  hero_intro            text not null default '',
  location              text not null default 'Accra, Ghana',
  profile_image         text,
  email                 text,
  phone                 text,
  cv_url                text,
  career_goals          text,
  automotive_interests  jsonb not null default '[]'::jsonb,
  timeline              jsonb not null default '[]'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint profiles_email_format check (email is null or position('@' in email) > 1),
  constraint profiles_interests_is_array check (jsonb_typeof(automotive_interests) = 'array'),
  constraint profiles_timeline_is_array check (jsonb_typeof(timeline) = 'array')
);

comment on table public.profiles is 'Single public profile row; read by all visitors, written by admins only.';
comment on column public.profiles.timeline is 'JSONB array of {id, period, title, organisation, description, kind}.';

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Only one profile row may exist.
create unique index if not exists profiles_singleton on public.profiles ((true));

-- ---------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  slug                  text not null unique,
  category              text not null,
  description           text not null default '',
  vehicle_make          text not null default '',
  vehicle_model         text not null default '',
  vehicle_year          integer,
  engine                text not null default '',
  transmission          text not null default '',
  vehicle_system        text not null default '',
  problem_statement     text not null default '',
  diagnostic_procedure  text not null default '',
  tools_used            jsonb not null default '[]'::jsonb,
  measurements          jsonb not null default '[]'::jsonb,
  repair_procedure      text not null default '',
  final_result          text not null default '',
  cover_image           text,
  gallery               jsonb not null default '[]'::jsonb,
  youtube_url           text,
  featured              boolean not null default false,
  status                text not null default 'draft',
  seo_title             text,
  seo_description       text,
  published_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint projects_status_check check (status in ('draft', 'published')),
  constraint projects_year_check check (vehicle_year is null or vehicle_year between 1900 and 2100),
  constraint projects_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint projects_tools_is_array check (jsonb_typeof(tools_used) = 'array'),
  constraint projects_measurements_is_array check (jsonb_typeof(measurements) = 'array'),
  constraint projects_gallery_is_array check (jsonb_typeof(gallery) = 'array'),
  constraint projects_title_length check (char_length(title) between 3 and 180),
  constraint projects_seo_description_length check (seo_description is null or char_length(seo_description) <= 320)
);

comment on table public.projects is 'Documented automotive work performed on real vehicles.';

create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_published_idx on public.projects (published_at desc nulls last) where status = 'published';
create index if not exists projects_category_idx on public.projects (category);
create index if not exists projects_featured_idx on public.projects (featured) where featured = true;
create index if not exists projects_search_idx on public.projects
  using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(vehicle_system, '')));

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- diagnostic_cases
-- ---------------------------------------------------------------------
create table if not exists public.diagnostic_cases (
  id                     uuid primary key default gen_random_uuid(),
  project_id             uuid references public.projects (id) on delete set null,
  title                  text not null,
  slug                   text not null unique,
  vehicle_make           text not null default '',
  vehicle_model          text not null default '',
  vehicle_year           integer,
  engine                 text not null default '',
  transmission           text not null default '',
  vehicle_system         text not null default '',
  vehicle_identification text,
  customer_complaint     text not null default '',
  dtc_codes              jsonb not null default '[]'::jsonb,
  scan_tool              text not null default '',
  freeze_frame           text not null default '',
  live_data              text not null default '',
  diagnostic_procedure   jsonb not null default '[]'::jsonb,
  measurements           jsonb not null default '[]'::jsonb,
  confirmed_fault        text not null default '',
  repair_procedure       text not null default '',
  verification           jsonb not null default '[]'::jsonb,
  media                  jsonb not null default '[]'::jsonb,
  youtube_url            text,
  featured               boolean not null default false,
  status                 text not null default 'draft',
  seo_title              text,
  seo_description        text,
  published_at           timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint diagnostic_status_check check (status in ('draft', 'published')),
  constraint diagnostic_year_check check (vehicle_year is null or vehicle_year between 1900 and 2100),
  constraint diagnostic_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint diagnostic_dtc_is_array check (jsonb_typeof(dtc_codes) = 'array'),
  constraint diagnostic_procedure_is_array check (jsonb_typeof(diagnostic_procedure) = 'array'),
  constraint diagnostic_measurements_is_array check (jsonb_typeof(measurements) = 'array'),
  constraint diagnostic_verification_is_array check (jsonb_typeof(verification) = 'array'),
  constraint diagnostic_media_is_array check (jsonb_typeof(media) = 'array')
);

comment on table public.diagnostic_cases is
  'Structured automotive diagnostic reports. vehicle_identification is private and is never returned by the public view.';

create index if not exists diagnostic_status_idx on public.diagnostic_cases (status);
create index if not exists diagnostic_published_idx on public.diagnostic_cases (published_at desc nulls last) where status = 'published';
create index if not exists diagnostic_project_idx on public.diagnostic_cases (project_id);
create index if not exists diagnostic_system_idx on public.diagnostic_cases (vehicle_system);
create index if not exists diagnostic_dtc_idx on public.diagnostic_cases using gin (dtc_codes jsonb_path_ops);

drop trigger if exists diagnostic_set_updated_at on public.diagnostic_cases;
create trigger diagnostic_set_updated_at before update on public.diagnostic_cases
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- youtube_videos
-- ---------------------------------------------------------------------
create table if not exists public.youtube_videos (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text not null default '',
  youtube_url       text not null,
  youtube_video_id  text not null,
  thumbnail_url     text,
  category          text not null default 'Vehicle Diagnostics',
  vehicle_make      text not null default '',
  vehicle_model     text not null default '',
  featured          boolean not null default false,
  status            text not null default 'draft',
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint youtube_status_check check (status in ('draft', 'published')),
  constraint youtube_video_id_format check (youtube_video_id ~ '^[A-Za-z0-9_-]{11}$'),
  constraint youtube_url_length check (char_length(youtube_url) <= 500)
);

create unique index if not exists youtube_video_id_unique on public.youtube_videos (youtube_video_id);
create index if not exists youtube_status_idx on public.youtube_videos (status);
create index if not exists youtube_category_idx on public.youtube_videos (category);

drop trigger if exists youtube_set_updated_at on public.youtube_videos;
create trigger youtube_set_updated_at before update on public.youtube_videos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- gallery_images
-- ---------------------------------------------------------------------
create table if not exists public.gallery_images (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text not null default '',
  image_url      text not null,
  alt_text       text not null,
  category       text not null default 'Automotive Diagnostics',
  featured       boolean not null default false,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- Alt text must describe the photograph, not merely label it.
  constraint gallery_alt_text_length check (char_length(alt_text) between 12 and 400),
  constraint gallery_display_order_check check (display_order between 0 and 9999)
);

create index if not exists gallery_order_idx on public.gallery_images (display_order asc, created_at desc);
create index if not exists gallery_category_idx on public.gallery_images (category);

drop trigger if exists gallery_set_updated_at on public.gallery_images;
create trigger gallery_set_updated_at before update on public.gallery_images
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- skills
-- ---------------------------------------------------------------------
create table if not exists public.skills (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  category       text not null,
  description    text not null default '',
  skill_level    text not null default 'practical',
  display_order  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint skills_level_check check (skill_level in ('practical', 'developing', 'interest')),
  constraint skills_order_check check (display_order between 0 and 9999)
);

create index if not exists skills_order_idx on public.skills (category, display_order asc);

drop trigger if exists skills_set_updated_at on public.skills;
create trigger skills_set_updated_at before update on public.skills
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- certificates
-- ---------------------------------------------------------------------
create table if not exists public.certificates (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  slug              text not null unique,
  institution       text not null,
  issue_date        date,
  description       text not null default '',
  certificate_url   text,
  verification_url  text,
  featured          boolean not null default false,
  display_order     integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint certificates_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index if not exists certificates_order_idx on public.certificates (display_order asc, issue_date desc nulls last);

drop trigger if exists certificates_set_updated_at on public.certificates;
create trigger certificates_set_updated_at before update on public.certificates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- contact_messages (private)
-- ---------------------------------------------------------------------
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  subject     text not null,
  message     text not null,
  status      text not null default 'new',
  created_at  timestamptz not null default now(),
  constraint contact_status_check check (status in ('new', 'read', 'archived')),
  constraint contact_name_length check (char_length(name) between 2 and 160),
  constraint contact_email_format check (position('@' in email) > 1),
  constraint contact_subject_length check (char_length(subject) between 3 and 200),
  constraint contact_message_length check (char_length(message) between 20 and 5000)
);

comment on table public.contact_messages is
  'Enquiries from the contact form. Insert-only for the public; readable only by administrators.';

create index if not exists contact_status_idx on public.contact_messages (status);
create index if not exists contact_created_idx on public.contact_messages (created_at desc);

-- ---------------------------------------------------------------------
-- social_links
-- ---------------------------------------------------------------------
create table if not exists public.social_links (
  id             uuid primary key default gen_random_uuid(),
  platform       text not null,
  url            text not null,
  handle         text,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint social_platform_check check (
    platform in ('youtube', 'linkedin', 'whatsapp', 'facebook', 'x', 'email', 'phone')
  )
);

create unique index if not exists social_platform_unique on public.social_links (platform);
create index if not exists social_order_idx on public.social_links (display_order asc);

drop trigger if exists social_set_updated_at on public.social_links;
create trigger social_set_updated_at before update on public.social_links
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- site_settings (key/value)
-- ---------------------------------------------------------------------
create table if not exists public.site_settings (
  setting_key    text primary key,
  setting_value  text not null default '',
  updated_at     timestamptz not null default now()
);

create index if not exists settings_updated_idx on public.site_settings (updated_at desc);

drop trigger if exists settings_set_updated_at on public.site_settings;
create trigger settings_set_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Public-safe view for diagnostic cases (strips private identification)
-- ---------------------------------------------------------------------
create or replace view public.public_diagnostic_cases
with (security_invoker = true) as
select
  id, project_id, title, slug, vehicle_make, vehicle_model, vehicle_year, engine,
  transmission, vehicle_system, customer_complaint, dtc_codes, scan_tool,
  freeze_frame, live_data, diagnostic_procedure, measurements, confirmed_fault,
  repair_procedure, verification, media, youtube_url, featured, status,
  seo_title, seo_description, published_at, created_at, updated_at
from public.diagnostic_cases
where status = 'published';

comment on view public.public_diagnostic_cases is
  'Published diagnostic reports with vehicle_identification removed. Intended for public/anon use.';

-- ---------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('gallery',      'gallery',      true, 8388608, array['image/jpeg','image/png','image/webp','image/avif']),
  ('projects',     'projects',     true, 8388608, array['image/jpeg','image/png','image/webp','image/avif']),
  ('certificates', 'certificates', true, 8388608, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('profile',      'profile',      true, 8388608, array['image/jpeg','image/png','image/webp','image/avif']),
  ('videos',       'videos',       true, 8388608, array['image/jpeg','image/png','image/webp','image/avif']),
  ('cv',           'cv',           true, 8388608, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
