import { useEffect } from 'react'
import { SITE_URL } from '@/lib/config'

export interface SeoProps {
  title: string
  description: string
  /** Path only, e.g. "/projects/abs-fault". Absolute URLs are also accepted. */
  path: string
  image?: string | null
  type?: 'website' | 'article' | 'profile'
  noindex?: boolean
  keywords?: string
  publishedTime?: string | null
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
  /** Extra <link rel="alternate"> style tags are not needed; keep this extensible. */
  preventCanonical?: boolean
}

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  const normalised = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${SITE_URL}${normalised === '/' ? '' : normalised}`
}

function setMeta(attribute: 'name' | 'property', key: string, content: string): void {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setLink(rel: string, href: string): void {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
}

const JSON_LD_ID = 'seo-json-ld'

/**
 * Declarative document head management.
 *
 * Prerendering runs this same component in Node, so the emitted static HTML
 * already carries a unique title, description, canonical, Open Graph, Twitter
 * and JSON-LD block for every public route.
 */
export function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  keywords,
  publishedTime,
  jsonLd,
  preventCanonical = false,
}: SeoProps) {
  useEffect(() => {
    const canonical = absoluteUrl(path)
    document.title = title

    setMeta('name', 'description', description)
    if (keywords) setMeta('name', 'keywords', keywords)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')

    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:site_name', 'Mawuli Engineering & Diagnostic Services')
    setMeta('property', 'og:locale', 'en_GH')
    if (!preventCanonical) {
      setMeta('property', 'og:url', canonical)
      setLink('canonical', canonical)
    }
    if (image) {
      setMeta('property', 'og:image', absoluteUrl(image))
      setMeta('property', 'og:image:alt', title)
      setMeta('name', 'twitter:image', absoluteUrl(image))
    } else {
      document.head.querySelector('meta[property="og:image"]')?.remove()
      document.head.querySelector('meta[name="twitter:image"]')?.remove()
    }
    if (publishedTime) {
      setMeta('property', 'article:published_time', publishedTime)
    }

    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)

    document.getElementById(JSON_LD_ID)?.remove()
    if (jsonLd) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = JSON_LD_ID
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }

    return () => {
      document.getElementById(JSON_LD_ID)?.remove()
    }
  }, [title, description, path, image, type, noindex, keywords, publishedTime, jsonLd, preventCanonical])

  return null
}

/* ----------------------------- JSON-LD ----------------------------- */

export function personJsonLd(input: {
  name: string
  jobTitle: string
  city: string
  country: string
  image?: string | null
  sameAs: string[]
  url?: string
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: input.name,
    jobTitle: input.jobTitle,
    description: `${input.name} is an ${input.jobTitle} based in ${input.city}, ${input.country}.`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: input.city,
      addressCountry: input.country,
    },
    ...(input.image ? { image: absoluteUrl(input.image) } : {}),
    ...(input.sameAs.length ? { sameAs: input.sameAs } : {}),
    url: input.url ?? SITE_URL,
  }
}

export function websiteJsonLd(siteName: string, description: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: SITE_URL,
    description,
    inLanguage: 'en-GH',
  }
}

export interface Crumb {
  label: string
  path?: string
}

export function breadcrumbJsonLd(crumbs: Crumb[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      ...(crumb.path ? { item: absoluteUrl(crumb.path) } : {}),
    })),
  }
}

export function videoJsonLd(input: {
  name: string
  description: string
  videoId: string
  thumbnail?: string | null
  uploadDate?: string | null
  path: string
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: input.name,
    description: input.description,
    thumbnailUrl: input.thumbnail ? [absoluteUrl(input.thumbnail)] : [absoluteUrl(`/images/video-poster.jpg`)],
    uploadDate: input.uploadDate ?? new Date().toISOString(),
    embedUrl: `https://www.youtube-nocookie.com/embed/${input.videoId}`,
    contentUrl: `https://www.youtube.com/watch?v=${input.videoId}`,
    url: absoluteUrl(input.path),
  }
}

export function articleJsonLd(input: {
  headline: string
  description: string
  path: string
  datePublished?: string | null
  image?: string | null
  authorName: string
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: input.headline,
    description: input.description,
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(input.path) },
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.image ? { image: absoluteUrl(input.image) } : {}),
    author: { '@type': 'Person', name: input.authorName },
    publisher: { '@type': 'Organization', name: 'Mawuli Engineering & Diagnostic Services' },
  }
}

export { absoluteUrl }
