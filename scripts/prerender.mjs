/**
 * Build-time prerendering.
 *
 * 1. Builds the SSR bundle (dist-ssr).
 * 2. Renders every public route to static HTML using the built client assets.
 * 3. Injects route-specific <title>, description, canonical and Open Graph tags
 *    so the static HTML is correct even before the client bundle runs.
 *
 * Dynamic detail routes (projects, case studies, videos, certificates) cannot be
 * enumerated without database credentials, so they are served through the SPA
 * fallback with client-rendered metadata (see vercel.json rewrites). The
 * sitemap script adds any published records it can discover from Supabase when
 * credentials are available at build time.
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createServer } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const ssrDir = path.join(root, 'dist-ssr')

const ROUTES = [
  {
    path: '/',
    title: 'Medekuku Mawuli Kofi — Automotive Electronics & Diagnostic Technician',
    description:
      'Official automotive portfolio of Medekuku Mawuli Kofi, an Automotive Electronics & Diagnostic Technician in Ghana. Explore vehicle diagnostics, ECU systems, electrical repairs, workshop projects, and technical demonstrations.',
  },
  {
    path: '/about',
    title: 'About Medekuku Mawuli Kofi — Automotive Diagnostics Technician',
    description:
      'Professional profile of Medekuku Mawuli Kofi, Automotive Electronics & Diagnostic Technician in Accra, Ghana: technical education, workshop experience, automotive interests and career direction.',
  },
  {
    path: '/projects',
    title: 'Automotive Projects — Vehicle Diagnostics & Electrical Repairs | Medekuku Mawuli Kofi',
    description:
      'Documented automotive projects by Medekuku Mawuli Kofi: vehicle electrical diagnostics, ECU and TCU systems, engine management, sensor testing and workshop repairs in Accra, Ghana.',
  },
  {
    path: '/diagnostics',
    title: 'Diagnostic Case Studies — Vehicle Fault Diagnosis | Medekuku Mawuli Kofi',
    description:
      'Automotive diagnostic case studies by Medekuku Mawuli Kofi: customer complaint, diagnostic trouble codes, live data, electrical measurements, confirmed fault, repair and verification.',
  },
  {
    path: '/videos',
    title: 'YouTube Automotive Videos — Diagnostics & Workshop Demonstrations | Medekuku Mawuli Kofi',
    description:
      'Automotive YouTube videos by Medekuku Mawuli Kofi: vehicle diagnostics, electrical repairs, sensor testing, ECU work and workshop demonstrations from Accra, Ghana.',
  },
  {
    path: '/gallery',
    title: 'Workshop Gallery — Automotive Diagnostics & Repairs | Medekuku Mawuli Kofi',
    description:
      'Genuine workshop photographs: automotive diagnostics, electrical repairs, ECU work, sensor testing, tools and engineering projects from Accra, Ghana.',
  },
  {
    path: '/skills',
    title: 'Automotive Skills — Electrical, ECU & Diagnostic Capability | Medekuku Mawuli Kofi',
    description:
      'Automotive skills of Medekuku Mawuli Kofi: electrical circuit troubleshooting, ECU and engine management systems, OBD-II diagnostics, sensor and actuator testing, and workshop repair procedure.',
  },
  {
    path: '/certificates',
    title: 'Automotive Certificates & Achievements | Medekuku Mawuli Kofi',
    description:
      'Technical education, automotive training, workshop training and engineering project achievements of Medekuku Mawuli Kofi, Automotive Electronics & Diagnostic Technician.',
  },
  {
    path: '/cv',
    title: 'CV — Medekuku Mawuli Kofi, Automotive Electronics & Diagnostic Technician',
    description:
      'Curriculum vitae of Medekuku Mawuli Kofi, Automotive Electronics & Diagnostic Technician in Accra, Ghana: automotive electrical diagnostics, ECU and engine management, workshop experience and certificates.',
  },
  {
    path: '/contact',
    title: 'Contact — Medekuku Mawuli Kofi, Automotive Diagnostic Technician (Accra)',
    description:
      'Contact Medekuku Mawuli Kofi for automotive diagnostic work, workshop roles, technical collaboration or training opportunities in Accra, Ghana.',
  },
]

const SITE_URL = (process.env.VITE_SITE_URL || 'https://mawuli-diagnostics.vercel.app').replace(/\/+$/, '')

function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Strip any markup left by a previous prerender run so repeated builds always
 * start from the pristine shell. index.html is authored with the root div
 * immediately followed by <noscript>, which anchors this reset safely.
 */
function resetRoot(template) {
  return template.replace(/(<div id="root">)[\s\S]*?(<\/div>\s*<noscript>)/, '$1</div>\n    $2')
}

/** Replace the head metadata block of the built index.html for a route. */
function applyHead(template, route) {
  const url = `${SITE_URL}${route.path === '/' ? '' : route.path}`
  let html = template

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(route.title)}</title>`)
  html = html.replace(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="description" content="${escapeHtml(route.description)}" />`,
  )
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[\s\S]*?"\s*\/?>/,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
  )
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta property="og:title" content="${escapeHtml(route.title)}" />`,
  )
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta property="og:description" content="${escapeHtml(route.description)}" />`,
  )
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
  )
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`,
  )
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`,
  )
  return html
}

async function main() {
  if (!existsSync(distDir)) {
    console.error('prerender: dist/ not found — run vite build first.')
    process.exit(1)
  }

  const rawTemplate = await readFile(path.join(distDir, 'index.html'), 'utf8')
  const template = resetRoot(rawTemplate)

  // Build the SSR bundle on demand so `npm run build` is a single command.
  const server = await createServer({
    root,
    logLevel: 'warn',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })

  let render
  try {
    const mod = await server.ssrLoadModule('/src/entry-server.tsx')
    render = mod.render
  } catch (error) {
    await server.close()
    console.error('prerender: could not load the SSR entry.')
    console.error(error)
    process.exit(1)
  }

  let rendered = 0
  for (const route of ROUTES) {
    try {
      const appHtml = await render(route.path)
      let html = applyHead(template, route)
      html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
      const outputPath =
        route.path === '/' ? path.join(distDir, 'index.html') : path.join(distDir, route.path.slice(1), 'index.html')
      await mkdir(path.dirname(outputPath), { recursive: true })
      await writeFile(outputPath, html, 'utf8')
      rendered += 1
      console.log(`prerender ✓ ${route.path}`)
    } catch (error) {
      console.warn(`prerender ✗ ${route.path}: ${error.message}`)
    }
  }

  // Also emit a static 404 shell for unknown routes (served by Vercel).
  const notFoundHtml = applyHead(template, {
    path: '/404',
    title: 'Page not found — Medekuku Mawuli Kofi',
    description: 'The page you requested could not be found. Browse automotive projects, diagnostic case studies and the video portfolio.',
  }).replace('<meta name="robots" content="index, follow, max-image-preview:large" />', '<meta name="robots" content="noindex, nofollow" />')
  await writeFile(path.join(distDir, '404.html'), notFoundHtml, 'utf8')

  await server.close()
  await rm(ssrDir, { recursive: true, force: true }).catch(() => {})

  console.log(`prerender: ${rendered}/${ROUTES.length} public routes rendered to static HTML`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
