import { useEffect, useMemo, useState } from 'react'
import { Camera, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
import { Seo, breadcrumbJsonLd } from '@/components/seo/Seo'
import { EmptyState, PageHeader, Section, SkeletonGrid, Tag } from '@/components/ui'
import { MediaImage } from '@/components/ui/MediaImage'
import { useAsyncData } from '@/hooks/useAsyncData'
import { getRepository } from '@/services'
import { EMPTY_STATES } from '@/lib/defaults'
import { GALLERY_CATEGORIES } from '@/types'
import { cn, formatDate, truncate } from '@/lib/utils'

export default function Gallery() {
  const repository = getRepository()
  const [category, setCategory] = useState('All')
  const [index, setIndex] = useState<number | null>(null)

  const gallery = useAsyncData(() => repository.gallery.list(), [])

  const categories = useMemo(() => {
    const present = new Set((gallery.data ?? []).map((image) => image.category))
    return GALLERY_CATEGORIES.filter((item) => present.has(item))
  }, [gallery.data])

  const filtered = useMemo(
    () => (gallery.data ?? []).filter((image) => category === 'All' || image.category === category),
    [gallery.data, category],
  )

  const current = index !== null ? filtered[index] : null

  useEffect(() => {
    if (index === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIndex(null)
      if (event.key === 'ArrowRight') setIndex((value) => (value === null ? null : (value + 1) % filtered.length))
      if (event.key === 'ArrowLeft')
        setIndex((value) => (value === null ? null : (value - 1 + filtered.length) % filtered.length))
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [index, filtered.length])

  return (
    <>
      <Seo
        title="Workshop Gallery — Automotive Diagnostics & Repairs | Medekuku Mawuli Kofi"
        description="Genuine workshop photographs: automotive diagnostics, electrical repairs, ECU work, sensor testing, tools and engineering projects from Accra, Ghana."
        path="/gallery"
        image={(gallery.data ?? [])[0]?.image_url ?? null}
        jsonLd={[
          breadcrumbJsonLd([
            { label: 'Home', path: '/' },
            { label: 'Gallery', path: '/gallery' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'ImageGallery',
            name: 'Automotive Workshop Gallery',
            description: 'Photographs of automotive diagnostic and repair work.',
          },
        ]}
      />

      <PageHeader
        eyebrow="Workshop gallery"
        title="Photographic workshop record"
        description="Diagnostics, electrical repairs, ECU work, tools and engineering projects — photographed during the work itself."
        aside={
          <Tag tone="signal">
            <Camera className="h-3 w-3" aria-hidden="true" />
            {gallery.data?.length ?? 0} images
          </Tag>
        }
      />

      <Section>
        <div className="container-page">
          {categories.length > 1 ? (
            <div className="mb-7 flex flex-wrap gap-1.5" role="group" aria-label="Filter gallery by category">
              {['All', ...categories].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setCategory(option)
                    setIndex(null)
                  }}
                  aria-pressed={category === option}
                  className={cn(
                    'rounded-full border px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-[0.08em] transition-colors',
                    category === option
                      ? 'border-signal-400/60 bg-signal-400/12 text-signal-200'
                      : 'border-line text-silver-400 hover:border-silver-600 hover:text-silver-200',
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}

          {gallery.error ? (
            <div className="panel border-danger-400/30 p-5 text-sm">
              <p className="font-semibold text-danger-400">Gallery could not be loaded</p>
              <p className="mt-1 text-silver-400">{gallery.error}</p>
              <button type="button" onClick={gallery.reload} className="btn btn-ghost btn-sm mt-3">
                Try again
              </button>
            </div>
          ) : gallery.loading ? (
            <SkeletonGrid count={9} />
          ) : filtered.length ? (
            <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((image, position) => (
                <li key={image.id}>
                  <button
                    type="button"
                    onClick={() => setIndex(position)}
                    className="group relative block w-full overflow-hidden rounded-md border border-line text-left transition-colors hover:border-signal-400/50"
                    aria-label={`Open image: ${image.title}`}
                  >
                    <MediaImage
                      src={image.image_url}
                      alt={image.alt_text}
                      ratio="4/3"
                      loading={position < 4 ? 'eager' : 'lazy'}
                      placeholderKind="gallery"
                      placeholderLabel="Photograph pending"
                    />
                    <span
                      className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden="true"
                    />
                    <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-white/20 bg-ink-950/70 text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <Maximize2 className="h-3 w-3" aria-hidden="true" />
                    </span>
                    <span className="absolute inset-x-0 bottom-0 p-2.5">
                      <span className="block font-mono text-[0.625rem] uppercase tracking-[0.1em] text-signal-300/90">
                        {image.category}
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-white">{image.title}</span>
                    </span>
                    {image.featured ? (
                      <span className="absolute left-2 top-2">
                        <Tag tone="signal">Featured</Tag>
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState {...EMPTY_STATES.gallery} adminHint icon={Camera} />
          )}
        </div>
      </Section>

      {current ? (
        <div
          className="fixed inset-0 z-[110] flex flex-col bg-ink-950/97"
          role="dialog"
          aria-modal="true"
          aria-label={`Image viewer: ${current.title}`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{current.title}</p>
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-500">
                {current.category} · {index !== null ? index + 1 : 0} of {filtered.length}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIndex(null)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded border border-line text-silver-300 hover:text-white"
              aria-label="Close image viewer"
              autoFocus
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center overflow-hidden p-4">
            <button
              type="button"
              onClick={() => setIndex((value) => (value === null ? null : (value - 1 + filtered.length) % filtered.length))}
              className="absolute left-2 z-10 grid h-10 w-10 place-items-center rounded-full border border-line bg-ink-950/80 text-silver-200 hover:text-white"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <img
              src={current.image_url}
              alt={current.alt_text}
              className="max-h-full max-w-full rounded border border-line object-contain"
            />
            <button
              type="button"
              onClick={() => setIndex((value) => (value === null ? null : (value + 1) % filtered.length))}
              className="absolute right-2 z-10 grid h-10 w-10 place-items-center rounded-full border border-line bg-ink-950/80 text-silver-200 hover:text-white"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="border-t border-line px-4 py-3">
            {current.description ? (
              <p className="mx-auto max-w-3xl text-center text-sm text-silver-300">
                {truncate(current.description, 300)}
              </p>
            ) : null}
            <p className="mt-1 text-center font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-600">
              Photograph added {formatDate(current.created_at)}
            </p>
          </div>
        </div>
      ) : null}
    </>
  )
}
