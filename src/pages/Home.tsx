import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import CoverReveal from '../components/CoverReveal'
import Faq from '../components/Faq'
import GlowBubble from '../components/GlowBubble'
import { ArrowRight, Calendar, Check, Heart, Scissors, Sparkles, Star } from '../components/icons'
import Img from '../components/Img'
import Marquee from '../components/Marquee'
import ServiceDrop from '../components/ServiceDrop'
import ServiceMenu from '../components/ServiceMenu'
import { CATEGORIES, PACKAGES, SERVICES, STAFF, TESTIMONIALS, serviceById, staffById } from '../data'
import { useReveal } from '../hooks/useReveal'
import { cart } from '../lib/cart'
import { gsap, introDelay, prefersReducedMotion } from '../lib/motion'
import { nextFreeSlot, useDb } from '../lib/store'
import { aed, fmtDuration, fmtTime, relativeDay } from '../lib/time'

const WORDS = ['hair', 'skin', 'nails', 'mood']

const STEPS = [
  { icon: Scissors, title: 'Pick your services', text: 'Mix and match anything from the menu. We add up the time and price as you go.' },
  { icon: Calendar, title: 'Choose a real time', text: 'See live availability for every stylist. No calls, no waiting for a reply.' },
  { icon: Sparkles, title: 'Walk in, glow out', text: 'Get a reminder the day before. Free valet is waiting when you arrive.' },
]

function NextSlotChip() {
  useDb() // re-render when bookings change
  const slot = nextFreeSlot(60)
  if (!slot) return null
  const who = staffById(slot.staffId)!
  return (
    <span className="glass inline-flex items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-sm shadow-sm">
      <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-mint/15">
        <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-mint/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-mint" />
      </span>
      Next free slot: <strong>{relativeDay(slot.date)}, {fmtTime(slot.start)}</strong>
      <span className="hidden text-muted sm:inline">with {who.name.split(' ')[0]}</span>
    </span>
  )
}

