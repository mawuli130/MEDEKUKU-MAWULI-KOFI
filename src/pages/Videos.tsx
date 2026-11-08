import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlayCircle, Youtube } from 'lucide-react'
import { Seo, breadcrumbJsonLd } from '@/components/seo/Seo'
import { ActionLink, EmptyState, PageHeader, Section, SkeletonGrid, Tag } from '@/components/ui'
import { VideoCard } from '@/components/youtube/VideoCard'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useSiteData } from '@/hooks/useSiteData'
import { getRepository } from '@/services'
import { EMPTY_STATES } from '@/lib/defaults'
import { socialHref } from '@/components/layout/SocialLinks'
import { VIDEO_CATEGORIES } from '@/types'
import { cn } from '@/lib/utils'

export default function Videos() {
  const { socialLinks } = useSiteData()
  const repository = getRepository()
  const [category, setCategory] = useState('All')
  const videos = useAsyncData(() => repository.videos.list(), [])

  const youtubeLink = socialLinks.find((link) => link.platform === 'youtube')

  const categories = useMemo(() => {
    const present = new Set((videos.data ?? []).map((video) => video.category))
    return VIDEO_CATEGORIES.filter((item) => present.has(item))
  }, [videos.data])

  const filtered = useMemo(
    () => (videos.data ?? []).filter((video) => category === 'All' || video.category === category),
    [videos.data, category],
  )

  return (
    <>
      <Seo
        title="YouTube Automotive Videos — Diagnostics & Workshop Demonstrations | Medekuku Mawuli Kofi"
        description="Automotive YouTube videos by Medekuku Mawuli Kofi: vehicle diagnostics, electrical repairs, sensor testing, ECU work and workshop demonstrations from Accra, Ghana."
        path="/videos"
        keywords="automotive diagnostics video, vehicle electrical repair video, ECU diagnostics YouTube Ghana"
        jsonLd={[
          breadcrumbJsonLd([
            { label: 'Home', path: '/' },
            { label: 'Videos', path: '/videos' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'Automotive Video Portfolio',
            description: 'Technical automotive demonstrations and workshop video content.',
          },
        ]}
      />

      <PageHeader
        eyebrow="YouTube portfolio"
        title="Automotive video demonstrations"
        description="Diagnostic procedures, electrical repairs, sensor testing and workshop demonstrations — recorded during real work rather than staged."
        aside={
          youtubeLink ? (
            <ActionLink to={socialHref(youtubeLink)} variant="secondary" external icon={Youtube}>
              YouTube channel
            </ActionLink>
          ) : (
            <Tag tone="signal">
              <PlayCircle className="h-3 w-3" aria-hidden="true" />
              {videos.data?.length ?? 0} videos
            </Tag>
          )
        }
      />

      <Section>
        <div className="container-page">
          {categories.length > 1 ? (
            <div className="mb-7 flex flex-wrap gap-1.5" role="group" aria-label="Filter videos by category">
              {['All', ...categories].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategory(option)}
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

          {videos.error ? (
            <div className="panel border-danger-400/30 p-5 text-sm">
              <p className="font-semibold text-danger-400">Videos could not be loaded</p>
              <p className="mt-1 text-silver-400">{videos.error}</p>
              <button type="button" onClick={videos.reload} className="btn btn-ghost btn-sm mt-3">
                Try again
              </button>
            </div>
          ) : videos.loading ? (
            <SkeletonGrid count={6} />
          ) : filtered.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((video, index) => (
                <VideoCard key={video.id} video={video} priority={index < 3} />
              ))}
            </div>
          ) : (videos.data ?? []).length ? (
            <EmptyState
              title="No videos in this category"
              body="Choose another category to see the available demonstrations."
              icon={PlayCircle}
              action={
                <button type="button" className="btn btn-secondary" onClick={() => setCategory('All')}>
                  Show all videos
                </button>
              }
            />
          ) : (
            <EmptyState {...EMPTY_STATES.videos} adminHint icon={PlayCircle} />
          )}

          <p className="mt-8 border-t border-line pt-4 text-xs leading-relaxed text-silver-600">
            Videos are embedded from YouTube using the privacy-enhanced player, without autoplay. Visit the{' '}
            <Link to="/contact" className="text-signal-300 underline underline-offset-2">
              contact page
            </Link>{' '}
            for technical questions about any demonstration.
          </p>
        </div>
      </Section>
    </>
  )
}
