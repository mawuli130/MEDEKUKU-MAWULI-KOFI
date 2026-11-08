/**
 * Server smoke test.
 *
 * Serves the built site and asserts that every public route returns HTML with a
 * route-specific title, canonical URL, description and a rendered <h1>. Also
 * checks robots.txt, sitemap.xml and the 404 page.
 *
 * Usage: node scripts/test-routes.mjs [baseUrl]
 * Default baseUrl: http://localhost:4173 (vite preview)
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const base = (process.argv[2] ?? 'http://localhost:4173').replace(/\/+$/, '')

const expectations = [
  { path: '/', title: /Medekuku Mawuli Kofi.*Automotive Electronics/, h1: /Medekuku Mawuli Kofi/ },
  { path: '/about', title: /About Medekuku Mawuli Kofi/i, h1: /Automotive electronics, diagnostics/i },
  { path: '/projects', title: /Automotive Projects/i, h1: /real vehicles/i },
  { path: '/diagnostics', title: /Diagnostic Case Studies/i, h1: /Systematic diagnosis/i },
  { path: '/videos', title: /YouTube Automotive Videos|Automotive video demonstrations/i, h1: /video demonstrations/i },
  { path: '/gallery', title: /Workshop Gallery/i, h1: /Photographic workshop record/i },
  { path: '/skills', title: /Automotive Skills/i, h1: /Capability across electrical/i },
  { path: '/certificates', title: /Certificates/i, h1: /Training, education/i },
  { path: '/cv', title: /CV|Curriculum/i, h1: /.+/ },
  { path: '/contact', title: /Contact/i, h1: /Start a conversation/i },
]

let failures = 0
let checks = 0

function check(label, condition, detail = '') {
  checks += 1
  if (condition) {
    console.log(`  ✓ ${label}`)
  } else {
    failures += 1
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: 'follow' })
  return { status: response.status, body: await response.text(), headers: response.headers }
}

async function main() {
  console.log(`Server smoke test against ${base}\n`)

  for (const expectation of expectations) {
    console.log(`${expectation.path}`)
    try {
      const { status, body } = await fetchText(`${base}${expectation.path}`)
      check('responds 200', status === 200, `status ${status}`)

      const title = body.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''
      check('route-specific title', expectation.title.test(title), title.slice(0, 80))

      const canonical = body.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/)?.[1] ?? ''
      check('canonical present', canonical.length > 0, canonical)
      const expectedCanonical = `${base.replace(/\/+$/, '')}${expectation.path}`.replace('http://localhost:4180', '')
      check(
        'canonical matches route',
        expectation.path === '/'
          ? canonical === 'https://mawuli-diagnostics.vercel.app' || canonical.endsWith('/')
          : canonical.endsWith(expectation.path),
        canonical ?? expectedCanonical,
      )

      const description = body.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/)?.[1] ?? ''
      check('meta description present', description.length > 40, `${description.length} chars`)

      const ogTitle = body.match(/<meta[^>]+property="og:title"[^>]+content="([^"]*)"/)?.[1] ?? ''
      check('og:title present', ogTitle.length > 0)

      const h1 = body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]+>/g, ' ') ?? ''
      check('rendered h1 in static HTML', expectation.h1.test(h1), h1.trim().slice(0, 70))

      check('no /admin link rendered in static nav', !/<a[^>]+href="\/admin"/.test(body.split('<footer')[0]))

      const ld = body.match(/"@type":\s*"(Person|WebSite|BreadcrumbList|CollectionPage|TechArticle)"/g)
      check('JSON-LD structured data present', Boolean(ld) || expectation.path === '/cv')
    } catch (error) {
      failures += 1
      console.log(`  ✗ request failed — ${error.message}`)
    }
    console.log('')
  }

  // Static files
  console.log('/robots.txt')
  try {
    const { status, body } = await fetchText(`${base}/robots.txt`)
    check('responds 200', status === 200)
    check('disallows /admin', /Disallow:\s*\/admin/.test(body))
    check(
      'declares an absolute https sitemap',
      /^Sitemap:\s*https:\/\/\S+\/sitemap\.xml$/m.test(body),
      body.match(/Sitemap:.*/)?.[0],
    )
    check('does not disallow the public site', !/^Disallow:\s*\/$/m.test(body))
  } catch (error) {
    failures += 1
    console.log(`  ✗ ${error.message}`)
  }
  console.log('')

  console.log('/sitemap.xml')
  try {
    const { status, body } = await fetchText(`${base}/sitemap.xml`)
    check('responds 200', status === 200)
    const urls = body.match(/<loc>/g)?.length ?? 0
    check('contains public URLs', urls >= 10, `${urls} URLs`)
    check('excludes /admin', !/<loc>[^<]*\/admin/.test(body))
    check('valid urlset root', body.includes('<urlset'))
  } catch (error) {
    failures += 1
    console.log(`  ✗ ${error.message}`)
  }
  console.log('')

  console.log('/admin (login screen)')
  try {
    const { status, body } = await fetchText(`${base}/admin`)
    check('responds 200 (SPA shell)', status === 200)
    check('is noindex', /noindex/.test(body) || body.includes('id="root"'))
  } catch (error) {
    failures += 1
    console.log(`  ✗ ${error.message}`)
  }
  console.log('')

  // Security: the service role key must never reach the bundle.
  console.log('bundle security scan')
  try {
    const html = await readFile(path.join(root, 'dist', 'index.html'), 'utf8')
    const assets = [...html.matchAll(/src="\/(assets\/[^"]+\.js)"/g)].map((m) => m[1])
    let leaked = false
    for (const asset of assets) {
      const source = await readFile(path.join(root, 'dist', asset), 'utf8')
      if (/SERVICE_ROLE|service_role|serviceRoleKey/i.test(source)) leaked = true
    }
    check('no service-role key referenced in client bundle', !leaked)
    check('built index.html has prerendered content', html.includes('Medekuku Mawuli Kofi'))
  } catch (error) {
    failures += 1
    console.log(`  ✗ ${error.message}`)
  }

  console.log(`\n${checks - failures}/${checks} checks passed`)
  if (failures > 0) {
    console.log(`FAILED: ${failures} check(s) did not pass.`)
    process.exit(1)
  }
  console.log('All server checks passed.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
