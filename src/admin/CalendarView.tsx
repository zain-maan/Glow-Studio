import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus } from '../components/icons'
import Img from '../components/Img'
import { STAFF, serviceById } from '../data'
import { gsap, prefersReducedMotion } from '../lib/motion'
import { active } from '../lib/stats'
import { useDb } from '../lib/store'
import { addDays, aed, fmtDate, fmtTime, fromISO, nowMinutes, today, weekday } from '../lib/time'
import AppointmentDrawer from './AppointmentDrawer'
import { PageTitle, StatusBadge } from './ui'

const OPEN = 600
const CLOSE = 1260
const PX = 1.5 // pixels per minute
const HOURS = Array.from({ length: (CLOSE - OPEN) / 60 + 1 }, (_, i) => OPEN + i * 60)

export default function CalendarView() {
  const db = useDb()
  const [date, setDate] = useState(today())
  const [open, setOpen] = useState<string | null>(null)
  const [who, setWho] = useState<string>('all')
  const grid = useRef<HTMLDivElement>(null)
  const isToday = date === today()
  const now = nowMinutes()
  const showNow = isToday && now >= OPEN && now <= CLOSE
  const weekStart = addDays(date, -((weekday(date) + 6) % 7))
  const dayApps = db.appointments.filter((a) => a.date === date && a.status !== 'cancelled')
  const revenue = dayApps.filter(active).reduce((n, a) => n + a.price, 0)

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !grid.current) return
    gsap.from(grid.current.querySelectorAll('[data-block]'), { opacity: 0, y: 12, scale: 0.96, duration: 0.5, ease: 'power3.out', stagger: 0.015 })
  }, [date])

  // Start the view near the current time on today, otherwise at opening.
  useLayoutEffect(() => {
    const el = grid.current
    if (!el) return
    el.scrollTop = isToday ? Math.max(0, (now - OPEN - 60) * PX) : 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date])

  return (
    <div>
      <PageTitle title="Calendar" sub={`${dayApps.filter(active).length} appointments · ${aed(revenue)} booked`}>
        <Link to="/book" className="btn btn-glow">
          <Plus size={16} /> New booking
        </Link>
      </PageTitle>

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-3">
        <div className="flex items-center gap-1">
          <button onClick={() => setDate(addDays(date, -1))} className="rounded-full p-2 hover:bg-porcelain" aria-label="Previous day">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setDate(addDays(date, 1))} className="rounded-full p-2 hover:bg-porcelain" aria-label="Next day">
            <ChevronRight size={18} />
          </button>
          <button onClick={() => setDate(today())} className="chip !py-1.5" aria-pressed={isToday}>
            Today
          </button>
        </div>
        <p className="font-display text-2xl">{fmtDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <div className="no-scrollbar ml-auto flex w-full gap-1 overflow-x-auto sm:w-auto">
          {Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)).map((d) => {
            const count = db.appointments.filter((a) => a.date === d && active(a)).length
            return (
              <button
                key={d}
                onClick={() => setDate(d)}
                aria-pressed={d === date}
                className={`flex min-w-12 flex-1 flex-col items-center rounded-xl px-2 py-1.5 text-xs transition-colors ${d === date ? 'bg-plum text-white' : 'hover:bg-porcelain'}`}
              >
                <span className="font-semibold opacity-70">{fromISO(d).toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                <span className="text-base font-bold">{fromISO(d).getDate()}</span>
                <span className={`text-[0.6rem] ${d === date ? 'text-peach' : 'text-muted'}`}>{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Phones: a time-ordered agenda with a stylist filter instead of the wide grid */}
      <div className="md:hidden">
        <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1" role="radiogroup" aria-label="Stylist">
          <button role="radio" aria-checked={who === 'all'} onClick={() => setWho('all')} className="chip shrink-0 !py-1.5">
            Everyone
          </button>
          {STAFF.filter((s) => s.workDays.includes(weekday(date))).map((s) => (
            <button key={s.id} role="radio" aria-checked={who === s.id} onClick={() => setWho(s.id)} className="chip shrink-0 !py-1 !pl-1">
              <Img name={s.image} sizes="28px" className="h-6 w-6 rounded-full object-cover" />
              {s.name.split(' ')[0]}
            </button>
          ))}
        </div>
        <ol className="card divide-y divide-line overflow-hidden">
          {dayApps
            .filter((a) => who === 'all' || a.staffId === who)
            .sort((a, b) => a.start - b.start)
            .map((a, i, list) => {
              const s = STAFF.find((x) => x.id === a.staffId)!
              const c = db.clients.find((x) => x.id === a.clientId)
              const nowHere = showNow && a.start > now && (i === 0 || list[i - 1].start <= now)
              return (
                <li key={a.id}>
                  {nowHere && (
                    <p className="flex items-center gap-2 bg-rose/5 px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-rose">
                      <span className="h-2 w-2 rounded-full bg-rose" /> Now · {fmtTime(now)}
                    </p>
                  )}
                  <button onClick={() => setOpen(a.id)} className="flex w-full items-center gap-3 p-4 text-left active:bg-porcelain">
                    <span className="w-14 shrink-0 text-sm font-bold">
                      {fmtTime(a.start)}
                      <span className="block text-[0.65rem] font-semibold text-muted">{a.duration} min</span>
                    </span>
                    <span className="h-11 w-1 shrink-0 rounded-full" style={{ background: s.color }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{c?.name}</span>
                      <span className="block truncate text-xs text-muted">
                        {a.serviceIds.map((id) => serviceById(id)?.name).join(' + ')} · {s.name.split(' ')[0]}
                      </span>
                    </span>
                    <StatusBadge status={a.status} />
                  </button>
                </li>
              )
            })}
          {!dayApps.some((a) => who === 'all' || a.staffId === who) && <li className="p-8 text-center text-sm text-muted">Nothing booked for this day.</li>}
        </ol>
      </div>

      <div className="card hidden overflow-hidden md:block">
        <div ref={grid} className="max-h-[70vh] overflow-auto">
          <div className="grid min-w-[760px]" style={{ gridTemplateColumns: `64px repeat(${STAFF.length}, minmax(140px, 1fr))` }}>
            {/* Header row */}
            <div className="sticky left-0 top-0 z-30 border-b border-line bg-white" />
            {STAFF.map((s) => {
              const working = s.workDays.includes(weekday(date))
              return (
                <div key={s.id} className="sticky top-0 z-20 flex items-center gap-2 border-b border-l border-line bg-white px-3 py-3">
                  <Img name={s.image} sizes="36px" className={`h-9 w-9 rounded-full object-cover ${working ? '' : 'grayscale'}`} />
                  <div className="min-w-0 text-sm">
                    <p className="truncate font-semibold">{s.name.split(' ')[0]}</p>
                    <p className="text-xs text-muted">{working ? `${fmtTime(s.start)} – ${fmtTime(s.end)}` : 'Day off'}</p>
                  </div>
                </div>
              )
            })}

            {/* Time column */}
            <div className="sticky left-0 z-20 bg-white" style={{ height: (CLOSE - OPEN) * PX }}>
              {HOURS.slice(0, -1).map((h) => (
                <span key={h} className="absolute right-2 -translate-y-1/2 text-[0.7rem] font-semibold text-muted" style={{ top: (h - OPEN) * PX }}>
                  {h === OPEN ? '' : fmtTime(h)}
                </span>
              ))}
              {showNow && (
                <span className="absolute right-1 z-10 -translate-y-1/2 rounded-full bg-rose px-1.5 py-0.5 text-[0.6rem] font-bold text-white" style={{ top: (now - OPEN) * PX }}>
                  {fmtTime(now)}
                </span>
              )}
            </div>

            {/* Staff columns */}
            {STAFF.map((s) => {
              const working = s.workDays.includes(weekday(date))
              return (
                <div key={s.id} className="relative border-l border-line" style={{ height: (CLOSE - OPEN) * PX }}>
                  {HOURS.slice(1, -1).map((h) => (
                    <div key={h} className="absolute inset-x-0 border-t border-dashed border-line/80" style={{ top: (h - OPEN) * PX }} />
                  ))}
                  {/* Hours outside the shift are hatched */}
                  {working ? (
                    <>
                      <div className="absolute inset-x-0 top-0 bg-[repeating-linear-gradient(135deg,#f7e4de_0_6px,transparent_6px_12px)]" style={{ height: (s.start - OPEN) * PX }} />
                      <div className="absolute inset-x-0 bottom-0 bg-[repeating-linear-gradient(135deg,#f7e4de_0_6px,transparent_6px_12px)]" style={{ height: (CLOSE - s.end) * PX }} />
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-[repeating-linear-gradient(135deg,#f7e4de_0_6px,transparent_6px_12px)]" />
                  )}

                  {dayApps
                    .filter((a) => a.staffId === s.id)
                    .map((a) => {
                      const c = db.clients.find((x) => x.id === a.clientId)
                      const faded = a.status === 'no-show' || a.status === 'completed'
                      return (
                        <button
                          key={a.id}
                          data-block
                          onClick={() => setOpen(a.id)}
                          className="absolute inset-x-1 overflow-hidden rounded-xl border-l-4 p-2 text-left text-xs shadow-sm transition-all hover:z-10 hover:scale-[1.02] hover:shadow-lg"
                          style={{
                            top: (a.start - OPEN) * PX + 1,
                            height: a.duration * PX - 2,
                            background: `${s.color}${faded ? '14' : '24'}`,
                            borderColor: s.color,
                          }}
                        >
                          <p className="truncate font-bold">{c?.name}</p>
                          <p className="truncate text-muted">{a.serviceIds.map((id) => serviceById(id)?.name).join(' + ')}</p>
                          {a.duration >= 45 && (
                            <p className="mt-0.5 font-semibold" style={{ color: s.color }}>
                              {fmtTime(a.start)}
                              {a.status === 'pending' ? ' · pending' : a.status === 'no-show' ? ' · no-show' : ''}
                            </p>
                          )}
                        </button>
                      )
                    })}
                  {showNow && <div className="pointer-events-none absolute inset-x-0 z-10 h-0.5 bg-rose" style={{ top: (now - OPEN) * PX }} />}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <AppointmentDrawer id={open} onClose={() => setOpen(null)} />
    </div>
  )
}
