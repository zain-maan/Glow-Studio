import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Calendar, Check, CheckCircle2, Clock, Sparkles, Star } from '../components/icons'
import Img from '../components/Img'
import { CATEGORIES, SERVICES, STAFF, staffById, type Category } from '../data'
import { cart, useCart } from '../lib/cart'
import { gsap, prefersReducedMotion, scrollToElement, scrollToTop } from '../lib/motion'
import { availableSlots, canDo, createBooking, useDb, type Appointment, type Segment } from '../lib/store'
import { addDays, aed, fmtDate, fmtDuration, fmtTime, fromISO, today } from '../lib/time'

const STEPS = ['Services', 'Specialist', 'Date & time', 'Your details']
const DAYS_AHEAD = 21

type Details = { name: string; phone: string; email: string; notes: string }

function icsFile(a: Appointment, title: string) {
  const d = a.date.replace(/-/g, '')
  const t = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}${String(m % 60).padStart(2, '0')}00`
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Glow Studio//Booking//EN',
    'BEGIN:VEVENT',
    `UID:${a.id}@glowstudio.example`,
    `DTSTART:${d}T${t(a.start)}`,
    `DTEND:${d}T${t(a.start + a.duration)}`,
    `SUMMARY:${title}`,
    'LOCATION:Glow Studio, Jumeirah Beach Road, Dubai',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export default function Book() {
  useDb() // availability re-computes when bookings change
  const [params] = useSearchParams()
  const { ids, services, duration, total } = useCart()
  const [step, setStep] = useState(0)
  const [staffId, setStaffId] = useState<string>(() => (staffById(params.get('staff') ?? '') ? params.get('staff')! : 'any'))
  const [date, setDate] = useState<string | null>(null)
  const [slot, setSlot] = useState<{ start: number; plan: Segment[] } | null>(null)
  const [details, setDetails] = useState<Details>({ name: '', phone: '', email: '', notes: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof Details, string>>>({})
  const [booked, setBooked] = useState<Appointment[] | null>(null)
  const panel = useRef<HTMLDivElement>(null)
  const categories = useMemo(() => [...new Set(services.map((s) => s.category))] as Category[], [services])

  // A preselected stylist who can't do any of the chosen services falls back to "anyone".
  useEffect(() => {
    if (staffId !== 'any' && categories.length && !categories.some((c) => canDo(staffId, c))) setStaffId('any')
  }, [categories, staffId])

  // Changing services or stylist invalidates the chosen time.
  useEffect(() => setSlot(null), [ids.length, staffId, date])

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !panel.current) return
    gsap.fromTo(panel.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' })
  }, [step, booked])

  const days = useMemo(
    () =>
      Array.from({ length: DAYS_AHEAD }, (_, i) => {
        const d = addDays(today(), i)
        return { date: d, slots: duration ? availableSlots(d, ids, staffId).length : 0 }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids, staffId, booked],
  )

  useEffect(() => {
    if (step === 2 && (!date || !days.find((d) => d.date === date)?.slots)) setDate(days.find((d) => d.slots)?.date ?? null)
  }, [step, days, date])

  const slots = date ? availableSlots(date, ids, staffId) : []
  const groups = [
    { label: 'Morning', items: slots.filter((s) => s.start < 720) },
    { label: 'Afternoon', items: slots.filter((s) => s.start >= 720 && s.start < 1020) },
    { label: 'Evening', items: slots.filter((s) => s.start >= 1020) },
  ]
  const team = slot ? [...new Set(slot.plan.map((p) => p.staffId))].map((id) => staffById(id)!) : staffId !== 'any' ? [staffById(staffId)!] : []
  const canNext = [services.length > 0, true, !!slot, true][step]

  function go(n: number) {
    setStep(n)
    scrollToTop()
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const errs: typeof errors = {}
    if (details.name.trim().length < 2) errs.name = 'Please enter your name.'
    if (details.phone.replace(/\D/g, '').length < 8) errs.phone = 'Please enter a mobile number we can text.'
    if (!/^\S+@\S+\.\S+$/.test(details.email)) errs.email = 'Please enter a valid email.'
    setErrors(errs)
    if (Object.keys(errs).length || !slot || !date) return
    setBooked(createBooking({ ...details, date, plan: slot.plan }))
    cart.clear()
    scrollToTop()
  }

  if (booked) {
    const first = booked[0]
    const last = booked[booked.length - 1]
    const people = [...new Set(booked.map((b) => b.staffId))].map((id) => staffById(id)!)
    const title = `Glow Studio with ${people.map((p) => p.name.split(' ')[0]).join(' & ')}`
    const visit = { ...first, duration: last.start + last.duration - first.start }
    return (
      <section className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 lg:pt-40">
        <div aria-hidden="true" className="animate-blob pointer-events-none absolute left-1/2 top-0 h-[60vmax] w-[60vmax] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,111,145,0.25),transparent_60%)]" />
        <div ref={panel} className="relative mx-auto max-w-xl text-center">
          <span className="bg-glow mx-auto flex h-20 w-20 items-center justify-center rounded-full text-white shadow-[0_20px_50px_-15px_rgba(255,111,145,0.9)]">
            <Check size={38} />
          </span>
          <p className="eyebrow mt-8 justify-center">You're booked</p>
          <h1 className="mt-3 font-display text-6xl leading-none">
            See you soon, <em className="text-glow">{details.name.split(' ')[0]}.</em>
          </h1>
          <p className="mt-4 text-muted">We've saved your appointment and sent a confirmation to {details.email}.</p>

          <div className="card mt-10 p-6 text-left">
            <div className="border-b border-line pb-5">
              <p className="font-display text-3xl">{fmtDate(first.date, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              <p className="text-sm text-muted">
                {fmtTime(visit.start)} – {fmtTime(visit.start + visit.duration)} · {fmtDuration(visit.duration)}
              </p>
            </div>
            <ul className="space-y-4 py-5 text-sm">
              {booked.map((b) => {
                const who = staffById(b.staffId)!
                return (
                  <li key={b.id} className="flex items-center gap-3">
                    <Img name={who.image} sizes="44px" className="h-11 w-11 rounded-full object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{b.serviceIds.map((id) => SERVICES.find((x) => x.id === id)!.name).join(' + ')}</span>
                      <span className="text-muted">
                        {fmtTime(b.start)} with {who.name}
                      </span>
                    </span>
                    <span className="text-muted">{aed(b.price)}</span>
                  </li>
                )
              })}
            </ul>
            <p className="flex justify-between border-t border-line pt-4 font-semibold">
              <span>Pay at the studio</span>
              <span>{aed(booked.reduce((n, b) => n + b.price, 0))}</span>
            </p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              className="btn btn-dark"
              download="glow-studio-appointment.ics"
              href={`data:text/calendar;charset=utf-8,${encodeURIComponent(icsFile(visit, title))}`}
            >
              <Calendar size={16} /> Add to calendar
            </a>
            <Link to="/admin/calendar" className="btn btn-ghost">
              See it in the studio dashboard
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted">Demo booking: it is saved in this browser only and no message was sent.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-x-clip px-4 pb-32 pt-28 sm:px-6 lg:pt-36">
      <div aria-hidden="true" className="animate-blob pointer-events-none absolute -right-[20%] top-0 h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle,rgba(200,109,215,0.18),transparent_60%)]" />
      <div className="relative mx-auto max-w-6xl">
        <p className="eyebrow">Online booking</p>
        <h1 className="mt-3 font-display text-5xl leading-none sm:text-6xl">
          Book your <em className="text-glow">glow.</em>
        </h1>

        <ol className="mt-8 flex gap-2 sm:gap-3" aria-label="Booking steps">
          {STEPS.map((label, i) => {
            const reachable = i <= step || (i === step + 1 && canNext)
            return (
              <li key={label} className="flex-1">
                <button
                  disabled={!reachable || i > step}
                  onClick={() => go(i)}
                  aria-current={i === step ? 'step' : undefined}
                  className="w-full text-left disabled:cursor-default"
                >
                  <span className="block h-1.5 overflow-hidden rounded-full bg-line">
                    <span className={`bg-glow block h-full rounded-full transition-all duration-700 ${i < step ? 'w-full' : i === step ? 'w-1/2' : 'w-0'}`} />
                  </span>
                  <span className={`mt-2 flex items-center gap-1.5 text-xs font-semibold sm:text-sm ${i === step ? 'text-ink' : 'text-muted'}`}>
                    {i < step ? <Check size={14} className="text-rose" /> : <span className="hidden sm:inline">{i + 1}.</span>}
                    {label}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="min-w-0">
            <div ref={panel}>
              {step === 0 && (
                <div>
                  <h2 className="font-display text-4xl">What are we doing today?</h2>
                  <p className="mt-1 text-muted">Pick one or more. You can change this later.</p>
                  {/* Phones: jump straight to a category in the long list */}
                  <div className="no-scrollbar sticky top-[5.25rem] z-10 -mx-4 mt-5 flex gap-2 overflow-x-auto bg-porcelain/90 px-4 py-2 backdrop-blur lg:hidden">
                    {CATEGORIES.map((c) => {
                      const picked = services.filter((s) => s.category === c.id).length
                      return (
                        <button key={c.id} onClick={() => scrollToElement(`#cat-${c.id}`, -150)} className="chip shrink-0 !py-1.5">
                          {c.id}
                          {picked > 0 && <span className="bg-glow flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] text-white">{picked}</span>}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-6 space-y-8">
                    {CATEGORIES.map((c) => (
                      <div key={c.id} id={`cat-${c.id}`}>
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted">{c.id}</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {SERVICES.filter((s) => s.category === c.id).map((s) => {
                            const on = ids.includes(s.id)
                            return (
                              <button
                                key={s.id}
                                onClick={() => cart.toggle(s.id)}
                                aria-pressed={on}
                                className={`flex items-center gap-4 rounded-2xl border bg-white p-4 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                                  on ? 'border-rose shadow-[0_12px_30px_-18px_rgba(255,111,145,0.9)]' : 'border-line hover:border-petal'
                                }`}
                              >
                                <span className="min-w-0 flex-1">
                                  <span className="block font-semibold">{s.name}</span>
                                  <span className="text-sm text-muted">
                                    {fmtDuration(s.duration)} · {aed(s.price)}
                                  </span>
                                </span>
                                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${on ? 'bg-glow border-transparent text-white' : 'border-line'}`}>
                                  {on && <Check size={15} />}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="font-display text-4xl">Who would you like?</h2>
                  <p className="mt-1 text-muted">If one person can't do everything, we pair them with another specialist back to back.</p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => setStaffId('any')}
                      aria-pressed={staffId === 'any'}
                      className={`flex items-center gap-4 rounded-2xl border bg-white p-4 text-left transition-all ${staffId === 'any' ? 'border-rose shadow-[0_12px_30px_-18px_rgba(255,111,145,0.9)]' : 'border-line hover:border-petal'}`}
                    >
                      <span className="bg-glow flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white">
                        <Sparkles size={26} />
                      </span>
                      <span>
                        <span className="block font-semibold">Anyone available</span>
                        <span className="text-sm text-muted">Most choice of times</span>
                      </span>
                    </button>
                    {STAFF.map((s) => {
                      const does = categories.filter((c) => canDo(s.id, c))
                      const able = does.length > 0
                      return (
                        <button
                          key={s.id}
                          disabled={!able}
                          onClick={() => setStaffId(s.id)}
                          aria-pressed={staffId === s.id}
                          className={`flex items-center gap-4 rounded-2xl border bg-white p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45 ${
                            staffId === s.id ? 'border-rose shadow-[0_12px_30px_-18px_rgba(255,111,145,0.9)]' : 'border-line hover:border-petal'
                          }`}
                        >
                          <Img name={s.image} sizes="64px" className="h-16 w-16 shrink-0 rounded-full object-cover" />
                          <span className="min-w-0">
                            <span className="block font-semibold">{s.name}</span>
                            <span className="block text-sm text-muted">{!able ? `Doesn't do ${categories.join(', ')}` : does.length < categories.length ? `Will do your ${does.join(' & ')}` : s.role}</span>
                            <span className="mt-0.5 flex items-center gap-1 text-xs font-semibold">
                              <Star size={12} fill="currentColor" className="text-gold" /> {s.rating}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="font-display text-4xl">Pick a time</h2>
                  <p className="mt-1 text-muted">Live availability for {fmtDuration(duration)}{staffId !== 'any' ? ` with ${staffById(staffId)!.name.split(' ')[0]}` : ''}.</p>
                  <div className="no-scrollbar -mx-4 mt-6 flex snap-x gap-2 overflow-x-auto px-4 pb-2" role="listbox" aria-label="Choose a day">
                    {days.map((d) => {
                      const on = d.date === date
                      const dt = fromISO(d.date)
                      return (
                        <button
                          key={d.date}
                          role="option"
                          aria-selected={on}
                          disabled={!d.slots}
                          onClick={() => setDate(d.date)}
                          className={`flex w-[4.5rem] shrink-0 snap-start flex-col items-center rounded-2xl border py-3 transition-all disabled:opacity-35 ${
                            on ? 'border-transparent bg-plum text-white shadow-lg' : 'border-line bg-white hover:border-petal'
                          }`}
                        >
                          <span className="text-[0.7rem] font-bold uppercase tracking-wider opacity-70">{d.date === today() ? 'Today' : dt.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                          <span className="font-display text-3xl leading-tight">{dt.getDate()}</span>
                          <span className={`text-[0.65rem] ${on ? 'text-peach' : d.slots ? 'text-mint' : 'text-muted'}`}>{d.slots ? `${d.slots} ${d.slots === 1 ? 'slot' : 'slots'}` : 'Full'}</span>
                        </button>
                      )
                    })}
                  </div>

                  {date && (
                    <div className="mt-6 space-y-6">
                      {groups.map(
                        (g) =>
                          g.items.length > 0 && (
                            <div key={g.label}>
                              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted">{g.label}</p>
                              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                {g.items.map((s) => {
                                  const on = slot?.start === s.start
                                  return (
                                    <button
                                      key={s.start}
                                      onClick={() => setSlot({ start: s.start, plan: s.plan })}
                                      aria-pressed={on}
                                      className={`rounded-xl border py-2.5 text-sm font-semibold transition-all ${on ? 'bg-glow border-transparent text-white shadow-md' : 'border-line bg-white hover:border-rose hover:text-rose'}`}
                                    >
                                      {fmtTime(s.start)}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          ),
                      )}
                      {!slots.length && <p className="rounded-2xl bg-blush p-5 text-sm">No free times on this day. Try another date or choose "Anyone available".</p>}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <form id="details-form" onSubmit={submit} noValidate className="card grid gap-5 p-6 sm:grid-cols-2 sm:p-8">
                  <h2 className="font-display text-4xl sm:col-span-2">Almost there</h2>
                  {(
                    [
                      { key: 'name', label: 'Full name', type: 'text', auto: 'name', span: true },
                      { key: 'phone', label: 'Mobile (for reminders)', type: 'tel', auto: 'tel' },
                      { key: 'email', label: 'Email', type: 'email', auto: 'email' },
                    ] as const
                  ).map((f) => (
                    <label key={f.key} className={'span' in f ? 'sm:col-span-2' : ''}>
                      <span className="mb-1.5 block text-sm font-semibold">{f.label}</span>
                      <input
                        type={f.type}
                        autoComplete={f.auto}
                        value={details[f.key]}
                        onChange={(e) => setDetails({ ...details, [f.key]: e.target.value })}
                        aria-invalid={!!errors[f.key]}
                        aria-describedby={errors[f.key] ? `${f.key}-err` : undefined}
                        className="field"
                      />
                      {errors[f.key] && (
                        <span id={`${f.key}-err`} className="mt-1 block text-sm text-rose">
                          {errors[f.key]}
                        </span>
                      )}
                    </label>
                  ))}
                  <label className="sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-semibold">Anything we should know? (optional)</span>
                    <textarea
                      rows={3}
                      value={details.notes}
                      onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                      placeholder="Allergies, inspiration photos, first visit…"
                      className="field resize-none"
                    />
                  </label>
                  <p className="text-xs text-muted sm:col-span-2">Pay at the studio. Free changes up to 12 hours before. Demo site: nothing is sent or charged.</p>
                </form>
              )}

            </div>

            {/* Step controls: inline on desktop, a sticky bar with the running total on phones.
                Kept outside the animated panel so the fixed bar is never trapped by its transform. */}
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/90 px-4 py-3 shadow-[0_-12px_30px_-20px_rgba(43,19,48,0.5)] backdrop-blur-lg lg:static lg:mt-8 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
              <div className="mx-auto flex max-w-6xl items-center gap-3">
                {step > 0 && (
                  <button className="btn btn-ghost !px-4 lg:!px-6" onClick={() => go(step - 1)} aria-label="Back">
                    <ArrowLeft size={16} /> <span className="hidden lg:inline">Back</span>
                  </button>
                )}
                <div className="min-w-0 flex-1 lg:hidden">
                  <p className="font-bold">{aed(total)}</p>
                  <p className="truncate text-xs text-muted">
                    {slot && date ? `${fmtDate(date, { weekday: 'short', day: 'numeric', month: 'short' })}, ${fmtTime(slot.start)}` : services.length ? `${services.length} ${services.length === 1 ? 'service' : 'services'} · ${fmtDuration(duration)}` : 'Nothing selected yet'}
                  </p>
                </div>
                <span className="hidden flex-1 lg:block" />
                {step < 3 ? (
                  <button className="btn btn-dark" disabled={!canNext} onClick={() => go(step + 1)}>
                    {step === 0 && !services.length ? 'Pick a service' : 'Continue'} <ArrowRight size={16} />
                  </button>
                ) : (
                  <button type="submit" form="details-form" className="btn btn-glow lg:!px-8">
                    Confirm <span className="hidden sm:inline">booking</span> <CheckCircle2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 lg:self-start" aria-label="Booking summary">
            <div className="card overflow-hidden">
              <div className="bg-plum-glow p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-peach">Your appointment</p>
                <p className="mt-2 font-display text-3xl">{date && slot ? fmtDate(date, { weekday: 'long', day: 'numeric', month: 'short' }) : 'Not scheduled yet'}</p>
                <p className="mt-1 flex items-center gap-2 text-sm text-white/70">
                  <Clock size={14} /> {slot ? `${fmtTime(slot.start)} – ${fmtTime(slot.start + duration)}` : fmtDuration(duration) || 'Choose services'}
                </p>
                {team.length > 0 && (
                  <p className="mt-4 flex items-center gap-3 text-sm">
                    <span className="flex -space-x-2">
                      {team.map((p) => (
                        <Img key={p.id} name={p.image} sizes="40px" className="h-9 w-9 rounded-full border-2 border-plum object-cover" />
                      ))}
                    </span>
                    with {team.map((p) => p.name.split(' ')[0]).join(' & ')}
                  </p>
                )}
              </div>
              <div className="p-6">
                {services.length ? (
                  <ul className="space-y-3 text-sm">
                    {services.map((s) => (
                      <li key={s.id} className="flex items-start justify-between gap-3">
                        <span>
                          {s.name}
                          <span className="block text-xs text-muted">{fmtDuration(s.duration)}</span>
                        </span>
                        <span className="shrink-0 font-semibold">{aed(s.price)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">Your services will appear here.</p>
                )}
                <p className="mt-5 flex justify-between border-t border-line pt-4 text-lg font-bold">
                  <span>Total</span>
                  <span>{aed(total)}</span>
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
