import type { CSSProperties } from 'react'
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

// Serves the locally optimised WebP photos at the right size for the screen, with a tiny
// blurred preview painted underneath so the space is never empty while the photo loads.
export default function Img({ name, alt = '', sizes = '(min-width: 1024px) 50vw, 100vw', className, style, priority, ...rest }: Props) {
  const [small, large] = (PORTRAITS as readonly string[]).includes(name) ? [400, 800] : [640, 1280]
  const preview = PREVIEWS[name]
  return (
    <img
      src={`/images/${name}-${large}.webp`}
      srcSet={`/images/${name}-${small}.webp ${small}w, /images/${name}-${large}.webp ${large}w`}
      sizes={sizes}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      className={className}
      style={{
        ...(preview && { backgroundImage: `url(${preview})`, backgroundSize: 'cover', backgroundPosition: 'center' }),
        ...style,
      }}
      {...rest}
    />
  )
}
