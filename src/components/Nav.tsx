import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { setScrollLocked } from '../lib/motion'
import { Menu, X } from './icons'

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
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5">
      <nav
        className={`mx-auto flex h-16 max-w-7xl items-center justify-between rounded-full px-4 transition-all duration-500 sm:px-6 ${
          scrolled || open ? 'glass shadow-[0_10px_40px_-20px_rgba(43,19,48,0.45)]' : ''
        }`}
      >
        <Link to="/" aria-label="Glow Studio home">
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
          className="-mr-1 rounded-full p-2 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="glass mx-auto mt-2 max-w-7xl rounded-3xl p-6 md:hidden">
          <ul className="space-y-4">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} onClick={() => setOpen(false)} className="font-display text-4xl">
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/admin" className="font-display text-4xl text-muted">
                Admin demo
              </Link>
            </li>
          </ul>
          <Link to="/book" className="btn btn-glow mt-8 w-full">
            Book now
          </Link>
        </div>
      )}
    </header>
  )
}
