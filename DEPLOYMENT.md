# Deployment guide — Mawuli Engineering & Diagnostic Services

Step-by-step from an empty Supabase project to a live, indexed site on Vercel.

---

## 0. Prerequisites

- Node.js 20+ and npm
- A [Supabase](https://supabase.com) account
- A [Vercel](https://vercel.com) account
- The domain you intend to use (optional but recommended for SEO)

---

## 1. Install dependencies

```bash
git clone <your-repo-url> mawuli-portfolio
cd mawuli-portfolio
npm install
```

---

## 2. Create the Supabase project

1. supabase.com → **New project**
2. Name: `mawuli-diagnostics`. Choose a region close to Ghana (`eu-west-1`/`eu-central-1`).
3. Save the generated database password somewhere safe.
4. Wait for provisioning to finish.

---

## 3. Execute the SQL migrations

Supabase Dashboard → **SQL Editor** → **New query**. Run each file, in this order, and
confirm "Success":

| Order | File | Creates |
|---|---|---|
| 1 | `supabase/migrations/0001_init.sql` | Tables, indexes, constraints, triggers, public view, storage buckets |
| 2 | `supabase/migrations/0002_rls_policies.sql` | Row Level Security policies on every table and bucket |
| 3 | `supabase/seed.sql` | Profile statement, site settings, skill catalogue |

The scripts are idempotent (`IF NOT EXISTS`, `ON CONFLICT`) and safe to re-run.

With the Supabase CLI you can instead use:

```bash
supabase link --project-ref <ref>
supabase db push
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

### Verify

```sql
-- RLS must be true on every table
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r'
order by relname;

-- Buckets
select id, public, file_size_limit from storage.buckets order by id;

-- Seed present
select count(*) from public.skills;      -- 27
select count(*) from public.site_settings; -- 13
```

---

## 4. Create the storage buckets

The migration creates them automatically. Confirm under **Storage**:

| Bucket | Public | Contents |
|---|---|---|
| `profile` | yes | Portrait, Open Graph image |
| `projects` | yes | Project covers, gallery, diagnostic media |
| `gallery` | yes | Workshop photographs |
| `certificates` | yes | Certificate scans/PDFs |
| `videos` | yes | Custom video thumbnails |
| `cv` | yes | The CV PDF (public download, no login) |

If you prefer to create them by hand, use exactly these ids and mark each **public**;
otherwise the storage policies in `0002` will not match.

---

## 5. Configure environment variables

Local: copy the template and fill it in.

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...        # anon public key only
VITE_SITE_URL=https://your-domain.com       # no trailing slash
```

Get both values from **Project Settings → API**.

> ⚠️ Never put the `service_role` key in a `VITE_` variable. Vite inlines those into the
> browser bundle, and the service key bypasses every RLS policy.

---

## 6. Create the administrator account securely

Public registration stays disabled; administrators are created deliberately.

1. **Authentication → Sign In / Providers → Email**: enable email/password, and turn
   **off** "Allow new users to sign up".
2. **Authentication → Users → Add user**: enter the email and a strong password
   (12+ characters, mixed case, number). Confirm the email.
3. Authorise the account — **SQL Editor**:

```sql
insert into public.admin_users (user_id, email, display_name)
select id, email, 'Medekuku Mawuli Kofi'
from auth.users
where email = 'you@example.com'
on conflict (user_id) do nothing;
```

4. Sign in at `/admin`. If the dashboard loads but saving fails with a permission error,
   the `admin_users` row is missing or the email does not match.
5. Password reset: `/admin` → *Forgot password?* (requires the site URL to be configured
   in **Authentication → URL Configuration → Redirect URLs**: add
   `https://your-domain.com/admin/reset-password`).

---

## 7. Run locally

```bash
npm run dev          # http://localhost:5173
```

Check that the admin top bar reads **Supabase live**. If it reads *Local preview*, the
environment variables were not picked up — restart the dev server.

Populate content at `/admin`:

1. **Profile Management** — upload the portrait, confirm the headline and biography
2. **About Me** — add real timeline entries only
3. **Automotive Projects** — add work with photographs and measurements
4. **Diagnostic Cases** — add the reports (this is the strongest section)
5. **YouTube Videos** — paste channel video URLs
6. **Workshop Gallery** — upload photographs with accurate alt text
7. **Certificates**, **CV Management** — upload documents
8. **Social Links** — YouTube and LinkedIn at minimum (used in structured data)
9. **SEO Settings** — confirm the meta title/description, upload a 1200×630 OG image

---

## 8. Build the application

```bash
npm run build
```

This runs, in order:

1. `tsc -b` — strict type check (must be clean)
2. `vite build` — client bundles, code-split per route
3. `node scripts/prerender.mjs` — static HTML for all 10 public routes
4. `node scripts/generate-sitemap.mjs` — `sitemap.xml` (adds published detail pages when
   Supabase credentials exist in the build environment)

Verify the output:

```bash
npm run preview      # serves dist/ with Vercel-compatible routing on :4180
npm run test:routes  # 102 checks
npm run test:sql     # 86 schema + RLS checks against real PostgreSQL: routes, SEO, robots, sitemap, bundle security
```

---

## 9. Deploy to Vercel

### Via the dashboard (recommended)

1. Push the repository to GitHub.
2. Vercel → **Add New → Project** → import the repository.
3. Framework preset: **Vite** (auto-detected via `vercel.json`).
   - Build command: `npm run build`
   - Output directory: `dist`
4. **Environment Variables** — add for *Production*, *Preview* and *Development*:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SITE_URL` (your final domain)
5. **Deploy**.

### Via the CLI

```bash
npm i -g vercel
vercel link
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
vercel env add VITE_SITE_URL production
vercel --prod
```

### Why React Router keeps working

`vercel.json` provides:

- `cleanUrls: true` and `trailingSlash: false` for canonical, extension-less URLs
- rewrites for `/admin/*` and every dynamic detail route to `/index.html`
- immutable caching for `/assets/*`, revalidation for HTML
- security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, HSTS

Prerendered directories (`dist/about/index.html`, …) are served directly by Vercel, so
public pages arrive with full HTML; only admin and dynamic detail routes fall through to
the SPA shell.

---

## 10. Configure the production domain

1. Vercel → **Settings → Domains** → add your domain and follow the DNS instructions.
2. Set `VITE_SITE_URL` to that exact origin (e.g. `https://mawulidiagnostics.com`).
3. In Supabase → **Authentication → URL Configuration**:
   - Site URL: `https://your-domain.com`
   - Redirect URLs: add `https://your-domain.com/admin/reset-password`
4. Redeploy. `robots.txt`'s `Sitemap:` line, the sitemap URLs, canonicals and Open Graph
   URLs are all generated from `VITE_SITE_URL` at build time — once that variable is set
   there is nothing to hand-edit.

---

## 11. Verify SEO

After the first production deploy:

1. **Titles** — view source on `/`, `/about`, `/projects`, `/diagnostics`. Each `<title>`
   and `<meta name="description">` must be unique, and `<div id="root">` must contain
   rendered markup (prerender working, not an empty shell).
2. **Canonicals** — `<link rel="canonical">` matches the page's production URL.
3. **Robots** — `https://your-domain.com/robots.txt` returns 200, disallows `/admin`.
4. **Sitemap** — `https://your-domain.com/sitemap.xml` returns 200 with XML and lists
   public URLs only.
5. **Structured data** — paste a page into
   [Rich Results Test](https://search.google.com/test/rich-results). `Person` should be
   detected on `/` and `/about`, `TechArticle` on case studies, `VideoObject` on videos.
6. **Social preview** — check WhatsApp/LinkedIn with the
   [OpenGraph debugger](https://developers.facebook.com/tools/debug/). The OG image must
   be 1200×630 and publicly reachable.
7. **Mobile** — Lighthouse mobile ≥ 90 for performance and accessibility; layout works
   from 320 px upward.
8. **Google Search Console** — add the domain, submit
   `https://your-domain.com/sitemap.xml`, request indexing for the homepage, About,
   Projects and Diagnostics.
9. Replace nothing with fake content: indexed pages are only as strong as the real
   projects behind them.

---

## 12. Test the admin dashboard in production

1. Visit `https://your-domain.com/admin` → sign in with the authorised account.
2. Confirm the top bar shows **Supabase live** (not "Local preview").
3. Create a project as **Draft**; verify it is absent from `/projects` while signed out
   or in a private window.
4. Set it to **Published**; verify it appears on `/projects` and `/` (if featured), and
   that its detail page loads. Re-run `npm run build` locally or wait for the next deploy
   to include it in `sitemap.xml` (or leave Supabase credentials in the Vercel build
   environment so the sitemap includes it automatically).
5. Upload an image (profile, project, gallery) and confirm it renders from Supabase
   Storage.
6. Upload the CV PDF → `/cv` download works without signing in.
7. Submit the contact form as a visitor → the message appears only under
   **Contact Messages**.
8. Try to read a draft or a message with an anonymous Supabase client (e.g. a browser
   console snippet using the anon key) — it must return **no rows**.
9. Sign out and navigate directly to `/admin/dashboard` — you must be returned to the
   sign-in screen.

---

## 13. Routine maintenance

| Task | How |
|---|---|
| Add a project or case study | `/admin` — no redeploy needed |
| Replace the CV | `/admin/cv` |
| Update meta titles | `/admin/seo` |
| Rotate an administrator | Remove the `admin_users` row, then delete the Auth user |
| Back up content | Supabase → Database → Backups (daily on paid plans); export tables with `pg_dump` |
| Refresh the sitemap | Redeploy; or set Supabase credentials in the build env so entries are generated automatically |
| Monitor errors | Vercel → Deployments → Functions/Runtime logs; Supabase → Logs |

---

## 14. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Admin top bar says "Local preview" | Env vars missing at build time | Add `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in Vercel, then redeploy |
| Sign-in works but saves fail with 403 | Account not in `admin_users` | Run the insert in §6 |
| `permission denied for table …` | Migration 0002 not applied | Run `0002_rls_policies.sql` |
| Direct visit to `/projects/foo` returns 404 | Rewrites missing | Ensure `vercel.json` is committed and Vercel built from the repo root |
| Upload fails with "Bucket not found" | Storage buckets absent | Re-run the bucket section of `0001_init.sql` |
| Old content visible after deploy | Client cache | Hard reload; HTML is `must-revalidate`, assets are immutable |
| Canonical or sitemap points at the vercel.app URL | `VITE_SITE_URL` not set | Set it to the production domain and redeploy |
| Password reset link doesn't open | Redirect URL not allow-listed | Supabase → Authentication → URL Configuration |

---

## 15. Pre-launch checklist

- [ ] Strict type check clean (`npm run typecheck`)
- [ ] `npm test` green (36 tests)
- [ ] `npm run build` succeeds; `npm run test:routes` green (102 checks), `npm run test:sql` green (86 checks)
- [ ] Real content added: projects, case studies, gallery, videos, certificates, CV
- [ ] Portrait uploaded (or the placeholder accepted deliberately)
- [ ] Only real certificates and timeline entries published
- [ ] Social links added — YouTube and LinkedIn feed the `sameAs` structured data
- [ ] `VITE_SITE_URL` set to the production domain
- [ ] `robots.txt` declares the production domain (automatic once `VITE_SITE_URL` is set)
- [ ] RLS confirmed enabled on every table
- [ ] Public sign-ups disabled in Supabase Auth
- [ ] Admin password stored in a password manager (12+ characters)
- [ ] Sitemap submitted to Google Search Console
- [ ] Mobile pages checked on a real phone at 320–390 px
- [ ] Contact form tested end-to-end from a signed-out browser
