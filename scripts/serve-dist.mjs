/**
 * Static server that mirrors Vercel's routing for the built site.
 *
 * Resolution order for a path:
 *   1. exact file in dist/
 *   2. dist/<path>/index.html   (the prerendered route documents)
 *   3. dist/<path>.html
 *   4. dist/index.html          (SPA fallback — /admin and dynamic detail routes)
 *
 * Use this to verify production output locally:
 *   npm run build && node scripts/serve-dist.mjs [port]
 */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const port = Number(process.argv[2] ?? 4180)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.pdf': 'application/pdf',
}

async function isFile(candidate) {
  try {
    const info = await stat(candidate)
    return info.isFile()
  } catch {
    return false
  }
}

async function resolve(pathname) {
  const clean = decodeURIComponent(pathname.split('?')[0]).replace(/\/+$/, '') || '/'
  const relative = clean === '/' ? '' : clean.slice(1)
  const candidates = [
    path.join(root, relative),
    path.join(root, relative, 'index.html'),
    path.join(root, `${relative}.html`),
  ]
  for (const candidate of candidates) {
    if (candidate.startsWith(root) && (await isFile(candidate))) return candidate
  }
  return path.join(root, 'index.html')
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`)
  const file = await resolve(url.pathname)
  try {
    const body = await readFile(file)
    const extension = path.extname(file).toLowerCase()
    const isMissingAdminAsset = url.pathname.startsWith('/admin') && file.endsWith('index.html')
    response.writeHead(200, {
      'content-type': MIME[extension] ?? 'application/octet-stream',
      'cache-control': extension === '.html' ? 'public, max-age=0, must-revalidate' : 'public, max-age=31536000',
      ...(isMissingAdminAsset ? { 'x-robots-tag': 'noindex' } : {}),
    })
    response.end(body)
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain' })
    response.end('Not found')
  }
})

server.listen(port, '0.0.0.0', () => {
  console.log(`dist server (Vercel-compatible routing) on http://localhost:${port}`)
})
