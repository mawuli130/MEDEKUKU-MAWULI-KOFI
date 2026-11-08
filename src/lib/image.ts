/**
 * Client-side image compression + validation.
 * Keeping uploads small matters both for Supabase Storage quotas and for the
 * local demo adapter, which stores data URLs.
 */
import { MAX_UPLOAD_BYTES, ACCEPTED_IMAGE_TYPES } from '@/lib/config'

export interface CompressedImage {
  blob: Blob
  dataUrl: string
  width: number
  height: number
  originalBytes: number
  bytes: number
  fileName: string
}

export class UploadValidationError extends Error {}

export function assertImageFile(file: File): void {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new UploadValidationError(
      `Unsupported image type (${file.type || 'unknown'}). Use JPG, PNG, WebP or AVIF.`,
    )
  }
  if (file.size > MAX_UPLOAD_BYTES * 2) {
    throw new UploadValidationError('Image is larger than 16 MB. Please resize it before uploading.')
  }
}

export function assertPdfFile(file: File): void {
  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) throw new UploadValidationError('Only PDF documents can be uploaded here.')
  if (file.size > MAX_UPLOAD_BYTES * 2) {
    throw new UploadValidationError('Document is larger than 16 MB.')
  }
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new UploadValidationError('That file could not be read as an image.'))
    image.src = dataUrl
  })
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new UploadValidationError('The file could not be read.'))
    reader.readAsDataURL(file)
  })
}

/** Resize to a max edge and re-encode as WebP (falling back to JPEG). */
export async function compressImage(file: File, maxEdge = 1800, quality = 0.82): Promise<CompressedImage> {
  assertImageFile(file)
  const originalDataUrl = await readAsDataUrl(file)
  const image = await loadImage(originalDataUrl)

  const scale = Math.min(1, maxEdge / Math.max(image.width, image.height))
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new UploadValidationError('This browser cannot process images.')
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)

  const supportsWebp = canvas.toDataURL('image/webp').startsWith('data:image/webp')
  const mime = supportsWebp ? 'image/webp' : 'image/jpeg'
  const dataUrl = canvas.toDataURL(mime, quality)
  const blob = await (await fetch(dataUrl)).blob()

  return {
    blob,
    dataUrl,
    width,
    height,
    originalBytes: file.size,
    bytes: blob.size,
    fileName: file.name,
  }
}

/** Filesystem-safe, descriptive file name for SEO-friendly image paths. */
export function safeFileName(name: string, mime: string): string {
  const extension = mime.includes('webp')
    ? 'webp'
    : mime.includes('png')
      ? 'png'
      : mime.includes('avif')
        ? 'avif'
        : mime.includes('pdf')
          ? 'pdf'
          : 'jpg'
  const base = name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  const stamp = Date.now().toString(36)
  return `${base || 'upload'}-${stamp}.${extension}`
}

export function readFileAsDataUrl(file: Blob): Promise<string> {
  return readAsDataUrl(file)
}
