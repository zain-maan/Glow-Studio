import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, TrendingUp, Users } from '../components/icons'
import Img from '../components/Img'
import { CATEGORIES, STAFF, serviceById, staffById } from '../data'
import { gsap, prefersReducedMotion } from '../lib/motion'
import { active, change, dayStats, occupancy, pct, revenueByCategory, revenueSeries, topServices } from '../lib/stats'
import { useDb } from '../lib/store'
import { addDays, aed, fmtTime, nowMinutes, relativeDay, today } from '../lib/time'
import AppointmentDrawer from './AppointmentDrawer'
import { AreaChart, BarList, Donut, Sparkline } from './charts'
import { PageTitle, Panel, StatusBadge } from './ui'

const CAT_COLORS: Record<string, string> = { Hair: '#ff6f91', Skin: '#3fb68b', Nails: '#ffb199', Makeup: '#c86dd7', Spa: '#d9a86c' }
const RANGES = [7, 30, 60] as const

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return null
  const up = value >= 0
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
      <TrendingUp size={12} className={up ? '' : 'rotate-180'} />
      {up ? '+' : ''}
      {Math.round(value * 100)}%
    </span>
  )
}

export default function Dashboard() {
  const db = useDb()
  const root = useRef<HTMLDivElement>(null)
  const [range, setRange] = useState<(typeof RANGES)[number]>(30)
  const [open, setOpen] = useState<string | null>(null)
  const t = today()
  const { appointments } = db

  const m = useMemo(() => {
    const todayStats = dayStats(appointments, t)
    const lastWeek = dayStats(appointments, addDays(t, -7))
    const week = revenueSeries(appointments, 7).map((d) => d.value)
    const upcoming = appointments.filter((a) => a.date > t && a.date <= addDays(t, 7) && active(a))
    const prevUpcoming = appointments.filter((a) => a.date > addDays(t, -7) && a.date <= t && active(a))
    const occ = occupancy(appointments, t, 7)
    const occPrev = occupancy(appointments, addDays(t, -7), 7)
    const newClients = db.clients.filter((c) => c.createdAt >= addDays(t, -30)).length
    return { todayStats, lastWeek, week, upcoming, prevUpcoming, occ, occPrev, newClients }
  }, [appointments, db.clients, t])

  const series = useMemo(() => revenueSeries(appointments, range), [appointments, range])
  const rangeTotal = series.reduce((n, d) => n + d.value, 0)
  const byCat = useMemo(() => revenueByCategory(appointments, addDays(t, -range)), [appointments, range, t])
  const catData = CATEGORIES.map((c) => ({ label: c.id, value: byCat[c.id] ?? 0, color: CAT_COLORS[c.id] }))
  const catTotal = catData.reduce((n, d) => n + d.value, 0)
  const top = useMemo(() => topServices(appointments, addDays(t, -range)), [appointments, range, t])

  const schedule = appointments
    .filter((a) => a.date === t && a.status !== 'cancelled')
    .sort((a, b) => a.start - b.start)
  const now = nowMinutes()

  const staffPerf = STAFF.map((s) => {
    const mine = appointments.filter((a) => a.staffId === s.id && a.date >= addDays(t, -30) && a.date <= t && a.status === 'completed')
    return { staff: s, revenue: mine.reduce((n, a) => n + a.price, 0), occ: occupancy(appointments, addDays(t, -29), 30, s.id) }
  }).sort((a, b) => b.revenue - a.revenue)

  const recent = [...appointments]
    .filter((a) => a.source === 'online' && a.date >= t)
    // Bookings made on this site (random ids) first, then the newest seeded ones.
    .sort((a, b) => Number(/^ap_\d+$/.test(a.id)) - Number(/^ap_\d+$/.test(b.id)) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !root.current) return
    const ctx = gsap.context(() => {
      gsap.from('[data-kpi]', { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 })
      gsap.utils.toArray<HTMLElement>('[data-num]').forEach((el) => {
        const target = Number(el.dataset.num)
        const fmt = el.dataset.fmt
        const o = { v: 0 }
        gsap.to(o, {
          v: target,
          duration: 1.4,
          ease: 'power3.out',
          onUpdate: () => {
            el.textContent = fmt === 'aed' ? aed(Math.round(o.v)) : fmt === 'pct' ? pct(o.v) : String(Math.round(o.v))
          },
        })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  const kpis = [
    { label: "Today's revenue", value: m.todayStats.revenue, fmt: 'aed', delta: change(m.todayStats.revenue, m.lastWeek.revenue), note: 'vs same day last week', spark: m.week },
    { label: "Today's bookings", value: m.todayStats.bookings, fmt: 'num', delta: change(m.todayStats.bookings, m.lastWeek.bookings), note: `${m.todayStats.cancelled} cancelled` },
    { label: 'Next 7 days', value: m.upcoming.length, fmt: 'num', delta: change(m.upcoming.length, m.prevUpcoming.length), note: 'appointments booked' },
    { label: 'Chair occupancy', value: m.occ, fmt: 'pct', delta: change(m.occ, m.occPrev), note: 'next 7 days' },
  ]

  return (
    <div ref={root}>
      <PageTitle
        title={
          <>
            {greeting()}, <em className="text-glow">Layla.</em>
          </>
        }
        sub={`${schedule.length} appointments today · ${m.newClients} new clients this month`}
      >
        <Link to="/admin/calendar" className="btn btn-dark">
          <Calendar size={16} /> Open calendar
        </Link>
      </PageTitle>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <div key={k.label} data-kpi className={`card relative overflow-hidden p-5 ${i === 0 ? 'bg-plum-glow text-white' : ''}`}>
            <p className={`text-sm font-semibold ${i === 0 ? 'text-white/70' : 'text-muted'}`}>{k.label}</p>
            <p className="mt-2 font-display text-3xl sm:text-4xl" data-num={k.value} data-fmt={k.fmt}>
              {k.fmt === 'aed' ? aed(k.value) : k.fmt === 'pct' ? pct(k.value) : k.value}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <Delta value={k.delta} />
              <span className={i === 0 ? 'text-white/60' : 'text-muted'}>{k.note}</span>
            </div>
            {k.spark && (
              <div className="absolute right-4 top-4 hidden opacity-80 sm:block">
                <Sparkline values={k.spark} color="#ffb199" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Panel
          title="Revenue"
          action={
            <div className="flex gap-1 rounded-full bg-porcelain p-1" role="radiogroup" aria-label="Range">
              {RANGES.map((r) => (
                <button key={r} role="radio" aria-checked={range === r} onClick={() => setRange(r)} className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${range === r ? 'bg-plum text-white' : 'text-muted hover:text-ink'}`}>
                  {r}d
                </button>
              ))}
            </div>
          }
        >
          <p className="-mt-2 mb-4 text-sm text-muted">
            <span className="font-display text-3xl text-ink">{aed(rangeTotal)}</span> completed in the last {range} days
          </p>
          <AreaChart data={series} format={aed} />
        </Panel>

        <Panel title="By category">
          <Donut
            data={catData}
            center={
              <>
                <span className="font-display text-2xl">{aed(catTotal)}</span>
                <span className="text-xs text-muted">last {range} days</span>
              </>
            }
          />
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {catData.map((c) => (
              <li key={c.label} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="flex-1">{c.label}</span>
                <span className="text-muted">{catTotal ? pct(c.value / catTotal) : '0%'}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-[1.2fr_1fr_1fr]">
        <Panel
          className="md:col-span-2 2xl:col-span-1"
          title="Today"
          action={
            <Link to="/admin/appointments" className="flex items-center gap-1 text-sm font-semibold text-rose">
              All <ArrowRight size={14} />
            </Link>
          }
        >
          {schedule.length ? (
            <ol className="relative max-h-[26rem] space-y-1 overflow-y-auto pr-1">
              {schedule.map((a) => {
                const c = db.clients.find((x) => x.id === a.clientId)
                const s = staffById(a.staffId)!
                const live = now >= a.start && now < a.start + a.duration
                return (
                  <li key={a.id}>
                    <button onClick={() => setOpen(a.id)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors hover:bg-porcelain ${live ? 'bg-blush/60' : ''}`}>
                      <span className="w-16 shrink-0 text-sm font-semibold">
                        {fmtTime(a.start)}
                        {live && <span className="block text-[0.65rem] font-bold uppercase text-rose">Now</span>}
                      </span>
                      <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: s.color }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{c?.name}</span>
                        <span className="block truncate text-xs text-muted">
                          {a.serviceIds.map((id) => serviceById(id)?.name).join(' + ')} · {s.name.split(' ')[0]}
                        </span>
                      </span>
                      <StatusBadge status={a.status} />
                    </button>
                  </li>
                )
              })}
            </ol>
          ) : (
            <p className="text-sm text-muted">No appointments today.</p>
          )}
        </Panel>

        <Panel title="Top services">
          <BarList items={top.map((x) => ({ label: x.service.name, value: x.count, color: CAT_COLORS[x.service.category] }))} format={(n) => `${n} booked`} />
        </Panel>

        <Panel title="Team, last 30 days">
          <ul className="space-y-4">
            {staffPerf.map((p) => (
              <li key={p.staff.id} className="flex items-center gap-3">
                <Img name={p.staff.image} sizes="40px" className="h-10 w-10 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="truncate font-semibold">{p.staff.name.split(' ')[0]}</span>
                    <span className="text-muted">{aed(p.revenue)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-blush">
                    <div className="h-full rounded-full" style={{ width: pct(p.occ), background: p.staff.color }} />
                  </div>
                  <p className="mt-1 text-xs text-muted">{pct(p.occ)} booked</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel
        className="mt-4"
        title="Latest online bookings"
        action={
          <span className="flex items-center gap-1.5 text-xs font-semibold text-mint">
            <span className="h-2 w-2 animate-pulse rounded-full bg-mint" /> Live from the website
          </span>
        }
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {recent.map((a) => {
            const c = db.clients.find((x) => x.id === a.clientId)
            return (
              <button key={a.id} onClick={() => setOpen(a.id)} className="rounded-2xl border border-line p-4 text-left transition-all hover:-translate-y-0.5 hover:border-rose hover:shadow-md">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Users size={14} className="text-muted" /> {c?.name}
                </p>
                <p className="mt-1 truncate text-xs text-muted">{a.serviceIds.map((id) => serviceById(id)?.name).join(' + ')}</p>
                <p className="mt-3 text-xs">
                  {relativeDay(a.date)} · {fmtTime(a.start)}
                </p>
              </button>
            )
          })}
        </div>
      </Panel>

      <AppointmentDrawer id={open} onClose={() => setOpen(null)} />
    </div>
  )
}
