# Testing record

Everything below was **actually executed** in the development environment for this
build. Commands are reproducible.

| Suite | Command | Result |
|---|---|---|
| TypeScript (strict, project references) | `npm run typecheck` | **0 errors** |
| Unit + application flows | `npm test` | **36 / 36 passed** (2 files) |
| Production build | `npm run build` | **success** — 10/10 routes prerendered, sitemap written |
| Production server, SEO & bundle checks | `npm run test:routes` | **102 / 102 passed** |
| Database schema, constraints, RLS | `npm run test:sql` | **86 / 86 passed** (real PostgreSQL 18 via PGlite) |

Environment: Node.js 22.22, npm 10.9, Vite 8.3, Chromium-based browser automation was
**not available** in the sandbox (the Playwright browser download is blocked), so UI
verification uses jsdom + Testing Library against the real application tree, plus a
real HTTP server test of the built output.

---

## 1. Unit tests — `src/test/utils.test.ts` (17 tests)

**YouTube URL parsing** (`extractYoutubeId`)
- `youtube.com/watch?v=ID`, with `&t=` and `m.youtube.com` variants
- `youtu.be/ID`, with query string
- `/shorts/ID`, `/embed/ID`, `/live/ID`
- bare 11-character ID, URL without protocol
- rejects Vimeo, too-short IDs, empty string, non-URL text
- embed URL is `youtube-nocookie.com`, includes `autoplay=0` and `rel=0`

**Slug generation** — punctuation/emoji stripped, accents transliterated, no leading or
trailing hyphens.

**Vehicle labels** — joins only present fields; empty object yields an empty string.

**Private-data projection** — `toPublicCase()` nulls `vehicle_identification`.

**Contact validation** — accepts a complete submission; rejects bad email, short message
and missing consent (each field reports its own message); rejects a filled honeypot.

**Project validation** — coerces `"2015"` → `2015`, rejects `1492`, defaults
`status: 'draft'` and `featured: false`.

> Two genuine bugs were found and fixed by these tests:
> 1. `projectSchema` rejected a missing `vehicle_year` instead of treating it as empty —
>    replaced with a `z.preprocess` year validator.
> 2. The admin video form could save a `youtube_video_id` that no longer matched
>    `youtube_url`. The payload now always re-derives the ID, and the form shows an
>    explicit error for unrecognisable URLs.

---

## 2. Application flow tests — `src/test/app.test.tsx` (19 tests)

Rendered with `MemoryRouter` + the production `App` (real providers, router, repository
adapter, validation, admin screens).

### Public site
1. Homepage renders the `h1` "Medekuku Mawuli Kofi", the professional headline, the brand
   name, and all five required hero actions with correct `href`s (Explore automotive
   projects, View diagnostic case studies, Watch my YouTube videos, Contact me, Download
   my CV).
2. Empty states appear with the specified copy: *Add Your First Automotive Project*,
   *Add Your First Diagnostic Case Study*, *Add Your YouTube Video*, *Upload Your Workshop
   Photograph*, *Upload Your Certificate*.
3. About page renders the professional profile and automotive interests; skills page
   renders the catalogue including "OBD-II diagnostics" and honest level labels; CV page
   renders.
4. **All ten public routes** render without crashing, each with an `h1` and the primary
   `nav[aria-label="Primary"]`.
5. Unknown route renders the 404 page ("This circuit is open", "Error 404").
6. Unknown project slug renders the project-not-found state.

### Contact form
7. Submitting empty shows per-field validation messages and stores nothing.
8. A valid submission confirms success and stores exactly one message with
   `status: 'new'`.

### Admin authentication
9. An anonymous visit to `/admin/dashboard` is redirected to the sign-in screen.
10. Incorrect credentials are rejected with "Email or password is incorrect."
11. Successful sign-in shows the dashboard, and the sidebar contains all 14 sections:
    Dashboard, Automotive Projects, Diagnostic Cases, YouTube Videos, Workshop Gallery,
    Certificates, Automotive Skills, Profile Management, About Me, CV Management, Contact
    Messages, SEO Settings, Social Links, Website Settings.

### Admin CRUD
12. **Project lifecycle** — empty state shown → create (title, description, vehicle make/
    model/year) → slug auto-generated (`abs-warning-light-wheel-speed-signal`), status
    `draft`, year stored as a number → edit to `published` (sets `published_at`) →
    **appears on the public `/projects` page** → delete with confirmation → removed from
    storage.
13. **Validation blocks saving** — an empty project form shows "A project title is
    required" and writes nothing.
14. **YouTube create** — pasting `https://www.youtube.com/watch?v=dQw4w9WgXcQ` extracts
    and displays the ID; the stored record has `youtube_video_id = 'dQw4w9WgXcQ'` and
    `status: 'published'`.
15. **Non-YouTube URL rejected** — a Vimeo link produces an explicit error and stores
    nothing.
