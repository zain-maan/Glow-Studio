import { useEffect, useRef, useState, type CSSProperties } from 'react'
import lqip from '../lqip.json'
import { PORTRAITS, type ImageName } from '../data'

type Props = {
  name: ImageName
  alt?: string
  sizes?: string
  className?: string
  style?: CSSProperties
  priority?: boolean
  [data: `data-${string}`]: unknown
}

const PREVIEWS = lqip as Partial<Record<ImageName, string>>

export const imageWidths = (name: ImageName) => ((PORTRAITS as readonly string[]).includes(name) ? [480, 800] : [480, 960, 1280])

export const imageSrc = (name: ImageName, width: number, format: 'avif' | 'webp' = 'webp') => `/images/${name}-${width}.${format}`

const srcSet = (name: ImageName, format: 'avif' | 'webp') =>
  imageWidths(name)
    .map((w) => `${imageSrc(name, w, format)} ${w}w`)
    .join(', ')

// Local photos as AVIF (smallest) with a WebP fallback, at the size the screen needs.
// A tiny blurred preview shows instantly, and the real photo sharpens in once it arrives.
export default function Img({ name, alt = '', sizes = '(min-width: 1024px) 50vw, 100vw', className, style, priority, ...rest }: Props) {
  const img = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(false)
  const preview = PREVIEWS[name]
  const widths = imageWidths(name)

  // A cached image can finish before React attaches onLoad.
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth) setLoaded(true)
  }, [name])

  return (
    <picture style={{ display: 'contents' }}>
      <source type="image/avif" srcSet={srcSet(name, 'avif')} sizes={sizes} />
      <img
        ref={img}
        src={imageSrc(name, widths[1])}
        srcSet={srcSet(name, 'webp')}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={className}
        style={{
          ...(preview && { backgroundImage: `url(${preview})`, backgroundSize: 'cover', backgroundPosition: 'center' }),
          filter: loaded ? 'none' : 'blur(14px) saturate(1.2)',
          transition: 'filter 0.8s ease-out',
          ...style,
        }}
        {...rest}
      />
    </picture>
  )
}
