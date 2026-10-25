import { useEffect, useRef, useState } from 'react'
import { CATEGORIES, SERVICES, type Category } from '../data'
import { cart, useCart } from '../lib/cart'
import { gsap, prefersReducedMotion } from '../lib/motion'
import { aed, fmtDuration } from '../lib/time'
import { Check, Plus } from './icons'
import Img from './Img'

// Tabbed price list. Each row adds the service to the booking basket; on desktop a photo
// of the category follows the pointer while you browse the list.
export default function ServiceMenu({ initial = 'Hair' as Category }) {
  const [tab, setTab] = useState<Category>(initial)
  const { ids } = useCart()
  const list = useRef<HTMLUListElement>(null)
  const preview = useRef<HTMLDivElement>(null)
  const category = CATEGORIES.find((c) => c.id === tab)!
  const services = SERVICES.filter((s) => s.category === tab)

  useEffect(() => {
    if (prefersReducedMotion() || !list.current) return
    gsap.fromTo(list.current.children, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, ease: 'power3.out' })
  }, [tab])

  useEffect(() => {
    const el = list.current
    const card = preview.current
    if (!el || !card || !window.matchMedia('(pointer: fine)').matches || prefersReducedMotion()) return
    gsap.set(card, { scale: 0.8 })
    const x = gsap.quickTo(card, 'x', { duration: 0.6, ease: 'power3' })
    const y = gsap.quickTo(card, 'y', { duration: 0.6, ease: 'power3' })
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      x(e.clientX - r.left + 30)
      y(e.clientY - r.top - 120)
    }
    const enter = () => gsap.to(card, { opacity: 1, scale: 1, rotate: -4, duration: 0.4 })
    const leave = () => gsap.to(card, { opacity: 0, scale: 0.8, rotate: 0, duration: 0.3 })
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointerleave', leave)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointerleave', leave)
    }
  }, [])

  return (
    <div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Service categories">
        {CATEGORIES.map((c) => (
          <button key={c.id} role="tab" aria-selected={tab === c.id} onClick={() => setTab(c.id)} className="chip shrink-0">
            {c.id}
            <span className={`text-xs ${tab === c.id ? 'text-white/60' : 'text-muted'}`}>
              {SERVICES.filter((s) => s.category === c.id).length}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-5 text-muted">{category.blurb}</p>

      <div className="relative">
        <ul ref={list} className="mt-6 divide-y divide-line border-y border-line" role="tabpanel">
          {services.map((s) => {
            const added = ids.includes(s.id)
            return (
              <li key={s.id}>
                <button
                  onClick={() => cart.toggle(s.id)}
                  aria-pressed={added}
                  className="group flex w-full items-center gap-4 py-5 text-left transition-colors sm:gap-6"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-2xl transition-colors group-hover:text-rose sm:text-3xl">{s.name}</span>
                      {s.popular && <span className="rounded-full bg-blush px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-rose">Popular</span>}
                    </span>
                    <span className="mt-1 block text-sm text-muted">{s.description}</span>
                  </span>
                  <span className="hidden shrink-0 text-sm text-muted sm:block">{fmtDuration(s.duration)}</span>
                  <span className="shrink-0 text-right font-semibold">{aed(s.price)}</span>
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      added ? 'bg-glow border-transparent text-white' : 'border-line group-hover:border-rose group-hover:text-rose'
                    }`}
                  >
                    {added ? <Check size={18} /> : <Plus size={18} />}
                    <span className="sr-only">{added ? 'Remove from booking' : 'Add to booking'}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
        <div ref={preview} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-10 hidden h-56 w-44 overflow-hidden rounded-[1.75rem] opacity-0 shadow-2xl lg:block">
          <Img name={category.image} sizes="180px" className="h-full w-full object-cover" />
        </div>
      </div>
    </div>
  )
}
