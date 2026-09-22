import Image from 'next/image'

const storageOrigin = new URL(process.env.NEXT_PUBLIC_INSFORGE_URL || 'https://376vyh7j.us-east.insforge.app').origin

function isOptimizable(src: string) {
  try {
    const url = new URL(src)
    return url.origin === storageOrigin && url.pathname.startsWith('/api/storage/buckets/')
  } catch {
    return false
  }
}

// CMS images come from InsForge storage and are optimized by next/image. Any
// other URL (e.g. one pasted by an editor) falls back to a plain <img> so an
// unexpected host never breaks the page. Rendered size is controlled by CSS;
// width/height only reserve the aspect ratio and drive srcset.
export function CmsImage({
  src,
  alt,
  sizes,
  className,
  width = 1600,
  height = 1000,
  eager = false,
}: {
  src: string
  alt: string
  sizes: string
  className?: string
  width?: number
  height?: number
  eager?: boolean
}) {
  if (!isOptimizable(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} loading={eager ? 'eager' : 'lazy'} />
  }
  return (
    <Image
      src={src}
      alt={alt}
      sizes={sizes}
      width={width}
      height={height}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
    />
  )
}
