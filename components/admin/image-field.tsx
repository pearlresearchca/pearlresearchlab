'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { insforge } from '@/lib/insforge/client'
import type { ActionResult } from '@/lib/cms/action-result'

export function ImageField({
  label,
  currentUrl,
  currentKey,
  onUpload,
  aspect = 'aspect-video',
}: {
  label: string
  currentUrl: string | null
  currentKey: string | null
  onUpload: (url: string, key: string) => Promise<ActionResult>
  aspect?: string
}) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFile(file: File) {
    setError(null)
    startTransition(async () => {
      const { data, error: uploadError } = await insforge.storage.from('site-images').uploadAuto(file)
      if (uploadError || !data) {
        const message = uploadError?.message ?? 'Upload failed.'
        setError(message)
        toast.error(message)
        return
      }

      let result: ActionResult
      try {
        result = await onUpload(data.url, data.key)
      } catch (err) {
        result = { error: err instanceof Error ? err.message : 'Could not save the image.' }
      }

      if ('error' in result) {
        setError(result.error)
        toast.error(result.error)
        // Clean up the just-uploaded file since nothing references it.
        await insforge.storage.from('site-images').remove(data.key)
        return
      }

      if (currentKey) {
        await insforge.storage.from('site-images').remove(currentKey)
      }

      toast.success('Image updated')
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className={`relative w-full max-w-xs overflow-hidden rounded-md border border-border bg-muted ${aspect}`}>
        {currentUrl ? (
          <img src={currentUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
        )}
        {pending && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white">Uploading…</div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
        >
          {currentUrl ? 'Replace image' : 'Upload image'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
