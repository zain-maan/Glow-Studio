import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap, prefersReducedMotion } from '../lib/motion'
import { ArrowRight } from './icons'
import Img from './Img'

// An arch-shaped window onto the studio that opens to fill the screen as you scroll.
export default function CoverReveal() {
  const section = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const mobile = window.matchMedia('(max-width: 767px)').matches
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: section.current, start: 'top top', end: mobile ? '+=80%' : '+=130%', pin: true, scrub: 0.6 },
      })
      // Starts as the brand's arch shape, ends full bleed.
      tl.fromTo('[data-cover-frame]', { clipPath: mobile ? 'inset(12% 10% 12% 10% round 999px 999px 32px 32px)' : 'inset(10% 32% 10% 32% round 999px 999px 40px 40px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)' }, 0)
        .fromTo('[data-cover-img]', { scale: 1.4 }, { scale: 1 }, 0)
        .fromTo('[data-cover-shade]', { opacity: 0 }, { opacity: 1 }, 0.35)
        .from('[data-cover-word]', { yPercent: 120, opacity: 0, stagger: 0.06, duration: 0.35 }, 0.45)
        .from('[data-cover-cta]', { y: 30, opacity: 0, duration: 0.25 }, 0.75)
    }, section)
    return () => ctx.revert()
  }, [])

  const words = ['Light,', 'calm', 'and', 'entirely', 'yours.']
  return (
    <section ref={section} className="relative h-[100svh] overflow-hidden bg-porcelain">
      <div data-cover-frame className="absolute inset-0 overflow-hidden">
        <div data-cover-img className="absolute inset-0">
          <Img name="interior-bright" sizes="100vw" alt="Inside the studio" className="h-full w-full object-cover" />
        </div>
        <div data-cover-shade className="absolute inset-0 bg-gradient-to-t from-plum/85 via-plum/30 to-transparent" />
      </div>
      <div className="relative flex h-full flex-col items-center justify-end px-4 pb-16 text-center text-white sm:pb-24">
        <h2 className="max-w-4xl font-display text-[clamp(3rem,8vw,7rem)] leading-[0.95]">
          {words.map((w, i) => (
            <span key={w} className="inline-block overflow-hidden pb-2 align-bottom">
              <span data-cover-word className={`mr-[0.25em] inline-block ${i >= 3 ? 'text-glow italic' : ''}`}>
                {w}
              </span>
            </span>
          ))}
        </h2>
        <div data-cover-cta>
          <Link to="/book" className="btn btn-light mt-8">
            Book your visit <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  )
}
