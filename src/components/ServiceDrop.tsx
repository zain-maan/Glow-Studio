import { useEffect, useRef, useState } from 'react'
import { SERVICES, type Category } from '../data'
import { cart, useCart } from '../lib/cart'
import { prefersReducedMotion } from '../lib/motion'
import { aed } from '../lib/time'
import { Check, Plus } from './icons'

const STYLE: Record<Category, string> = {
  Hair: 'bg-rose text-white',
  Skin: 'bg-mint text-white',
  Nails: 'bg-peach text-plum',
  Makeup: 'bg-orchid text-white',
  Spa: 'bg-plum text-white',
}

// Treatment tags that drop into a pile when the section scrolls into view (Matter.js physics).
// Drag them around on desktop; tap one to add it to the booking basket.
export default function ServiceDrop() {
  const box = useRef<HTMLDivElement>(null)
  const tags = useRef<(HTMLButtonElement | null)[]>([])
  const dragged = useRef(false)
  const { ids } = useCart()
  // With reduced motion there is no physics: the tags simply wrap in rows.
  const [still] = useState(() => prefersReducedMotion())
  const [items] = useState(() => {
    const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches
    return mobile ? SERVICES.filter((s, i) => s.popular || i % 2 === 0).slice(0, 9) : SERVICES
  })

  useEffect(() => {
    const el = box.current
    if (!el || still) return
    let cleanup = () => {}
    let started = false

    const start = () =>
      import('matter-js').then((M) => {
        const { Engine, Bodies, Composite, Body, Mouse, MouseConstraint, Events } = M.default ?? M
        const { width, height } = el.getBoundingClientRect()
        const engine = Engine.create({ gravity: { x: 0, y: 1.1 } })
        const wall = { isStatic: true, render: { visible: false } }
        Composite.add(engine.world, [
          Bodies.rectangle(width / 2, height + 30, width * 2, 60, wall),
          Bodies.rectangle(-30, height / 2, 60, height * 3, wall),
          Bodies.rectangle(width + 30, height / 2, 60, height * 3, wall),
        ])

        // One body per tag, sized to the rendered pill, dropped from above at random spots.
        const bodies = tags.current.map((tag, i) => {
          const w = tag!.offsetWidth
          const h = tag!.offsetHeight
          const b = Bodies.rectangle(w / 2 + Math.random() * Math.max(1, width - w), -h - i * 70 - Math.random() * 120, w, h, {
            chamfer: { radius: h / 2 },
            restitution: 0.35,
            friction: 0.4,
            angle: (Math.random() - 0.5) * 0.6,
          })
          return { b, w, h, tag: tag! }
        })
        Composite.add(engine.world, bodies.map((x) => x.b))

        // Desktop only: on touch screens dragging would hijack page scrolling.
        if (window.matchMedia('(pointer: fine)').matches) {
          const mouse = Mouse.create(el)
          const m = mouse as unknown as { mousewheel: EventListener; element: HTMLElement }
          m.element.removeEventListener('wheel', m.mousewheel)
          m.element.removeEventListener('mousewheel', m.mousewheel)
          const mc = MouseConstraint.create(engine, { mouse, constraint: { stiffness: 0.2, render: { visible: false } } })
          Composite.add(engine.world, mc)
          Events.on(mc, 'startdrag', () => (dragged.current = true))
        }

        let raf = 0
        let last = performance.now()
        const tick = (now: number) => {
          Engine.update(engine, Math.min(32, now - last))
          last = now
          for (const { b, w, h, tag } of bodies) {
            tag.style.transform = `translate(${b.position.x - w / 2}px, ${b.position.y - h / 2}px) rotate(${b.angle}rad)`
            // Anything that escapes the box comes back in from the top.
            if (b.position.y > height + 200) Body.setPosition(b, { x: width / 2, y: -100 })
          }
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
        el.dataset.live = 'true'
        cleanup = () => {
          cancelAnimationFrame(raf)
          Engine.clear(engine)
          Composite.clear(engine.world, false)
        }
      })

    // Drop the tags the first time the section is properly in view.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          started = true
          start()
          io.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cleanup()
    }
  }, [items, still])

  return (
    <div ref={box} className={`group/drop relative overflow-hidden rounded-[2rem] border border-line bg-white/60 ${still ? 'flex flex-wrap justify-center gap-3 p-6 pt-16' : 'h-[26rem] sm:h-[30rem]'}`}>
      <p className="pointer-events-none absolute inset-x-0 top-6 text-center text-sm text-muted">
        <span className="hidden sm:inline">Drag them around. </span>Tap a treatment to add it to your booking.
      </p>
      {items.map((s, i) => {
        const on = ids.includes(s.id)
        return (
          <button
            key={s.id}
            ref={(n) => {
              tags.current[i] = n
            }}
            onPointerDown={() => (dragged.current = false)}
            onClick={() => {
              if (!dragged.current) cart.toggle(s.id)
            }}
            aria-pressed={on}
            // Before the physics starts (or with reduced motion) the tags simply wrap in a row.
            className={`${still ? 'relative' : 'absolute left-0 top-0'} flex select-none items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg transition-[box-shadow] sm:px-5 sm:py-3 sm:text-base ${STYLE[s.category]} ${
              on ? 'ring-4 ring-plum/30 ring-offset-2' : ''
            } group-data-[live=true]/drop:will-change-transform`}
            style={still ? undefined : { transform: `translate(${(i % 3) * 33}%, -200px)` }}
          >
            {on ? <Check size={16} /> : <Plus size={16} />}
            {s.name}
            <span className="font-normal opacity-75">{aed(s.price)}</span>
          </button>
        )
      })}
    </div>
  )
}
