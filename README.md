# Mawuli Engineering & Diagnostic Services

Automotive engineering, electronics and vehicle diagnostics portfolio for
**Medekuku Mawuli Kofi** — *Automotive Electronics & Diagnostic Technician*, Accra, Ghana.

A complete, production-ready application: public portfolio, editable content managed
entirely from a secure dashboard, PostgreSQL schema with Row Level Security, and
prerendered, SEO-optimised pages.

---

## Contents

1. [What this is](#1-what-this-is)
2. [Technology](#2-technology)
3. [Quick start](#3-quick-start)
4. [Environment variables](#4-environment-variables)
5. [Supabase setup](#5-supabase-setup)
6. [Creating the administrator](#6-creating-the-administrator)
7. [Data model](#7-data-model)
8. [Security model](#8-security-model)
9. [Content management](#9-content-management)
10. [SEO and prerendering](#10-seo-and-prerendering)
11. [Testing](#11-testing)
12. [Deployment](#12-deployment)
13. [Project structure](#13-project-structure)
14. [Content honesty policy](#14-content-honesty-policy)

---

## 1. What this is

A working automotive technician's portfolio, built to be shown to workshops,
dealerships, diagnostic centres and international recruiters. It is deliberately
**not** a software-developer portfolio: no GitHub, no programming languages, no
full-stack headline anywhere in the public UI.

Public pages

| Route | Purpose |
|---|---|
| `/` | Hero, featured projects, diagnostic cases, videos, skills, gallery, certificates, bio, contact |
| `/about` | Professional profile, automotive interests, career goals, editable timeline |
| `/projects` + `/projects/:slug` | Documented vehicle work with category filtering |
| `/diagnostics` + `/diagnostics/:slug` | Technical diagnostic reports (the core feature) |
| `/videos` + `/videos/:id` | YouTube portfolio, privacy-enhanced embeds, `VideoObject` data |
| `/gallery` | Workshop photography with lightbox |
| `/skills` | Skills by system, marked practical / developing / technical interest |
| `/certificates` + `/certificates/:slug` | Training and achievements |
| `/cv` | Generated CV page + downloadable PDF |
| `/contact` | Validated contact form, social links |

Administration: `/admin` (sign in) → `/admin/dashboard` with 14 management sections.

---

## 2. Technology

- **Frontend** — React 19, TypeScript (strict), Vite 8, Tailwind CSS v4, React Router 7, Lucide icons, Zod
- **Backend** — Supabase: PostgreSQL, Auth, Storage, Row Level Security
- **Deployment** — Vercel
- **Testing** — Vitest + Testing Library, plus a production server smoke test

These power the site; they are never advertised as the owner's skills.

---

## 3. Quick start

```bash
npm install
cp .env.example .env      # then fill in your Supabase values (or leave empty)
npm run dev               # http://localhost:5173
```

### Two data modes

| Mode | When | Behaviour |
|---|---|---|
| **Supabase** | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` set | Real database, real auth, real storage |
| **Local preview** | Those variables absent (or `VITE_DEMO_MODE=true`) | Content in this browser only; site and dashboard fully usable |

The active mode is shown in the admin top bar and on the dashboard. **Local mode is
not a production data source** — content lives in `localStorage`. The data layer
implements one interface (`src/services/types.ts`) with two adapters, so every
screen is identical in both modes.

Local preview sign-in (only when Supabase is unconfigured):

```
admin@mawulidiagnostics.com
Diagnostics2026!
```

---

## 4. Environment variables

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
VITE_SITE_URL=https://mawuli-diagnostics.vercel.app
```

- Only the **anon** key belongs in the browser. RLS enforces authorisation.
- **Never** add `SUPABASE_SERVICE_ROLE_KEY` to any `VITE_` variable: everything with
  that prefix is compiled into the public bundle and the service key bypasses RLS.
- `VITE_SITE_URL` controls canonical URLs, Open Graph URLs, the `Sitemap:` line in
  `robots.txt` and every URL in `sitemap.xml` — all generated at build time. No trailing
  slash.

---

## 5. Supabase setup

1. Create a project at [supabase.com](https://supabase.com) (choose the region closest
   to Ghana — `eu-west` or `eu-central` give the best latency).
2. **SQL Editor → New query** → run, in order:
   - `supabase/migrations/0001_init.sql` — tables, indexes, constraints, triggers,
     public view, storage buckets
   - `supabase/migrations/0002_rls_policies.sql` — Row Level Security policies
   - `supabase/seed.sql` — profile statement, site settings, skill catalogue
     (contains **no** invented projects, certificates, videos or social URLs)
3. **Storage** — the migration creates and configures six public buckets:
   `gallery`, `projects`, `certificates`, `profile`, `videos`, `cv`
   (8 MB limit each, image MIME types restricted; `cv` and `certificates` also allow PDF).
4. **Settings → API** — copy the Project URL and `anon public` key into `.env`.
5. **Authentication → Providers → Email** — keep enabled, and **disable public
   sign-ups** (*Authentication → Sign In / Providers → "Allow new users to sign up" → off*)
   so nobody can create an account.

Verify RLS is on:

```sql
select relname, relrowsecurity
from pg_class
where relnamespace = 'public'::regnamespace and relkind = 'r'
order by relname;
```

Every row should show `relrowsecurity = true`.

---

## 6. Creating the administrator

There is **no public administrator registration**. Two steps:

1. **Create the user** — Supabase Dashboard → *Authentication → Users → Add user*.
   Set the email and a strong password (12+ characters), and mark the email confirmed.
2. **Authorise the user** — run this once in the SQL editor, replacing the email:

```sql
insert into public.admin_users (user_id, email, display_name)
select id, email, 'Medekuku Mawuli Kofi'
from auth.users
where email = 'you@example.com'
on conflict (user_id) do nothing;
```

That row is what makes the account an administrator. Authenticating alone grants
nothing: every write policy calls `public.is_admin()`, which checks this table.

Password reset is handled by Supabase Auth — `/admin` → *Forgot password?* sends a
recovery link that lands on `/admin/reset-password`.

---

## 7. Data model

| Table | Purpose | Notes |
|---|---|---|
| `profiles` | Singleton public identity | Unique index enforces one row |
| `projects` | Documented vehicle work | JSONB `tools_used`, `measurements`, `gallery` |
| `diagnostic_cases` | Technical reports | JSONB `dtc_codes`, `diagnostic_procedure`, `verification`, `media` |
| `youtube_videos` | Video portfolio | 11-char ID constraint, unique index |
| `gallery_images` | Workshop photography | Alt text required by constraint |
| `skills` | Capability matrix | `skill_level ∈ (practical, developing, interest)` — no percentages |
| `certificates` | Training records | Own slug for detail pages |
| `contact_messages` | Private enquiries | Insert-only for visitors |
| `social_links` | Public profile links | One row per platform |
| `site_settings` | Key/value content | SEO, contact copy, footer |
| `admin_users` | Administrator whitelist | Consulted by every write policy |

Details worth knowing:

- All primary keys are UUIDs (`gen_random_uuid()`).
- Every content table carries `created_at` / `updated_at`, maintained by the
  `set_updated_at()` trigger.
- Statuses are constrained to `draft` / `published`; slugs must match
  `^[a-z0-9]+(-[a-z0-9]+)*$`.
- `published_at` records first publication and drives sitemap `lastmod`.
- `diagnostic_cases.vehicle_identification` (VIN/plate) is **never** rendered publicly;
  `public.public_diagnostic_cases` is a view that omits the column entirely.

---

## 8. Security model

- **RLS on every table**, default-deny.
- Visitors (`anon`) can: `select` published projects / cases / videos, and all rows of
  gallery, skills, certificates, social links, settings and profile; `insert` a contact
  message with validated field lengths and a forced `status = 'new'`.
- Visitors **cannot**: read drafts, read any contact message, or write to any content table.
- Authenticated users who are not in `admin_users` have exactly the same read rights as
  visitors plus nothing else.
- Administrators (`is_admin()`) get full CRUD on content and full access to messages.
- Storage writes require `is_admin()`; reads are public for the six content buckets.
- The client bundle contains only the anon key. `scripts/test-routes.mjs` scans the built
  assets for service-role references and fails the build check if any appear.
- The `/admin` route guard is UX only — RLS is the actual boundary, so bypassing the
  client guard cannot mutate data.
- Uploads are validated (MIME type, size), compressed in-browser (max 1800 px, WebP) and
  given descriptive, SEO-friendly filenames.

---

## 9. Content management

Sign in at `/admin`:

| Section | Capabilities |
|---|---|
| Dashboard | Counts, recent messages, data-source status, quick actions |
| Profile Management | Name, headline, biography, hero introduction, portrait, email, phone, career goals, interests |
| About Me | Timeline entries (education / workshop / training / project / achievement), career goals, interests |
| Automotive Projects | Full CRUD, all 10 categories, measurements table, tools, gallery, video link, draft/publish, feature |
| Diagnostic Cases | Full CRUD, DTC table, procedure steps, measurements, verification, media, private VIN field |
| YouTube Videos | Paste a URL → ID extracted automatically, thumbnail preview, category, vehicle, feature |
| Workshop Gallery | Upload with compression, required alt text, categories, ordering, feature |
| Automotive Skills | Name, category, honest level, order |
| Certificates | Title, institution, date, image, verification URL, own detail page |
| CV Management | Upload/replace/remove the PDF, page heading |
| Contact Messages | Read, reply by email, mark read, archive, delete |
| SEO Settings | Meta title/description with live character counts and a Google-style preview, keywords, OG image |
| Social Links | YouTube, LinkedIn, WhatsApp, Facebook, X, email, phone — only added platforms render |
| Website Settings | Site name, tagline, contact copy, form availability, footer note |

Every button performs a real operation. Destructive actions require confirmation.
Saved changes appear on the public site immediately — no redeploy.

---

## 10. SEO and prerendering

**At build time** (`scripts/prerender.mjs`) every public route is rendered with
`react-dom/server` streaming + `StaticRouter`, then written as static HTML with its own
`<title>`, description, canonical, Open Graph and Twitter tags. Crawlers and link
previews therefore receive complete content without executing JavaScript. The client
then hydrates the same markup.

- Unique titles and descriptions per page; canonical URLs built from `VITE_SITE_URL`.
- JSON-LD: `Person` (name, job title, Accra/Ghana address, YouTube + LinkedIn `sameAs`
  from configured links), `WebSite`, `BreadcrumbList`, `TechArticle` (projects and case
  studies), `VideoObject` (videos), `EducationalOccupationalCredential` (certificates),
  `ContactPage`, `CollectionPage`, `ImageGallery`.
- Semantic HTML with a single `<h1>` per page, `<nav aria-label>`, visible breadcrumbs,
  skip link, table `<caption>`s.
- `robots.txt` allows public content and disallows `/admin`; `sitemap.xml` is regenerated
  at build time and includes published detail pages when Supabase credentials are present.
- Descriptive alt text is mandatory for gallery uploads; images are lazy-loaded and
  compressed.
- A styled 404 page is rendered for unknown routes.

> Detail routes (`/projects/:slug` and similar) cannot be enumerated at build time without
> database access. They use the SPA fallback with client-rendered metadata; their URLs are
> included in the sitemap whenever Supabase credentials are available during the build.
> To prerender them statically as well, set the Supabase variables in the Vercel build
> environment and extend `ROUTES` in `scripts/prerender.mjs` with a query.

---

## 11. Testing

```bash
npm test             # Vitest: unit + full application flows (36 tests)
npm run typecheck    # TypeScript, strict, zero errors
npm run build        # typecheck + client build + prerender + sitemap
npm run preview      # serve dist/ with Vercel-compatible routing on :4180
npm run test:routes  # 102 server checks against the built site
npm run test:sql     # 86 schema, constraint and RLS checks (real PostgreSQL)
```

**Unit** — YouTube URL parsing (watch / youtu.be / shorts / embed / live / invalid),
slug generation, vehicle labels, Zod contact and project validation, private-data
projection.

**Application flows** (rendered against the real `App`): homepage identity and all five
hero actions, professional empty states, every public route, 404 and not-found states,
contact validation plus successful submission, admin redirect for anonymous users,
rejected and accepted sign-in, the 14 dashboard sections, and full CRUD — create →
publish → edit → delete a project, video-ID extraction, non-YouTube rejection,
a diagnostic case study end-to-end including asserting the **private VIN never appears
in public HTML**, profile updates reaching the homepage, and contact messages being
readable by the administrator only.

and `npm run test:sql` — 86 checks against real PostgreSQL.

**Server** — every public route returns 200 with route-specific title, canonical,
description, OG tags and a rendered `<h1>`; `robots.txt` disallows `/admin`;
`sitemap.xml` is valid and excludes admin paths; `/admin` is served as an SPA shell; the
bundle contains no service-role reference.

Test results for the delivered version are recorded in `TESTING.md`.

---

## 12. Deployment

Detailed walkthrough: **[DEPLOYMENT.md](./DEPLOYMENT.md)**. Short version:

```bash
npm install
npm run build
# Vercel: import the repo, add the three VITE_ variables, deploy
```

`vercel.json` sets the build command, security headers, immutable asset caching and the
SPA rewrites that keep React Router working on direct navigation.

---

## 13. Project structure

```
├── index.html                  # static head, Person JSON-LD, noscript fallback
├── public/
│   ├── robots.txt
│   ├── sitemap.xml             # regenerated by npm run build
│   ├── site.webmanifest
│   ├── icons/                  # original brand marks
│   └── images/
├── scripts/
│   ├── prerender.mjs           # SSR → static HTML per route
│   ├── generate-sitemap.mjs    # static + published dynamic routes
│   ├── serve-dist.mjs          # Vercel-compatible static server
│   └── test-routes.mjs         # production smoke/SEO/security checks
├── supabase/
│   ├── migrations/0001_init.sql
│   ├── migrations/0002_rls_policies.sql
│   └── seed.sql
└── src/
    ├── components/
    │   ├── admin/              # Drawer, DataTable, form controls, RequireAdmin
    │   ├── automotive-projects/
    │   ├── brand/              # logo, technical backdrops
    │   ├── diagnostics/        # DiagnosticReport (technical layout)
    │   ├── hero/
    │   ├── layout/             # header, footer, public layout
    │   ├── seo/                # head manager + JSON-LD builders
    │   ├── skills/
    │   ├── ui/
    │   └── youtube/
    ├── hooks/                  # useAsyncData, useSiteData, useAuth, useToast, useCollectionManager
    ├── lib/                    # config, utils, validation, defaults, image, supabase client
    ├── pages/                  # one file per route (+ pages/admin/*)
    ├── services/               # repository interface, Supabase + local adapters, auth, storage
    ├── styles/index.css        # design tokens and component classes
    ├── test/                   # Vitest setup + suites
    ├── types/
    ├── App.tsx
    ├── main.tsx
    └── entry-server.tsx        # build-time SSR entry
```

---

## 14. Content honesty policy

The application is built so that unverified claims are awkward to make and easy to label:

- The seed contains the supplied identity, site settings and a skill catalogue only — no
  projects, repairs, DTCs, measurements, certificates, employers, videos or social URLs.
- Empty states read *"Add Your First Automotive Project"*, *"Upload Your Workshop
  Photograph"*, *"Add Your First Diagnostic Case Study"*, *"Add Your YouTube Video"*,
  *"Upload Your Certificate"*, *"Upload Your CV"* — the site still looks deliberate.
- Skills carry a level (`practical`, `developing`, `interest`), never a percentage.
- Measurements must be marked within specification, out of specification, or **unverified**.
- An empty *Confirmed fault* renders as *"Root cause not yet confirmed — recorded honestly
  rather than assumed."*
- Verification checks can be marked pending, so an unfinished job cannot look finished.
- Missing portraits and photographs show labelled technical placeholders — never stock
  imagery presented as workshop evidence.
- Vehicle identification is stored privately and excluded from public reports and views.

---

© Medekuku Mawuli Kofi — Mawuli Engineering & Diagnostic Services, Accra, Ghana.