export default function Home() {
  const root = useRef<HTMLDivElement>(null)
  const hero = useRef<HTMLElement>(null)
  const word = useRef<HTMLSpanElement>(null)
  const [wordIndex, setWordIndex] = useState(0)
  const [openCat, setOpenCat] = useState(0)
  const { hash } = useLocation()
  const navigate = useNavigate()
  useReveal(root)

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: introDelay(0.1) })
      tl.from('[data-hero-line]', { yPercent: 115, duration: 1.3, ease: 'power4.out', stagger: 0.12 })
        .from('[data-hero-fade]', { opacity: 0, y: 24, duration: 1, ease: 'power3.out', stagger: 0.1 }, 0.5)
        .fromTo('[data-hero-arch]', { clipPath: 'inset(100% 0 0 0 round 999px 999px 40px 40px)' }, { clipPath: 'inset(0% 0 0 0 round 999px 999px 40px 40px)', duration: 1.5, ease: 'expo.inOut' }, 0.1)
        .from('[data-hero-arch] img', { scale: 1.4, duration: 2, ease: 'expo.out' }, 0.3)
        .from('[data-hero-float]', { opacity: 0, scale: 0.6, y: 40, duration: 1, ease: 'back.out(1.6)', stagger: 0.15 }, 0.9)

      if (window.matchMedia('(pointer: fine)').matches) {
        const layers = gsap.utils.toArray<HTMLElement>('[data-depth]')
        const onMove = (e: PointerEvent) => {
          const dx = e.clientX / window.innerWidth - 0.5
          const dy = e.clientY / window.innerHeight - 0.5
          layers.forEach((l) => {
            const d = Number(l.dataset.depth)
            gsap.to(l, { x: dx * d, y: dy * d, duration: 1.2, ease: 'power3.out' })
          })
        }
        hero.current!.addEventListener('pointermove', onMove)
        return () => hero.current?.removeEventListener('pointermove', onMove)
      }
    }, hero)
    return () => ctx.revert()
  }, [])

  // Rotating word in the headline.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (prefersReducedMotion() || !word.current) return setWordIndex((i) => (i + 1) % WORDS.length)
      gsap.to(word.current, {
        yPercent: -100,
        opacity: 0,
        duration: 0.45,
        ease: 'power3.in',
        onComplete: () => {
          setWordIndex((i) => (i + 1) % WORDS.length)
          gsap.fromTo(word.current, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out' })
        },
      })
    }, 2600)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!hash) return
    const t = window.setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' }), 200)
    return () => window.clearTimeout(t)
  }, [hash])

  return (
    <div ref={root}>
      {/* Hero */}
      <section ref={hero} className="relative overflow-hidden pb-14 pt-24 sm:pb-20 sm:pt-28 lg:min-h-[100svh] lg:pb-10 lg:pt-32">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="animate-blob absolute -left-[15%] top-[20%] h-[55vmax] w-[55vmax] rounded-full bg-[radial-gradient(circle,rgba(255,177,153,0.5),transparent_62%)]" />
          <span className="animate-blob absolute -right-[10%] -top-[25%] h-[60vmax] w-[60vmax] rounded-full bg-[radial-gradient(circle,rgba(200,109,215,0.3),transparent_62%)] [animation-delay:-5s]" />
          <span className="animate-blob absolute bottom-[-30%] left-[35%] h-[45vmax] w-[45vmax] rounded-full bg-[radial-gradient(circle,rgba(255,111,145,0.22),transparent_62%)] [animation-delay:-10s]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <div data-hero-fade>
              <NextSlotChip />
            </div>
            <h1 className="mt-6 font-display text-[clamp(3.6rem,9vw,8rem)] leading-[0.92] tracking-tight">
              <span className="block overflow-hidden pb-2">
                <span data-hero-line className="block">Glow up,</span>
              </span>
              <span className="block overflow-hidden pb-3">
                <span data-hero-line className="block">
                  your <span ref={word} className="text-glow inline-block pr-3 italic">{WORDS[wordIndex]}.</span>
                </span>
              </span>
            </h1>
            <p data-hero-fade className="mt-5 max-w-lg text-base text-muted sm:mt-6 sm:text-lg">
              Hair, skin, nails and spa by Dubai's friendliest experts. See real availability and book in under a minute.
            </p>
            <div data-hero-fade className="mt-7 grid grid-cols-[1fr_auto] gap-3 sm:mt-9 sm:flex sm:flex-wrap sm:items-center">
              <Link to="/book" className="btn btn-glow !px-6 !py-4 text-base sm:!px-7">
                <span className="sm:hidden">Book now</span>
                <span className="hidden sm:inline">Book an appointment</span> <ArrowRight size={18} />
              </Link>
              <Link to="/services" className="btn btn-ghost !px-6 !py-4 text-base sm:!px-7">
                View prices
              </Link>
            </div>
            <div data-hero-fade className="mt-8 flex items-center gap-4 sm:mt-10">
              <div className="flex -space-x-3">
                {STAFF.slice(0, 4).map((s) => (
                  <Img key={s.id} name={s.image} sizes="48px" className="h-11 w-11 rounded-full border-2 border-porcelain object-cover" />
                ))}
              </div>
              <div className="text-sm">
                <p className="flex items-center gap-1 font-semibold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" className="text-gold" />
                  ))}
                  <span className="ml-1">4.9</span>
                </p>
                <p className="text-muted">from 1,300+ Google reviews</p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[20rem] sm:max-w-md lg:max-w-none">
            {/* 3D glow bubble behind the arch (WebGL, loads after the page) */}
            <GlowBubble className="absolute -right-[2%] -top-[7%] aspect-square w-[58%] sm:-right-[6%] sm:w-[52%]" />
            <div data-depth="18" className="relative mx-auto w-[78%]">
              <div data-hero-arch className="aspect-[3/4] overflow-hidden rounded-t-full rounded-b-[2.5rem] shadow-[0_40px_80px_-40px_rgba(43,19,48,0.6)]">
                <Img name="hero" priority sizes="(min-width: 1024px) 35vw, 75vw" alt="Stylist finishing glossy, wavy hair" className="h-full w-full object-cover" />
              </div>
            </div>
            <div data-depth="-30" className="absolute -left-2 top-[12%] sm:-left-6">
              <div data-hero-float>
                <div className="animate-float h-20 w-20 overflow-hidden rounded-full border-4 border-white shadow-xl sm:h-36 sm:w-36">
                  <Img name="nails" sizes="150px" className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
            <div data-depth="-22" className="absolute -right-1 bottom-[16%] sm:-right-4">
              <div data-hero-float>
                <div className="glass animate-float flex items-center gap-2.5 rounded-2xl p-2 pr-3 shadow-xl [animation-delay:-3s] sm:gap-3 sm:p-3 sm:pr-5">
                  <Img name="facial" sizes="64px" className="h-11 w-11 rounded-xl object-cover sm:h-14 sm:w-14" />
                  <div>
                    <p className="text-xs text-muted">Most booked</p>
                    <p className="font-display text-base leading-tight sm:text-xl">HydraGlow facial</p>
                    <p className="text-xs font-semibold text-rose">{aed(450)} · 60 min</p>
                  </div>
                </div>
              </div>
            </div>
            <div data-depth="-12" className="absolute -bottom-6 left-[6%] hidden sm:block">
              <div data-hero-float>
                <svg viewBox="0 0 120 120" className="animate-spin-slow h-28 w-28" aria-hidden="true">
                  <defs>
                    <path id="circle" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0" />
                  </defs>
                  <circle cx="60" cy="60" r="58" fill="#2b1330" />
                  <text fontSize="11.5" fontWeight="700" letterSpacing="3" fill="white">
                    <textPath href="#circle">BOOK ONLINE • OPEN LATE • GLOW •</textPath>
                  </text>
                  <circle cx="60" cy="60" r="12" fill="url(#g2)" />
                  <linearGradient id="g2" x1="0" x2="1">
                    <stop offset="0" stopColor="#ffb199" />
                    <stop offset="1" stopColor="#c86dd7" />
                  </linearGradient>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      {/* Categories: panels that widen on hover (desktop) */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="eyebrow" data-reveal>What we do</p>
            <h2 data-split className="mt-4 font-display text-[2.6rem] leading-[1.02] sm:text-6xl">
              Five rooms, one <em className="text-glow">feeling.</em>
            </h2>
          </div>
          <Link to="/services" className="btn btn-ghost" data-reveal>
            Full price list <ArrowRight size={16} />
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:mt-12 lg:h-[30rem] lg:overflow-visible lg:px-0 lg:pb-0" data-reveal>
          {CATEGORIES.map((c, i) => {
            const active = openCat === i
            const from = Math.min(...SERVICES.filter((s) => s.category === c.id).map((s) => s.price))
            return (
              <button
                key={c.id}
                onMouseEnter={() => setOpenCat(i)}
                onFocus={() => setOpenCat(i)}
                onClick={() => navigate(`/services?cat=${c.id}`)}
                className={`group relative h-[22rem] w-[72%] shrink-0 snap-center overflow-hidden rounded-[2rem] text-left text-white transition-[flex-grow] duration-700 ease-[cubic-bezier(.65,0,.35,1)] sm:w-[42%] lg:h-full lg:w-auto lg:shrink ${
                  active ? 'lg:flex-[4]' : 'lg:flex-[1]'
                }`}
              >
                <Img name={c.image} sizes="(min-width: 1024px) 45vw, 100vw" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-plum/85 via-plum/20 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-6">
                  <span className="font-display text-4xl">{c.id}</span>
                  <span className={`mt-2 block max-w-xs text-sm text-white/80 transition-all duration-500 lg:max-h-0 lg:opacity-0 ${active ? 'lg:max-h-24 lg:opacity-100' : ''}`}>
                    {c.blurb} From {aed(from)}.
                  </span>
                </span>
                <span className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-md transition-transform duration-500 group-hover:-rotate-45">
                  <ArrowRight size={18} />
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-plum-glow relative overflow-hidden py-24 text-white lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="eyebrow !text-peach" data-reveal>How it works</p>
          <h2 data-split className="mt-4 max-w-3xl font-display text-[2.6rem] leading-[1.02] sm:text-6xl">
            Booking takes less time than <em className="text-glow">choosing a nail colour.</em>
          </h2>
          <ol className="mt-10 grid gap-4 sm:mt-16 sm:gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} data-reveal={i * 0.12} className="group relative rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors duration-500 hover:bg-white/10 sm:p-8">
                <span className="absolute right-6 top-4 font-display text-7xl italic text-white/10">0{i + 1}</span>
                <span className="bg-glow flex h-14 w-14 items-center justify-center rounded-2xl shadow-[0_10px_30px_-10px_rgba(255,111,145,0.8)] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
                  <s.icon size={24} />
                </span>
                <h3 className="mt-8 font-display text-3xl">{s.title}</h3>
                <p className="mt-3 text-white/70">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Pick and mix: physics tags */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-24 lg:pt-32">
        <div className="mb-8 max-w-2xl">
          <p className="eyebrow" data-reveal>Pick and mix</p>
          <h2 data-split className="mt-4 font-display text-[2.6rem] leading-[1.02] sm:text-6xl">
            Build your <em className="text-glow">glow day.</em>
          </h2>
        </div>
        <ServiceDrop />
      </section>

      {/* Price list */}
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.6fr] lg:py-32">
        <div className="min-w-0 lg:sticky lg:top-32 lg:self-start">
          <p className="eyebrow" data-reveal>Menu</p>
          <h2 data-split className="mt-4 font-display text-[2.6rem] leading-[1.02] sm:text-6xl">
            Tap to add, <em className="text-glow">book in one go.</em>
          </h2>
          <p className="mt-5 text-muted" data-reveal>
            Add as many services as you like. Your basket follows you around the site and we find a stylist who can do them back to back.
          </p>
          <div className="mt-8 hidden overflow-hidden rounded-[2rem] lg:block" data-reveal-img>
            <Img name="interior" sizes="30vw" className="aspect-[4/3] w-full object-cover" />
          </div>
        </div>
        <div data-reveal className="min-w-0">
          <ServiceMenu />
        </div>
      </section>

      {/* Team */}
      <section className="bg-blush/60 py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow" data-reveal>The team</p>
              <h2 data-split className="mt-4 font-display text-[2.6rem] leading-[1.02] sm:text-6xl">
                Hands you can <em className="text-glow">trust.</em>
              </h2>
            </div>
            <Link to="/team" className="btn btn-ghost" data-reveal>
              Meet everyone <ArrowRight size={16} />
            </Link>
          </div>
          <div className="no-scrollbar -mx-4 mt-12 flex snap-x gap-5 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0">
            {STAFF.map((s, i) => (
              <Link key={s.id} to={`/book?staff=${s.id}`} data-reveal={i * 0.08} data-skew className="group w-60 shrink-0 snap-start lg:w-auto">
                <div className="relative overflow-hidden rounded-t-full rounded-b-[2rem]">
                  <Img name={s.image} sizes="(min-width: 1024px) 18vw, 240px" className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <span className="absolute inset-0 bg-gradient-to-t from-plum/80 via-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="absolute inset-x-4 bottom-4 translate-y-4 text-center text-sm font-semibold text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                    Book with {s.name.split(' ')[0]} →
                  </span>
                </div>
                <p className="mt-4 font-display text-2xl">{s.name}</p>
                <p className="text-sm text-muted">{s.role}</p>
                <p className="mt-1 flex items-center gap-1 text-sm font-semibold">
                  <Star size={13} fill="currentColor" className="text-gold" /> {s.rating}
                  <span className="font-normal text-muted">({s.reviews})</span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CoverReveal />

      {/* Packages */}
      <section id="packages" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6 lg:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow justify-center" data-reveal>Packages</p>
          <h2 data-split className="mt-4 font-display text-[2.6rem] leading-[1.02] sm:text-6xl">
            Better <em className="text-glow">together.</em>
          </h2>
          <p className="mt-4 text-muted" data-reveal>Our favourite combinations, priced lower than booking each one separately.</p>
        </div>
        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
          {PACKAGES.map((p, i) => {
            const items = p.services.map((id) => serviceById(id)!)
            const duration = items.reduce((n, s) => n + s.duration, 0)
            return (
              <div key={p.id} data-reveal={i * 0.1} className={`rounded-[2.2rem] p-[1.5px] ${p.featured ? 'bg-glow lg:-translate-y-4' : 'bg-line'}`}>
                <div className={`flex h-full flex-col rounded-[2.1rem] p-8 ${p.featured ? 'bg-plum text-white' : 'bg-white'}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-display text-3xl">{p.name}</p>
                    {p.featured && <span className="bg-glow rounded-full px-3 py-1 text-xs font-bold">Most loved</span>}
                  </div>
                  <p className="mt-6 font-display text-6xl">
                    {aed(p.price).replace('AED ', '')}
                    <span className={`ml-2 font-sans text-sm ${p.featured ? 'text-white/60' : 'text-muted'}`}>AED · {fmtDuration(duration)}</span>
                  </p>
                  <p className="mt-1 text-sm font-semibold text-rose">{p.note}</p>
                  <ul className="mt-6 flex-1 space-y-3 text-sm">
                    {items.map((s) => (
                      <li key={s.id} className="flex items-center gap-3">
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full ${p.featured ? 'bg-white/10' : 'bg-blush'}`}>
                          <Check size={13} className="text-rose" />
                        </span>
                        {s.name}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      cart.add(p.services)
                      navigate('/book')
                    }}
                    className={`btn mt-8 w-full ${p.featured ? 'btn-glow' : 'btn-dark'}`}
                  >
                    Book this package
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[2rem] bg-line md:grid-cols-4">
          {[
            { v: '12', s: 'k+', l: 'Happy clients' },
            { v: '4.9', s: '★', l: 'Average rating' },
            { v: '15', s: '', l: 'Treatments' },
            { v: '7', s: ' days', l: 'Open every week' },
          ].map((x, i) => (
            <div key={x.l} className="flex flex-col-reverse bg-white p-6 sm:p-8" data-reveal={i * 0.08}>
              <dt className="mt-1 text-sm text-muted">{x.l}</dt>
              <dd className="font-display text-5xl sm:text-6xl">
                <span data-count={x.v}>{x.v}</span>
                <span className="text-glow">{x.s}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Reviews */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:py-32">
        <div className="max-w-2xl">
          <p className="eyebrow" data-reveal>Kind words</p>
          <h2 data-split className="mt-4 font-display text-[2.6rem] leading-[1.02] sm:text-6xl">
            Clients leave <em className="text-glow">glowing.</em>
          </h2>
        </div>
        <div className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 md:mx-0 md:mt-14 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0 md:pb-0">
          {TESTIMONIALS.map((t, i) => (
            <figure key={t.name} data-reveal={i * 0.12} className={`card flex w-[85%] shrink-0 snap-center flex-col p-7 transition-transform duration-500 hover:-translate-y-2 sm:p-8 md:w-auto ${i === 1 ? 'md:translate-y-10' : ''}`}>
              <Heart size={22} className="text-rose" fill="currentColor" />
              <blockquote className="mt-5 flex-1 font-display text-2xl leading-snug">“{t.quote}”</blockquote>
              <figcaption className="mt-8 flex items-center gap-3">
                <Img name={t.image} sizes="48px" className="h-12 w-12 rounded-full object-cover" />
                <span className="text-sm">
                  <span className="block font-semibold">{t.name}</span>
                  <span className="text-muted">{t.service}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Studio + FAQ */}
      <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 sm:px-6 sm:pb-24 lg:grid-cols-2 lg:pb-32">
        <div className="grid grid-cols-2 gap-4">
          <div className="overflow-hidden rounded-[2rem]" data-reveal-img>
            <Img name="interior-bright" sizes="25vw" className="aspect-[3/4] h-full w-full object-cover" />
          </div>
          <div className="mt-12 overflow-hidden rounded-[2rem]" data-reveal-img="0.15">
            <Img name="products" sizes="25vw" className="aspect-[3/4] h-full w-full object-cover" />
          </div>
        </div>
        <div>
          <p className="eyebrow" data-reveal>Good to know</p>
          <h2 data-split className="mb-8 mt-4 font-display text-5xl leading-[1.02]">
            Questions, <em className="text-glow">answered.</em>
          </h2>
          <Faq />
        </div>
      </section>
    </div>
  )
}
