import { useLayoutEffect, useRef, type ReactNode } from 'react'
import type { ImageName } from '../data'
import { gsap, introDelay, prefersReducedMotion, SplitText } from '../lib/motion'
import Img from './Img'

type Props = {
  image: ImageName
  eyebrow: string
  title: ReactNode
  text?: ReactNode
  badge?: ReactNode
  children?: ReactNode
}

// Light, airy page header: soft colour blobs, a title that rises line by line and an
// arch-shaped photo that settles in and floats.
export default function PageHero({ image, eyebrow, title, text, badge, children }: Props) {
  const root = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const delay = introDelay(0.45)
      SplitText.create('[data-ph-title]', {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
        autoSplit: true,
        onSplit: (self) => gsap.from(self.lines, { yPercent: 110, duration: 1.2, ease: 'power4.out', stagger: 0.1, delay }),
      })
      gsap.from('[data-ph-fade]', { opacity: 0, y: 24, duration: 1, ease: 'power3.out', stagger: 0.1, delay: delay + 0.3 })
      gsap.fromTo('[data-ph-arch]', { clipPath: 'inset(100% 0 0 0 round 999px 999px 32px 32px)' }, { clipPath: 'inset(0% 0 0 0 round 999px 999px 32px 32px)', duration: 1.4, ease: 'expo.inOut', delay: delay - 0.2 })
      gsap.from('[data-ph-arch] img', { scale: 1.4, duration: 1.8, ease: 'expo.out', delay: delay - 0.1 })
      gsap.from('[data-ph-badge]', { opacity: 0, scale: 0.8, y: 20, duration: 0.8, ease: 'back.out(1.7)', delay: delay + 0.8 })
    }, root)
    return () => ctx.revert()
  }, [image])

  return (
    <section ref={root} className="relative overflow-hidden pb-12 pt-28 sm:pb-16 sm:pt-32 lg:pb-24 lg:pt-40">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span className="animate-blob absolute -left-[10%] top-[10%] h-[45vmax] w-[45vmax] rounded-full bg-[radial-gradient(circle,rgba(255,177,153,0.45),transparent_65%)]" />
        <span className="animate-blob absolute -right-[10%] -top-[20%] h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle,rgba(200,109,215,0.28),transparent_65%)] [animation-delay:-6s]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:gap-12 sm:px-6 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <p data-ph-fade className="eyebrow">{eyebrow}</p>
          <h1 data-ph-title className="mt-5 font-display text-[clamp(2.7rem,7vw,6.2rem)] leading-[0.98]">
            {title}
          </h1>
          {text && (
            <p data-ph-fade className="mt-5 max-w-xl text-base text-muted sm:mt-6 sm:text-lg">
              {text}
            </p>
          )}
          {children && (
            <div data-ph-fade className="mt-8">
              {children}
            </div>
          )}
        </div>

        <div className="relative mx-auto w-full max-w-[17rem] sm:max-w-sm lg:max-w-md">
          <div data-ph-arch className="aspect-[4/5] overflow-hidden rounded-t-full rounded-b-[2rem]">
            <Img name={image} priority sizes="(min-width: 1024px) 30vw, 80vw" className="h-full w-full object-cover" />
          </div>
          {badge && (
            <div data-ph-badge className="absolute -bottom-5 -left-4 sm:-left-10">
              <div className="glass animate-float rounded-2xl px-5 py-4 shadow-xl">{badge}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
