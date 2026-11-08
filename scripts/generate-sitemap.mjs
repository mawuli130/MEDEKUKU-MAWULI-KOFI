/**
 * Sitemap generator.
 *
 * Always includes the static public routes and excludes admin/private paths.
 * When Supabase credentials are available at build time, published projects,
 * diagnostic case studies, videos and certificates are appended so detail pages
 * are discoverable. Without credentials the static routes are still valid.
 */
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SITE_URL = (process.env.VITE_SITE_URL || 'https://mawuli-diagnostics.vercel.app').replace(/\/+$/, '')

const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/projects', priority: '0.9', changefreq: 'weekly' },
  { path: '/diagnostics', priority: '0.9', changefreq: 'weekly' },
  { path: '/videos', priority: '0.8', changefreq: 'weekly' },
  { path: '/gallery', priority: '0.7', changefreq: 'weekly' },
  { path: '/skills', priority: '0.7', changefreq: 'monthly' },
  { path: '/certificates', priority: '0.7', changefreq: 'monthly' },
  { path: '/cv', priority: '0.8', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'yearly' },
]

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function fetchDynamicRoutes() {
  const url = process.env.VITE_SUPABASE_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.log('sitemap: no Supabase credentials at build time — emitting static routes only.')
    return []
  }

  const entries = []
  const headers = { apikey: key, Authorization: `Bearer ${key}` }

  async function query(table, select) {
    try {
      const response = await fetch(`${url}/rest/v1/${table}?select=${select}&status=eq.published`, { headers })
      if (!response.ok) {
        console.warn(`sitemap: ${table} returned ${response.status}`)
        return []
      }
      return await response.json()
    } catch (error) {
      console.warn(`sitemap: could not read ${table} (${error.message})`)
      return []
    }
  }

  for (const row of await query('projects', 'slug,updated_at')) {
    if (row.slug) {
      entries.push({ path: `/projects/${row.slug}`, lastmod: row.updated_at, priority: '0.8', changefreq: 'monthly' })
    }
  }
  for (const row of await query('diagnostic_cases', 'slug,updated_at')) {
    if (row.slug) {
      entries.push({ path: `/diagnostics/${row.slug}`, lastmod: row.updated_at, priority: '0.8', changefreq: 'monthly' })
    }
  }
  for (const row of await query('youtube_videos', 'youtube_video_id,updated_at')) {
    if (row.youtube_video_id) {
      entries.push({
        path: `/videos/${row.youtube_video_id}`,
        lastmod: row.updated_at,
        priority: '0.7',
        changefreq: 'monthly',
      })
    }
  }
  for (const row of await query('certificates', 'slug,updated_at')) {
    if (row.slug) {
      entries.push({ path: `/certificates/${row.slug}`, lastmod: row.updated_at, priority: '0.6', changefreq: 'yearly' })
    }
  }

  console.log(`sitemap: added ${entries.length} published detail routes from Supabase.`)
  return entries
}

async function main() {
  const today = new Date().toISOString().slice(0, 10)
  const dynamic = await fetchDynamicRoutes()
  const all = [...STATIC_ROUTES, ...dynamic]

  const body = all
    .map((route) => {
      const loc = `${SITE_URL}${route.path === '/' ? '/' : route.path}`
      return [
        '  <url>',
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <lastmod>${route.lastmod ? String(route.lastmod).slice(0, 10) : today}</lastmod>`,
        `    <changefreq>${route.changefreq}</changefreq>`,
        `    <priority>${route.priority}</priority>`,
        '  </url>',
      ].join('\n')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`

  await writeFile(path.join(root, 'public', 'sitemap.xml'), xml, 'utf8')
  console.log(`sitemap: wrote ${all.length} URLs to public/sitemap.xml`)

  // Keep dist in sync during builds.
  try {
    await writeFile(path.join(root, 'dist', 'sitemap.xml'), xml, 'utf8')
    console.log('sitemap: copied to dist/sitemap.xml')
  } catch {
    // dist may not exist when running the script standalone.
  }

  // robots.txt must declare the sitemap on whatever domain is deployed, so it is
  // generated from VITE_SITE_URL rather than committed with a placeholder.
  const robots = `# Mawuli Engineering & Diagnostic Services — robots.txt
# Public portfolio content may be indexed. Private administration paths may not.

User-agent: *
Allow: /

# Administration and authentication routes
Disallow: /admin
Disallow: /admin/
Disallow: /admin/reset-password

# Private data is protected by Supabase Row Level Security, not by this file.
Disallow: /api/

# Crawler noise from shared links
Disallow: /*?utm_
Disallow: /*?replytocom=

Sitemap: ${SITE_URL}/sitemap.xml
`
  await writeFile(path.join(root, 'public', 'robots.txt'), robots, 'utf8')
  console.log(`robots.txt: sitemap declared at ${SITE_URL}/sitemap.xml`)
  try {
    await writeFile(path.join(root, 'dist', 'robots.txt'), robots, 'utf8')
  } catch {
    // dist may not exist when running the script standalone.
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
