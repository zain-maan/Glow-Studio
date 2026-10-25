import { useLayoutEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Calendar, ExternalLink, Grid, List, LogOut, Refresh, Sparkles, Users } from '../components/icons'
import Img from '../components/Img'
import { Logo } from '../components/Nav'
import { DEMO_ADMIN, signOut } from '../lib/auth'
import { gsap, prefersReducedMotion } from '../lib/motion'
import { resetDemoData } from '../lib/store'
import { fmtDate, today } from '../lib/time'

const NAV = [
  { to: '/admin', label: 'Overview', icon: Grid, end: true },
  { to: '/admin/calendar', label: 'Calendar', icon: Calendar },
  { to: '/admin/appointments', label: 'Appointments', icon: List },
  { to: '/admin/clients', label: 'Clients', icon: Users },
  { to: '/admin/staff', label: 'Team', icon: Sparkles },
]

export default function AdminLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const content = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    if (prefersReducedMotion() || !content.current) return
    gsap.fromTo(content.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
  }, [pathname])

  function reset() {
    if (window.confirm('Reset all demo bookings and clients to the original sample data?')) resetDemoData()
  }

  return (
    <div className="min-h-screen bg-porcelain lg:pl-64">
      {/* Sidebar (desktop) */}
      <aside className="bg-plum-glow fixed inset-y-0 left-0 z-30 hidden w-64 flex-col p-5 text-white lg:flex">
        <Link to="/" className="px-2 py-2" aria-label="Back to the website">
          <Logo light />
        </Link>
        <nav className="mt-10 flex-1 space-y-1" aria-label="Dashboard">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                  isActive ? 'bg-white text-plum shadow-lg' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <n.icon size={18} className={isActive ? 'text-rose' : ''} />
                  {n.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 pt-4 text-sm">
          <Link to="/" className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-white/70 hover:bg-white/10 hover:text-white">
            <ExternalLink size={16} /> View website
          </Link>
          <button onClick={reset} className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-white/70 hover:bg-white/10 hover:text-white">
            <Refresh size={16} /> Reset demo data
          </button>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
          <Img name="layla" sizes="40px" className="h-10 w-10 rounded-full object-cover" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-semibold">{DEMO_ADMIN.name}</p>
            <p className="text-xs text-white/60">Owner</p>
          </div>
          <button
            onClick={() => {
              signOut()
              navigate('/admin/login')
            }}
            className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-porcelain/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" aria-label="Back to the website">
          <Logo />
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={reset} className="rounded-full p-2 text-muted" aria-label="Reset demo data">
            <Refresh size={18} />
          </button>
          <button
            onClick={() => {
              signOut()
              navigate('/admin/login')
            }}
            className="rounded-full p-2 text-muted"
            aria-label="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-muted">{fmtDate(today(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <div ref={content}>
          <Outlet />
        </div>
      </div>

      {/* Bottom tabs (mobile) */}
      <nav className="fixed inset-x-3 bottom-3 z-30 flex justify-between rounded-full bg-plum p-1.5 shadow-2xl lg:hidden" aria-label="Dashboard">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) => `flex flex-1 flex-col items-center gap-0.5 rounded-full py-2 text-[0.65rem] font-semibold transition-colors ${isActive ? 'bg-white text-plum' : 'text-white/70'}`}
          >
            <n.icon size={18} />
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
