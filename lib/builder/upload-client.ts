'use client'

import { insforge } from '@/lib/insforge/client'
import { findMediaByChecksumAction, registerMediaAction } from './actions'
import { sanitizeSvgFile } from './sanitize-client'
import type { MediaItem } from './types'

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
export const VIDEO_TYPES = ['video/mp4', 'video/webm']
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024

// Raster images wider than this are scaled down before upload.
const MAX_DIMENSION = 2400

async function sha256(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer()
  const hash = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('')
}

export function readImageSize(file: Blob): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve(null)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

// Re-encode large JPEG/PNG/WebP images as WebP (keeping PNG transparency),
// capped at MAX_DIMENSION. GIFs and SVGs are left untouched. Only keeps the
// optimized version if it's actually smaller.
async function optimize(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return file
  const size = await readImageSize(file)
  if (!size) return file
  const scale = Math.min(1, MAX_DIMENSION / Math.max(size.width, size.height))
  if (scale === 1 && file.size < 400 * 1024) return file

  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(size.width * scale)
  canvas.height = Math.round(size.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
  if (!blob || blob.size >= file.size) return file
  return new File([blob], file.name.replace(/\.(jpe?g|png|webp)$/i, '') + '.webp', { type: 'image/webp' })
}

export function validateFile(file: File, kind: 'image' | 'video' | 'any' = 'image'): string | null {
  const allowed = kind === 'image' ? IMAGE_TYPES : kind === 'video' ? VIDEO_TYPES : [...IMAGE_TYPES, ...VIDEO_TYPES]
  if (!allowed.includes(file.type)) {
    return kind === 'video' ? `“${file.name}” isn’t an MP4 or WebM video.` : `“${file.name}” isn’t a supported image (JPG, PNG, WebP, GIF or SVG).`
  }
  const max = file.type.startsWith('video/') ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
  if (file.size > max) return `“${file.name}” is larger than ${Math.round(max / 1024 / 1024)} MB.`
  return null
}

export type UploadResult = { media: MediaItem; reused: boolean }

// Validates, sanitizes/optimizes, de-duplicates and uploads a file to the
// site-images bucket, then records it in the media library.
export async function uploadMedia(original: File, kind: 'image' | 'video' | 'any' = 'image'): Promise<UploadResult> {
  const problem = validateFile(original, kind)
  if (problem) throw new Error(problem)

  let file = original
  if (file.type === 'image/svg+xml') file = await sanitizeSvgFile(file)
  else if (file.type.startsWith('image/')) file = await optimize(file)

  // Same bytes as an existing library item → reuse it instead of storing a copy.
  const checksum = await sha256(original)
  const existing = await findMediaByChecksumAction(checksum)
  if ('ok' in existing && existing.media) return { media: existing.media as MediaItem, reused: true }

  const dims = file.type.startsWith('image/') ? await readImageSize(file) : null
  const { data, error } = await insforge.storage.from('site-images').uploadAuto(file)
  if (error || !data) throw new Error(error?.message ? `Upload failed: ${error.message}` : 'Upload failed. Please try again.')

  const result = await registerMediaAction({
    url: data.url,
    key: data.key,
    filename: original.name.slice(0, 200),
    mime_type: file.type,
    size_bytes: file.size,
    width: dims?.width ?? null,
    height: dims?.height ?? null,
    checksum,
  })
  if ('error' in result) {
    await insforge.storage.from('site-images').remove(data.key)
    throw new Error(result.error)
  }
  return { media: result.media as MediaItem, reused: false }
}

export async function removeStoredFile(key: string) {
  await insforge.storage.from('site-images').remove(key)
}

export async function fetchMediaLibrary(): Promise<MediaItem[]> {
  const { data, error } = await insforge.database.from('cms_media').select('*').order('created_at', { ascending: false }).limit(1000)
  if (error) throw new Error(error.message)
  return (data ?? []) as MediaItem[]
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}
