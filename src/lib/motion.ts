import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import Lenis from 'lenis'

gsap.registerPlugin(ScrollTrigger, SplitText)

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let lenis: Lenis | null = null

// One Lenis instance drives smooth scrolling and keeps ScrollTrigger in sync with it.
export function startSmoothScroll() {
  if (lenis || prefersReducedMotion()) return () => {}
  lenis = new Lenis({ duration: 1.15 })
  lenis.on('scroll', ScrollTrigger.update)
  const tick = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  return () => {
    gsap.ticker.remove(tick)
    lenis?.destroy()
    lenis = null
  }
}

export function scrollToTop() {
  // `force` makes Lenis jump even while a previous smooth scroll is still running.
  lenis?.scrollTo(0, { immediate: true, force: true })
  window.scrollTo(0, 0)
}

export function scrollToElement(selector: string, offset = -88) {
  const el = document.querySelector<HTMLElement>(selector)
  if (!el) return
  if (lenis) lenis.scrollTo(el, { offset, duration: 0.9 })
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' })
}

export function setScrollLocked(locked: boolean) {
  if (!lenis) return
  if (locked) lenis.stop()
  else lenis.start()
}

// The intro screen sets this so page animations can wait for it to lift.
let introEndsAt = 0
export function holdForIntro(ms: number) {
  introEndsAt = performance.now() + ms
}
export function introDelay(extra = 0) {
  return Math.max(0, (introEndsAt - performance.now()) / 1000) + extra
}

export { gsap, ScrollTrigger, SplitText }
