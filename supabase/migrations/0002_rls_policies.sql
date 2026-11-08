-- =====================================================================
-- Mawuli Engineering & Diagnostic Services
-- 0002 — Row Level Security policies
-- =====================================================================
-- Model
--   anon / authenticated visitors : read published content, insert contact
--                                   messages, read nothing private, write nothing
--   administrators               : defined by membership of public.admin_users
--                                   (via public.is_admin()) — full CRUD
-- =====================================================================

-- Enable RLS everywhere. Tables without policies are effectively deny-all.
alter table public.admin_users       enable row level security;
alter table public.profiles          enable row level security;
alter table public.projects          enable row level security;
alter table public.diagnostic_cases  enable row level security;
alter table public.youtube_videos    enable row level security;
alter table public.gallery_images    enable row level security;
alter table public.skills            enable row level security;
alter table public.certificates      enable row level security;
alter table public.contact_messages  enable row level security;
alter table public.social_links      enable row level security;
alter table public.site_settings     enable row level security;

-- ---------------------------------------------------------------------
-- admin_users: an administrator may see their own membership row only.
-- ---------------------------------------------------------------------
drop policy if exists admin_users_select_self on public.admin_users;
create policy admin_users_select_self on public.admin_users
  for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
drop policy if exists profiles_public_read on public.profiles;
create policy profiles_public_read on public.profiles
  for select to anon, authenticated
  using (true);

drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- projects — public may read published rows only
-- ---------------------------------------------------------------------
drop policy if exists projects_public_read on public.projects;
create policy projects_public_read on public.projects
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists projects_admin_all on public.projects;
create policy projects_admin_all on public.projects
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- diagnostic_cases
-- ---------------------------------------------------------------------
drop policy if exists diagnostic_public_read on public.diagnostic_cases;
create policy diagnostic_public_read on public.diagnostic_cases
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists diagnostic_admin_all on public.diagnostic_cases;
create policy diagnostic_admin_all on public.diagnostic_cases
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- youtube_videos
-- ---------------------------------------------------------------------
drop policy if exists youtube_public_read on public.youtube_videos;
create policy youtube_public_read on public.youtube_videos
  for select to anon, authenticated
  using (status = 'published');

drop policy if exists youtube_admin_all on public.youtube_videos;
create policy youtube_admin_all on public.youtube_videos
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------
-- gallery_images / skills / certificates / social_links — public read
-- ---------------------------------------------------------------------
drop policy if exists gallery_public_read on public.gallery_images;
create policy gallery_public_read on public.gallery_images
  for select to anon, authenticated using (true);

drop policy if exists gallery_admin_all on public.gallery_images;
create policy gallery_admin_all on public.gallery_images
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists skills_public_read on public.skills;
create policy skills_public_read on public.skills
  for select to anon, authenticated using (true);

drop policy if exists skills_admin_all on public.skills;
create policy skills_admin_all on public.skills
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists certificates_public_read on public.certificates;
create policy certificates_public_read on public.certificates
  for select to anon, authenticated using (true);

drop policy if exists certificates_admin_all on public.certificates;
create policy certificates_admin_all on public.certificates
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists social_public_read on public.social_links;
create policy social_public_read on public.social_links
  for select to anon, authenticated using (true);

drop policy if exists social_admin_all on public.social_links;
create policy social_admin_all on public.social_links
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- contact_messages — insert-only for visitors, read/admin for admins
-- ---------------------------------------------------------------------
drop policy if exists contact_public_insert on public.contact_messages;
create policy contact_public_insert on public.contact_messages
  for insert to anon, authenticated
  with check (
    -- force a fresh, server-generated record in a known initial state
    status = 'new'
    and char_length(name) between 2 and 160
    and position('@' in email) > 1
    and char_length(subject) between 3 and 200
    and char_length(message) between 20 and 5000
  );

drop policy if exists contact_admin_read on public.contact_messages;
create policy contact_admin_read on public.contact_messages
  for select to authenticated
  using (public.is_admin());

drop policy if exists contact_admin_update on public.contact_messages;
create policy contact_admin_update on public.contact_messages
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists contact_admin_delete on public.contact_messages;
create policy contact_admin_delete on public.contact_messages
  for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- site_settings — public read, admin write
-- ---------------------------------------------------------------------
drop policy if exists settings_public_read on public.site_settings;
create policy settings_public_read on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists settings_admin_all on public.site_settings;
create policy settings_admin_all on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- Storage policies
--   * public read for the six content buckets (CDN URLs are public anyway)
--   * write/update/delete restricted to administrators
-- ---------------------------------------------------------------------
drop policy if exists storage_public_read on storage.objects;
create policy storage_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('gallery', 'projects', 'certificates', 'profile', 'videos', 'cv'));

drop policy if exists storage_admin_insert on storage.objects;
create policy storage_admin_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('gallery', 'projects', 'certificates', 'profile', 'videos', 'cv')
    and public.is_admin()
  );

drop policy if exists storage_admin_update on storage.objects;
create policy storage_admin_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('gallery', 'projects', 'certificates', 'profile', 'videos', 'cv')
    and public.is_admin()
  );

drop policy if exists storage_admin_delete on storage.objects;
create policy storage_admin_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('gallery', 'projects', 'certificates', 'profile', 'videos', 'cv')
    and public.is_admin()
  );

-- ---------------------------------------------------------------------
-- Grants: anon may never write to content tables.
-- ---------------------------------------------------------------------
revoke all on public.admin_users from anon;
revoke insert, update, delete on public.projects, public.diagnostic_cases,
  public.youtube_videos, public.gallery_images, public.skills,
  public.certificates, public.social_links, public.site_settings, public.profiles
  from anon;

grant select on public.public_diagnostic_cases to anon, authenticated;