16. **Diagnostic case study end-to-end** — create with title, system, complaint, a DTC
    (`P0335`), a verification check, a **private VIN**, published → the public report
    renders the `h1`, the DTC, the verification entry, and the headings *Customer
    complaint*, *Diagnostic procedure*, *Verification* — and the assertion
    `expect(container.textContent).not.toContain('VIN-SHOULD-NOT-BE-PUBLIC')` passes.
17. **Profile update propagates** — changing the headline in the admin and saving is
    reflected on the public homepage.
18. **Messages readable by admin** — a submitted enquiry appears in `/admin/messages`
    (list and reading pane) with sender and email.
19. **Messages never public** — after submitting a message, none of `/`, `/about`,
    `/contact` or `/projects` contains the subject or the sender's email address.

---

## 3. Production server, SEO and bundle checks — `scripts/test-routes.mjs` (102 checks)

Against `dist/` served with Vercel-compatible routing (`npm run preview`).

For **each of the ten public routes**:
- responds `200`
- route-specific `<title>` (not the generic homepage title)
- `<link rel="canonical">` present and matching the route
- `<meta name="description">` present, > 40 characters
- `og:title` present
- a rendered `<h1>` **in the static HTML** (proving prerendering, not an empty SPA shell)
- no `/admin` link in the public header markup
- JSON-LD structured data present

Plus:
- `/robots.txt` → 200, disallows `/admin`, declares an absolute `https` sitemap URL, and
  does not disallow the site itself
- `/sitemap.xml` → 200, valid `<urlset>`, ≥ 10 URLs, excludes `/admin`
- `/admin` → 200 SPA shell, `noindex` header
- **bundle security scan** — no built asset contains `service_role` references
- prerendered `index.html` contains the owner's name

Prerender verification (direct file inspection):

| Route | Emitted `<title>` | Emitted `<h1>` |
|---|---|---|
| `/` | Medekuku Mawuli Kofi — Automotive Electronics & Diagnostic Technician | Medekuku Mawuli Kofi … |
| `/about` | About Medekuku Mawuli Kofi — Automotive Diagnostics Technician | Automotive electronics, diagnostics and workshop practice |
| `/projects` | Automotive Projects — Vehicle Diagnostics & Electrical Repairs … | Projects performed on real vehicles |
| `/diagnostics` | Diagnostic Case Studies — Vehicle Fault Diagnosis … | Systematic diagnosis, documented step by step |
| `/skills` | Automotive Skills — Electrical, ECU & Diagnostic Capability … | Capability across electrical, electronic and mechanical systems |
| `/contact` | Contact — Medekuku Mawuli Kofi, Automotive Diagnostic Technician (Accra) | Start a conversation |

Canonicals resolve correctly, e.g. `https://mawuli-diagnostics.vercel.app/about`.

---

## 4. Database verification — `scripts/test-sql.mjs` (86 checks)

Migrations and seed executed **unmodified** against PostgreSQL 18 (PGlite, WASM), with
`auth.users`, `auth.uid()`, `storage.*`, the `anon`/`authenticated` roles and Supabase's
table grants stubbed to their real signatures.

**Structure** — all 11 tables exist; RLS enabled on every one; the public view exists.

**Constraints (each proven to reject bad input)**
- `projects.status` limited to draft/published
- `projects.slug` must match `^[a-z0-9]+(-[a-z0-9]+)*$` and be unique
- `projects.vehicle_year` must be 1900–2100
- `youtube_videos.youtube_video_id` must be exactly 11 characters
- `gallery_images.alt_text` must be at least 12 characters (raised from 5 after this test
  caught that "too short" was accepted)
- `skills.skill_level` limited to practical/developing/interest — a fake `expert` level is
  rejected
- `contact_messages` message length bounded
- `social_links.platform` limited to the supported platforms — `github` rejected
- `profiles` singleton index rejects a second row
- `diagnostic_cases.status` limited to draft/published

**Seed integrity**
- 27 skills, 13 settings, one profile row with the correct name, headline and location
- **zero** projects, diagnostic cases, videos, certificates and social links
- **zero** administrator rows

**Triggers, view, storage**
- `updated_at` advances on update
- `public_diagnostic_cases` has **no** `vehicle_identification` column and returns
  published rows only
- six buckets exist, all public-read, `cv` present

**Indexes** — 11 required indexes confirmed, including `projects_category_idx`,
`diagnostic_dtc_idx` (GIN), `youtube_video_id_unique`, `profiles_singleton`.

**Policy coverage** — every table has policies; `contact_messages` has an insert-only
public policy and no public read policy; storage has ≥ 4 policies.

**Authorisation helper** — `is_admin()` is false with no JWT subject, true for a
whitelisted user, false for another authenticated user.

**RLS enforcement (role simulation)**
- anon sees only published projects; cannot read drafts, contact messages, or published
  cases marked draft
- anon **cannot** insert/update/delete projects, write settings, write the profile or delete
  skills — every write raises a permission or RLS error
- anon **can** submit a valid contact message, but **cannot** pre-set its status to `read`
- an authenticated non-admin gets nothing extra: no messages, no project inserts, no drafts
- the administrator can read messages and create/update/delete projects

---

## 5. Accessibility and design audits

