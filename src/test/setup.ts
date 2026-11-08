import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { resetAllLocalState } from '@/services/localStore'

// jsdom lacks these browser APIs that the app legitimately uses.
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

if (!window.scrollTo) {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
}
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo
Element.prototype.scrollIntoView = vi.fn()

if (!globalThis.fetch) {
  globalThis.fetch = vi.fn(async () => new Response('', { status: 200 })) as unknown as typeof fetch
}

// Each test starts from a clean local database and no session.
beforeEach(() => {
  resetAllLocalState()
})

afterEach(() => {
  cleanup()
  resetAllLocalState()
})
