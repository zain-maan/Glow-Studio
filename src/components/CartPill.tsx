import { useLayoutEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cart, useCart } from '../lib/cart'
import { gsap, prefersReducedMotion } from '../lib/motion'
import { aed, fmtDuration } from '../lib/time'
import { ArrowRight, Bag, X } from './icons'

// Floating basket that appears once a service is picked, on every page except booking.
export default function CartPill() {
  const { ids, duration, total } = useCart()
  const { pathname } = useLocation()
  const pill = useRef<HTMLDivElement>(null)
  const visible = ids.length > 0 && pathname !== '/book'

  useLayoutEffect(() => {
    if (!visible || !pill.current || prefersReducedMotion()) return
    gsap.fromTo(pill.current, { y: 40, opacity: 0, scale: 0.95 }, { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.6)' })
  }, [visible])

  useLayoutEffect(() => {
    if (!visible || !pill.current || prefersReducedMotion()) return
    gsap.fromTo(pill.current.querySelector('[data-pop]'), { scale: 1.6 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' })
  }, [ids.length, visible])

  if (!visible) return null

  return (
    <div ref={pill} className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-full bg-plum p-2 pl-4 text-white shadow-[0_20px_50px_-15px_rgba(43,19,48,0.7)] sm:pl-5">
      <span className="relative">
        <Bag size={20} />
        <span data-pop className="bg-glow absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-bold">
          {ids.length}
        </span>
      </span>
      <p className="min-w-0 flex-1 truncate text-sm">
        <span className="font-semibold">{aed(total)}</span>
        <span className="text-white/60"> · {fmtDuration(duration)}</span>
      </p>
      <button onClick={cart.clear} className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Clear selected services">
        <X size={16} />
      </button>
      <Link to="/book" className="btn btn-glow !px-5 !py-2.5">
        Book <ArrowRight size={16} />
      </Link>
    </div>
  )
}
