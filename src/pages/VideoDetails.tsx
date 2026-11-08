import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, PlayCircle, Youtube } from 'lucide-react'
import { Seo, breadcrumbJsonLd, videoJsonLd } from '@/components/seo/Seo'
import { Breadcrumbs, EmptyState, Section, Tag } from '@/components/ui'
import { VideoCard, VideoEmbed } from '@/components/youtube/VideoCard'
import { useAsyncData } from '@/hooks/useAsyncData'
import { useSiteData } from '@/hooks/useSiteData'
import { getRepository } from '@/services'
import { formatDate, vehicleLabel, youtubeThumbnail, youtubeWatchUrl } from '@/lib/utils'

export default function VideoDetails() {
  const { videoId = '' } = useParams()
  const { profile } = useSiteData()
  const repository = getRepository()
  const [active, setActive] = useState(false)

  const videos = useAsyncData(() => repository.videos.list(), [])
  const video = useMemo(
    () => (videos.data ?? []).find((item) => item.youtube_video_id === videoId) ?? null,
    [videos.data, videoId],
  )
  const more = useMemo(
    () => (videos.data ?? []).filter((item) => item.youtube_video_id !== videoId).slice(0, 3),
    [videos.data, videoId],
  )

  if (videos.loading) {
    return (
      <div className="container-page py-16" aria-busy="true">
        <div className="skeleton mb-4 h-4 w-40" />
        <div className="skeleton mb-8 h-9 w-2/3" />
        <div className="skeleton aspect-video w-full" />
      </div>
    )
  }

  if (!video) {
    return (
      <>
        <Seo
          title="Video not found — Medekuku Mawuli Kofi"
          description="This automotive video could not be found."
          path={`/videos/${videoId}`}
          noindex
        />
        <Section>
          <div className="container-page max-w-2xl">
            <EmptyState
              title="Video not found"
              body="This video may have been unpublished or the link may be incorrect."
              icon={PlayCircle}
              action={
                <Link to="/videos" className="btn btn-primary">
                  Browse video portfolio
                </Link>
              }
            />
          </div>
        </Section>
      </>
    )
  }

  const path = `/videos/${video.youtube_video_id}`
  const vehicle = vehicleLabel({ vehicle_make: video.vehicle_make, vehicle_model: video.vehicle_model })
  const description =
    video.description ||
    `${video.title} — ${video.category} demonstration by ${profile.full_name}, ${profile.headline}.`

  return (
    <>
      <Seo
        title={`${video.title} — Automotive Video | ${profile.full_name}`}
        description={description.slice(0, 300)}
        path={path}
        type="article"
        image={video.thumbnail_url ?? youtubeThumbnail(video.youtube_video_id)}
        publishedTime={video.published_at}
        jsonLd={[
          videoJsonLd({
            name: video.title,
            description,
            videoId: video.youtube_video_id,
            thumbnail: video.thumbnail_url ?? youtubeThumbnail(video.youtube_video_id),
            uploadDate: video.published_at,
            path,
          }),
          breadcrumbJsonLd([
            { label: 'Home', path: '/' },
            { label: 'Videos', path: '/videos' },
            { label: video.title, path },
          ]),
        ]}
      />

      <Section className="pt-8 md:pt-10">
        <div className="container-page">
          <Breadcrumbs
            crumbs={[{ label: 'Home', path: '/' }, { label: 'Videos', path: '/videos' }, { label: video.title }]}
          />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
            <div className="min-w-0">
              <VideoEmbed
                videoId={video.youtube_video_id}
                title={video.title}
                poster={video.thumbnail_url}
                active={active}
                onActivate={() => setActive(true)}
              />
              <h1 className="mt-5 text-[1.625rem] leading-tight font-semibold sm:text-[2rem]">{video.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Tag tone="signal">
                  <Youtube className="h-3 w-3" aria-hidden="true" />
                  {video.category}
                </Tag>
                {vehicle ? <Tag>{vehicle}</Tag> : null}
                {video.published_at ? <Tag>Added {formatDate(video.published_at)}</Tag> : null}
              </div>
              {video.description ? (
                <p className="prose-tech mt-5 whitespace-pre-line text-sm sm:text-[0.9375rem]">{video.description}</p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-2.5 border-t border-line pt-5">
                <a
                  href={youtubeWatchUrl(video.youtube_video_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  Watch on YouTube
                </a>
                <Link to="/videos" className="btn btn-ghost btn-sm">
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  All videos
                </Link>
              </div>
            </div>

            <aside>
              <h2 className="label-tech mb-3">Video details</h2>
              <dl className="panel space-y-2 p-4 text-xs">
                <div className="flex justify-between gap-3 border-b border-dashed border-line/60 pb-2">
                  <dt className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-600">Video ID</dt>
                  <dd className="font-mono text-silver-300">{video.youtube_video_id}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-dashed border-line/60 py-2">
                  <dt className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-600">Make</dt>
                  <dd className="text-silver-200">{video.vehicle_make || '—'}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-dashed border-line/60 py-2">
                  <dt className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-600">Model</dt>
                  <dd className="text-silver-200">{video.vehicle_model || '—'}</dd>
                </div>
                <div className="flex justify-between gap-3 pt-2">
                  <dt className="font-mono text-[0.625rem] uppercase tracking-[0.12em] text-silver-600">Format</dt>
                  <dd className="text-silver-200">Privacy-enhanced embed</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-silver-600">
                The player loads only when you press play and uses youtube-nocookie.com. No video is autoplayed.
              </p>
            </aside>
          </div>

          {more.length ? (
            <div className="mt-12 border-t border-line pt-8">
              <h2 className="mb-5 text-xl font-semibold">More videos</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {more.map((item) => (
                  <VideoCard key={item.id} video={item} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Section>
    </>
  )
}