**Colour contrast** — every text token was measured against every dark surface it is used
on, with the WCAG AA target of 4.5:1 for normal text:

| Token | Worst case (on `ink-700`) | Verdict |
|---|---|---|
| `silver-600` (**after fix**) | 4.59:1 | passes |
| `silver-600` (*before fix*, `#66737f`) | 3.68:1 | **failed — corrected** |
| `silver-500` | 4.76:1 | passes |
| `silver-400` | 6.71:1 | passes |
| `signal-300` / `signal-400` / `signal-500` | 13.03 / 11.13 / 8.61:1 | passes |
| `ok-400`, `warn-400` | 10.24, 10.19:1 | passes |
| `ink-950` on the cyan primary button | 12.07:1 | passes |
| white on `electric-600` | 6.30:1 | passes |

`--color-silver-600` was darkened from `#66737f` to `#828f9d`; the old value failed AA for
the micro-labels that use it throughout the site.

**Type size** — 8 px and 9 px label sizes (`text-[0.5rem]`, `text-[0.5625rem]`,
`text-[0.5938rem]`) were consolidated to 10 px (`text-[0.625rem]`). No text smaller than
10 px ships. All monotone technical labels remain uppercase with wide tracking.

**Landmarks and semantics** — one `<h1>` per page (verified through the prerendered HTML),
`nav[aria-label="Primary"]` and `nav[aria-label="Administrator sections"]`,
`main`, footers as `<footer>`, a skip link, breadcrumbs as `<nav aria-label="Breadcrumb">`.

**Dialogs** — the gallery lightbox, the diagnostic media viewer and every confirmation
dialog are `role="dialog"` with `aria-modal`, an accessible name, focus moved inside on
open, and `Escape` to close. The gallery viewer also supports `←`/`→`, and body scrolling
is locked while it is open.

**Checks performed on the built CSS** — every custom token class used in the source
(`bg-ink-*`, `text-silver-*`, `text-signal-*`, `border-line`, `.panel`, `.btn-primary`,
`.container-page`, `.grid-overlay`, `.blueprint-glow`, `shadow-lift`) was confirmed present
in the compiled stylesheet, so no class name silently resolved to nothing.

---

## 6. Build quality

- Strict TypeScript with `noUnusedLocals`, `noUnusedParameters`, `noImplicitAny` and
  `verbatimModuleSyntax` — clean.
- Route-level code splitting: the initial payload is react + router + icons + shared UI;
  every page (and every admin screen) is a separate chunk.
- Manual vendor chunks (`react`, `router`, `icons`, `supabase`, `zod`) for cache stability.
- Prerendered HTML for all ten public routes.
- Sitemap regenerates on every build and includes published detail pages when Supabase
  credentials are available at build time.
- No service-role reference in any shipped asset.

---

## 7. Fixes made as a direct result of testing

| Issue found | Fix |
|---|---|
| `vehicle_year` rejected empty input | Dedicated `yearField()` preprocessor with range refinement |
| Video could be saved with a stale video ID | ID always re-derived from the URL on save; explicit URL error in the form |
| Sidebar `<aside>` carried the nav label, hiding it from assistive tech | Label moved onto `<nav>` |
| Confirmation dialogs had no accessible name/description | `aria-labelledby` + `aria-describedby` wired to real elements |
| Admin lists went stale after changes elsewhere | Re-fetch on window focus |
| Invalid `<link rel="canonical">` rendered inside `<body>` on project pages | Removed; the head manager owns canonicals |
| Admin catch-all could leave the dashboard shell | Catch-all now redirects inside the protected layout |
| SEO page refused to save because of unrelated settings fields | Validates only its own fields |
| Gallery alt text accepted 5 characters | Minimum raised to 12 in both SQL and Zod |
| Prerender reused a previously rendered page as its template | Root reset + streaming SSR with `onAllReady` |
| `vite preview` did not serve prerendered directories | `npm run preview` now uses a Vercel-compatible static server |
| Micro-labels used `silver-600` at 3.68:1 — below WCAG AA | Token lightened to `#828f9d` (4.59:1 worst case) |
| Labels rendered at 8–9 px | Consolidated to 10 px minimum |
| `robots.txt` hardcoded a placeholder domain | Generated from `VITE_SITE_URL` at build time |

---

## 8. Not verified in this environment

Stated plainly, because these need live credentials or a GUI browser:

- Live Supabase calls (network, real JWT, real Storage uploads) — the code paths are
  implemented and the schema/RLS were verified independently; calls require the
  environment variables documented in `README.md` §4.
- Real-browser layout screenshots at each breakpoint. Responsive classes compile correctly
  (verified in the built CSS) and were authored mobile-first, but pixel verification on
  physical devices remains a manual step — see `DEPLOYMENT.md` §11 step 7.
- YouTube embeds actually loading (requires network access to youtube-nocookie.com); the
  generated embed URL, ID extraction and `VideoObject` markup are tested.
- Lighthouse scoring.

Run the pre-launch checklist in `DEPLOYMENT.md` §15 once the Supabase project and domain
are live.
