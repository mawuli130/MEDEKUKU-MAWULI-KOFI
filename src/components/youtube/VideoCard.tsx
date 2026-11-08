import { Link } from 'react-router-dom'
import { Play, Youtube } from 'lucide-react'
import { MediaImage } from '@/components/ui/MediaImage'
import { Tag } from '@/components/ui'
import { truncate, vehicleLabel, youtubeThumbnail } from '@/lib/utils'
import type { YoutubeVideo } from '@/types'

export function VideoCard({ video, priority = false }: { video: YoutubeVideo; priority?: boolean }) {
  const thumbnail = video.thumbnail_url ?? youtubeThumbnail(video.youtube_video_id)
  const vehicle = vehicleLabel({ vehicle_make: video.vehicle_make, vehicle_model: video.vehicle_model })

  return (
    <article className="panel panel-interactive group flex h-full flex-col overflow-hidden">
      <Link
        to={`/videos/${video.youtube_video_id}`}
        className="relative block"
        aria-label={`Watch: ${video.title}`}
      >
        <MediaImage
          src={thumbnail}
          alt={`${video.title} — automotive video thumbnail`}
          ratio="16/9"
          priority={priority}
          placeholderKind="scan"
          placeholderLabel="Video thumbnail"
          imgClassName="object-cover"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" aria-hidden="true" />
        <span
          className="absolute inset-0 grid place-items-center"
          aria-hidden="true"
        >
          <span className="grid h-12 w-12 place-items-center rounded-full border border-white/25 bg-ink-950/70 text-white backdrop-blur-sm transition-transform duration-200 group-hover:scale-105 group-hover:border-signal-400/60 group-hover:text-signal-200">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
        </span>
        {video.featured ? (
          <span className="absolute left-3 top-3">
            <Tag tone="signal">Featured</Tag>
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="mb-2 flex items-center gap-1.5 font-mono text-[0.625rem] uppercase tracking-[0.13em] text-signal-300/90">
          <Youtube className="h-3 w-3" aria-hidden="true" />
          {video.category}
        </p>
        <h3 className="font-display text-[1.0625rem] font-semibold leading-snug text-white">
          <Link to={`/videos/${video.youtube_video_id}`} className="transition-colors hover:text-signal-200">
            {video.title}
          </Link>
        </h3>
        {vehicle ? <p className="mt-1.5 text-xs text-silver-500">{vehicle}</p> : null}
        {video.description ? (
          <p className="mt-2.5 flex-1 text-[0.8125rem] leading-relaxed text-silver-400">
            {truncate(video.description, 120)}
          </p>
        ) : null}
      </div>
    </article>
  )
}

/** Inline player: privacy-enhanced host, explicit play, no autoplay. */
export function VideoEmbed({
  videoId,
  title,
  poster,
  className,
  active,
  onActivate,
}: {
  videoId: string
  title: string
  poster?: string | null
  className?: string
  active: boolean
  onActivate: () => void
}) {
  if (active) {
    return (
      <div className={className}>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-line bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&playsinline=1`}
            title={title}
            loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onActivate}
      className={`group relative block w-full overflow-hidden rounded-lg border border-line bg-ink-850 text-left ${className ?? ''}`}
      aria-label={`Play video: ${title}`}
    >
      <span className="relative block aspect-video w-full">
        <MediaImage
          src={poster ?? youtubeThumbnail(videoId)}
          alt={`${title} — video thumbnail`}
          ratio="auto"
          className="h-full"
          imgClassName="h-full"
        />
      </span>
      <span className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/10 to-transparent" aria-hidden="true" />
      <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
        <span className="grid h-16 w-16 place-items-center rounded-full border border-signal-400/50 bg-ink-950/75 text-signal-200 shadow-signal transition-transform duration-200 group-hover:scale-105">
          <Play className="ml-1 h-6 w-6 fill-current" />
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-4 font-mono text-[0.625rem] uppercase tracking-[0.13em] text-silver-300">
        Play video · loads from YouTube
      </span>
    </button>
  )
}
