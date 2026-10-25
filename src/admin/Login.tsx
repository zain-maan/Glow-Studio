import { useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Lock, Sparkles } from '../components/icons'
import Img from '../components/Img'
import { Logo } from '../components/Nav'
import { DEMO_ADMIN, signIn, useAuth } from '../lib/auth'
import { gsap, prefersReducedMotion } from '../lib/motion'

export default function Login() {
  const signedIn = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/admin'
  // Prefilled so visitors reviewing the portfolio can sign in with one click.
  const [email, setEmail] = useState(DEMO_ADMIN.email)
  const [password, setPassword] = useState(DEMO_ADMIN.password)
  const [error, setError] = useState('')
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('[data-in]', { opacity: 0, y: 24, duration: 0.8, ease: 'power3.out', stagger: 0.08 })
      gsap.from('[data-img]', { scale: 1.2, duration: 1.8, ease: 'expo.out' })
    }, root)
    return () => ctx.revert()
  }, [])

  if (signedIn) return <Navigate to={from} replace />

  function submit(e: FormEvent) {
    e.preventDefault()
    if (signIn(email, password)) navigate(from, { replace: true })
    else setError('That email and password do not match. Use the demo account below.')
  }

  function enterDemo() {
    setEmail(DEMO_ADMIN.email)
    setPassword(DEMO_ADMIN.password)
    signIn(DEMO_ADMIN.email, DEMO_ADMIN.password)
    navigate(from, { replace: true })
  }

  return (
    <div ref={root} className="grid min-h-screen bg-porcelain lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <Img data-img name="interior" priority sizes="50vw" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-plum via-plum/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="font-display text-5xl leading-tight">
            “I can see the whole day in one glance. No more <em className="text-glow">WhatsApp chaos.</em>”
          </p>
          <p className="mt-4 text-white/70">Layla Haddad, owner</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-4 py-16 sm:px-10">
        <div className="w-full max-w-md">
          <Link to="/" data-in aria-label="Back to the website">
            <Logo />
          </Link>
          <h1 data-in className="mt-12 font-display text-5xl leading-none">
            Studio <em className="text-glow">dashboard</em>
          </h1>
          <p data-in className="mt-3 text-muted">Sign in to manage bookings, clients and your team.</p>

          <button data-in onClick={enterDemo} className="mt-8 flex w-full items-center gap-4 rounded-2xl border border-dashed border-rose/50 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg">
            <span className="bg-glow flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white">
              <Sparkles size={20} />
            </span>
            <span className="flex-1">
              <span className="block font-semibold">Explore with the demo account</span>
              <span className="text-sm text-muted">One click, no sign-up</span>
            </span>
            <ArrowRight size={18} className="text-rose" />
          </button>

          <div data-in className="my-8 flex items-center gap-4 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> or sign in <span className="h-px flex-1 bg-line" />
          </div>

          <form data-in onSubmit={submit} className="space-y-4" noValidate>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Email</span>
              <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="field" placeholder={DEMO_ADMIN.email} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">Password</span>
              <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
            </label>
            {error && (
              <p className="text-sm text-rose" role="alert">
                {error}
              </p>
            )}
            <button type="submit" className="btn btn-dark w-full">
              <Lock size={16} /> Sign in
            </button>
            <p className="text-center text-xs text-muted">
              Demo account details are filled in. Just press Sign in.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
