import { StrictMode } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { Writable } from 'node:stream'
import { StaticRouter } from 'react-router-dom'
import App from '@/App'

/**
 * Build-time rendering entry.
 *
 * Used by scripts/prerender.mjs to emit fully-populated HTML for public routes so
 * crawlers receive titles, meta tags, headings and body copy without executing
 * JavaScript. Streaming with `onAllReady` lets React resolve lazy route chunks
 * and Suspense boundaries before the HTML is captured — unlike renderToString,
 * which would emit only the loading fallback.
 */
export function render(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let html = ''
    const sink = new Writable({
      write(chunk, _encoding, callback) {
        html += chunk.toString()
        callback()
      },
    })

    const timeout = setTimeout(() => reject(new Error('SSR render timed out')), 15000)

    const { pipe } = renderToPipeableStream(
      <StrictMode>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </StrictMode>,
      {
        onAllReady() {
          clearTimeout(timeout)
          sink.on('finish', () => resolve(html))
          pipe(sink)
        },
        onError(error) {
          // Non-fatal: keep rendering, but surface the message for the build log.
          console.warn(`SSR warning (${url}):`, error instanceof Error ? error.message : error)
        },
      },
    )
  })
}
