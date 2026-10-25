import { Link } from 'react-router-dom'
import { Star } from '../components/icons'
import Img from '../components/Img'
import { STAFF, serviceById } from '../data'
import { active, occupancy, pct } from '../lib/stats'
import { useDb } from '../lib/store'
import { addDays, aed, fmtTime, relativeDay, today } from '../lib/time'
import { PageTitle } from './ui'

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function StaffView() {
  const db = useDb()
  const t = today()

  return (
    <div>
      <PageTitle title="Team" sub="Performance over the last 30 days and what's coming up" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {STAFF.map((s) => {
          const month = db.appointments.filter((a) => a.staffId === s.id && a.date > addDays(t, -30) && a.date <= t)
          const done = month.filter((a) => a.status === 'completed')
          const revenue = done.reduce((n, a) => n + a.price, 0)
          const occ = occupancy(db.appointments, addDays(t, -29), 30, s.id)
          const nextWeek = occupancy(db.appointments, t, 7, s.id)
          const next = db.appointments
            .filter((a) => a.staffId === s.id && active(a) && a.status !== 'completed' && (a.date > t || (a.date === t && a.start >= new Date().getHours() * 60)))
            .sort((a, b) => (a.date + String(a.start).padStart(4, '0')).localeCompare(b.date + String(b.start).padStart(4, '0')))[0]
          const client = next && db.clients.find((c) => c.id === next.clientId)
          return (
            <article key={s.id} className="card overflow-hidden">
              <div className="flex items-center gap-4 p-5" style={{ background: `linear-gradient(120deg, ${s.color}26, transparent 70%)` }}>
                <Img name={s.image} sizes="72px" className="h-16 w-16 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-2xl">{s.name}</p>
                  <p className="text-sm text-muted">{s.role}</p>
                </div>
                <p className="flex items-center gap-1 text-sm font-bold">
                  <Star size={14} fill="currentColor" className="text-gold" /> {s.rating}
                </p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-line border-y border-line text-center">
                {[
                  ['Revenue', aed(revenue)],
                  ['Clients', String(done.length)],
                  ['Booked', pct(occ)],
                ].map(([k, v]) => (
                  <div key={k} className="p-3">
                    <p className="font-display text-xl">{v}</p>
                    <p className="text-xs text-muted">{k}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-4 p-5 text-sm">
                <div>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="font-semibold">Next 7 days</span>
                    <span className="text-muted">{pct(nextWeek)} booked</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-blush">
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: pct(nextWeek), background: s.color }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <ul className="flex gap-1" aria-label="Working days">
                    {DAYS.map((d, i) => (
                      <li key={i} className={`flex h-7 w-7 items-center justify-center rounded-full text-[0.65rem] font-bold ${s.workDays.includes(i) ? 'text-white' : 'bg-porcelain text-muted/50'}`} style={s.workDays.includes(i) ? { background: s.color } : undefined}>
                        {d}
                      </li>
                    ))}
                  </ul>
                  <span className="text-xs text-muted">
                    {fmtTime(s.start)}–{fmtTime(s.end)}
                  </span>
                </div>
                <div className="rounded-2xl bg-porcelain p-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Next up</p>
                  {next ? (
                    <p className="mt-1">
                      <span className="font-semibold">{client?.name}</span> · {relativeDay(next.date)}, {fmtTime(next.start)}
                      <span className="block truncate text-xs text-muted">{next.serviceIds.map((id) => serviceById(id)?.name).join(' + ')}</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-muted">Nothing booked yet</p>
                  )}
                </div>
                <Link to="/admin/calendar" className="btn btn-ghost w-full !py-2.5 text-sm">
                  View in calendar
                </Link>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
