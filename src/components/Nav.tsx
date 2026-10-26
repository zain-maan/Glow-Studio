import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { gsap, prefersReducedMotion, setScrollLocked } from '../lib/motion'
import { ArrowRight, Menu, X } from './icons'

const LINKS = [
  { to: '/services', label: 'Services' },
  { to: '/team', label: 'Our team' },
  { to: '/#packages', label: 'Packages' },
]

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`flex items-center gap-2 ${light ? 'text-white' : 'text-ink'}`}>
      <span className="bg-glow relative h-7 w-7 rounded-full shadow-[0_0_24px_rgba(255,111,145,0.55)]">
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-white/85" />
      </span>
      <span className="font-display text-[1.7rem] leading-none">
        Glow <em className="text-glow">Studio</em>
      </span>
    </span>
  )
}

export default function Nav() {
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const menu = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  useEffect(() => {
    setScrollLocked(open)
    document.body.style.overflow = open ? 'hidden' : ''
    // Unlock on unmount too: tapping "Admin demo" leaves the public site with the menu still open.
    return () => {
      setScrollLocked(false)
      document.body.style.overflow = ''
    }
  }, [open])

  // Menu links rise in one after another.
  useLayoutEffect(() => {
    if (!open || !menu.current || prefersReducedMotion()) return
    const tween = gsap.from(menu.current.querySelectorAll('[data-menu-item]'), { yPercent: 110, opacity: 0, duration: 0.7, ease: 'power4.out', stagger: 0.06, delay: 0.05 })
    return () => void tween.kill()
  }, [open])

  return (
    // Phones: a full-width bar that turns solid on scroll. Larger screens: a floating glass pill.
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-[background-color,box-shadow] duration-500 md:px-5 md:pt-3 ${
        scrolled && !open ? 'bg-porcelain/90 shadow-[0_1px_0_rgba(43,19,48,0.08),0_10px_30px_-20px_rgba(43,19,48,0.35)] backdrop-blur-md md:bg-transparent md:shadow-none md:backdrop-blur-none' : ''
      }`}
    >
      {/* Full-screen menu (phones) */}
      {open && (
        <div id="mobile-menu" ref={menu} className="fixed inset-0 flex flex-col bg-porcelain px-6 pb-8 pt-24 md:hidden">
          <div aria-hidden="true" className="bg-glow pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-30 blur-3xl" />
          <ul className="relative space-y-2">
            {LINKS.map((l) => (
              <li key={l.to} className="overflow-hidden border-b border-line pb-2">
                <Link to={l.to} onClick={() => setOpen(false)} data-menu-item className="flex items-center justify-between font-display text-[2.6rem] leading-tight">
                  {l.label}
                  <ArrowRight size={22} className="text-rose" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="relative mt-auto space-y-3" data-menu-item>
            <Link to="/book" onClick={() => setOpen(false)} className="btn btn-glow w-full">
              Book now
            </Link>
            <Link to="/admin" onClick={() => setOpen(false)} className="btn btn-light w-full">
              Admin demo
            </Link>
          </div>
        </div>
      )}

      <nav
        className={`relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 transition-all duration-500 md:rounded-full md:border md:px-6 ${
          scrolled ? 'md:border-white/70 md:bg-white/55 md:shadow-[0_10px_40px_-20px_rgba(43,19,48,0.45)] md:backdrop-blur-md' : 'md:border-transparent'
        }`}
      >
        <Link to="/" aria-label="Glow Studio home" onClick={() => setOpen(false)}>
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 text-sm font-semibold md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 transition-colors ${isActive && !l.to.includes('#') ? 'bg-white text-plum shadow-sm' : 'hover:bg-white/70'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/admin" className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-plum">
            Admin demo
          </Link>
          <Link to="/book" className="btn btn-glow !py-2.5">
            Book now
          </Link>
        </div>

        <button
          className="-mr-1 flex h-11 w-11 items-center justify-center rounded-full bg-white/70 shadow-sm md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>
    </header>
  )
}
