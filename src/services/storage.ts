/**
 * Upload service.
 *
 * • Supabase mode: images are compressed in the browser, then uploaded to the
 *   matching bucket. Buckets and their policies are created by the migration;
 *   only authenticated administrators can write.
 * • Local mode: the compressed data URL is returned so previews work offline.
 */
import { DATA_SOURCE } from '@/lib/config'
import { requireSupabaseClient } from '@/lib/supabase'
import { compressImage, readFileAsDataUrl, safeFileName, assertPdfFile, type CompressedImage } from '@/lib/image'

export type Bucket = 'gallery' | 'projects' | 'certificates' | 'profile' | 'cv' | 'videos'

export interface UploadResult {
  url: string
  bytes: number
  originalBytes: number
  width?: number
  height?: number
}

export interface UploadOptions {
  bucket: Bucket
  /** Logical folder inside the bucket, e.g. "diagnostics". */
  folder?: string
  onProgress?: (percent: number) => void
}

export class UploadError extends Error {}

export async function uploadImage(file: File, options: UploadOptions): Promise<UploadResult> {
  const { bucket, folder = 'uploads', onProgress } = options
  onProgress?.(8)
  const compressed: CompressedImage = await compressImage(file)
  onProgress?.(45)

  if (DATA_SOURCE === 'local') {
    onProgress?.(100)
    return {
      url: compressed.dataUrl,
      bytes: compressed.bytes,
      originalBytes: compressed.originalBytes,
      width: compressed.width,
      height: compressed.height,
    }
  }

  const client = requireSupabaseClient()
  const path = `${folder}/${safeFileName(file.name, compressed.blob.type)}`
  const { error } = await client.storage.from(bucket).upload(path, compressed.blob, {
    cacheControl: '31536000',
    upsert: false,
    contentType: compressed.blob.type,
  })
  if (error) throw new UploadError(`Upload failed: ${error.message}`)
  onProgress?.(85)

  const { data } = client.storage.from(bucket).getPublicUrl(path)
  onProgress?.(100)
  return {
    url: data.publicUrl,
    bytes: compressed.bytes,
    originalBytes: compressed.originalBytes,
    width: compressed.width,
    height: compressed.height,
  }
}

export async function uploadDocument(
  file: File,
  options: Omit<UploadOptions, 'onProgress'> & { onProgress?: (percent: number) => void },
): Promise<UploadResult> {
  assertPdfFile(file)
  const { bucket, folder = 'documents', onProgress } = options
  onProgress?.(10)

  if (DATA_SOURCE === 'local') {
    const dataUrl = await readFileAsDataUrl(file)
    onProgress?.(100)
    return { url: dataUrl, bytes: file.size, originalBytes: file.size }
  }

  const client = requireSupabaseClient()
  const path = `${folder}/${safeFileName(file.name, 'application/pdf')}`
  const { error } = await client.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: 'application/pdf',
  })
  if (error) throw new UploadError(`Upload failed: ${error.message}`)
  onProgress?.(100)
  const { data } = client.storage.from(bucket).getPublicUrl(path)
  return { url: data.publicUrl, bytes: file.size, originalBytes: file.size }
}

export async function removeStoredFile(bucket: Bucket, publicUrl: string): Promise<void> {
  if (DATA_SOURCE === 'local') return
  const marker = `/object/public/${bucket}/`
  const index = publicUrl.indexOf(marker)
  if (index < 0) return
  const path = decodeURIComponent(publicUrl.slice(index + marker.length))
  const client = requireSupabaseClient()
  await client.storage.from(bucket).remove([path])
}
