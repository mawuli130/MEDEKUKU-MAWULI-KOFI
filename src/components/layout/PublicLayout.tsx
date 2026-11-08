import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { SkeletonCard } from '@/components/ui'

function RouteFallback() {
  return (
    <div className="container-page py-16" aria-busy="true">
      <div className="skeleton mb-4 h-8 w-64" />
      <div className="skeleton mb-10 h-4 w-96 max-w-full" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}

/** Scroll restoration on navigation (respecting hash anchors). */
function ScrollManager() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) {
      const target = document.querySelector(hash)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname, hash])
  return null
}

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-ink-950">
      <ScrollManager />
      <SiteHeader />
      <main id="main" className="flex-1">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  )
}
