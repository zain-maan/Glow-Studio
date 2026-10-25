import { useMemo, useState } from 'react'
import { Search } from '../components/icons'
import Img from '../components/Img'
import { STAFF, serviceById, staffById } from '../data'
import { useDb, type Status } from '../lib/store'
import { aed, fmtTime, relativeDay, today } from '../lib/time'
import AppointmentDrawer from './AppointmentDrawer'
import { PageTitle, STATUS_STYLE, StatusBadge } from './ui'

const WHEN = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'all', label: 'All' },
] as const
const PAGE = 30

export default function Appointments() {
  const db = useDb()
  const [query, setQuery] = useState('')
  const [when, setWhen] = useState<(typeof WHEN)[number]['id']>('upcoming')
  const [status, setStatus] = useState<Status | 'all'>('all')
  const [staff, setStaff] = useState('all')
  const [limit, setLimit] = useState(PAGE)
  const [open, setOpen] = useState<string | null>(null)
  const t = today()

  const clientsById = useMemo(() => new Map(db.clients.map((c) => [c.id, c])), [db.clients])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return db.appointments
      .filter((a) => (when === 'upcoming' ? a.date >= t : when === 'past' ? a.date < t : true))
      .filter((a) => status === 'all' || a.status === status)
      .filter((a) => staff === 'all' || a.staffId === staff)
      .filter((a) => {
        if (!q) return true
        const c = clientsById.get(a.clientId)
        return !!c && (c.name.toLowerCase().includes(q) || c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')))
      })
      .sort((a, b) => {
        const k = (a.date + String(a.start).padStart(4, '0')).localeCompare(b.date + String(b.start).padStart(4, '0'))
        return when === 'past' ? -k : k
      })
  }, [db.appointments, clientsById, query, when, status, staff, t])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const a of db.appointments) if (when === 'all' || (when === 'upcoming' ? a.date >= t : a.date < t)) c[a.status] = (c[a.status] ?? 0) + 1
    return c
  }, [db.appointments, when, t])

  return (
    <div>
      <PageTitle title="Appointments" sub={`${rows.length} matching`} />

      <div className="card mb-4 space-y-4 p-4">
        <div className="flex flex-wrap gap-3">
          <label className="relative min-w-56 flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setLimit(PAGE)
              }}
              placeholder="Search client name or phone"
              className="field !pl-11"
              aria-label="Search appointments"
            />
          </label>
          <div className="flex gap-1 rounded-full bg-porcelain p-1" role="radiogroup" aria-label="When">
            {WHEN.map((w) => (
              <button key={w.id} role="radio" aria-checked={when === w.id} onClick={() => setWhen(w.id)} className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${when === w.id ? 'bg-plum text-white' : 'text-muted hover:text-ink'}`}>
                {w.label}
              </button>
            ))}
          </div>
          <select value={staff} onChange={(e) => setStaff(e.target.value)} className="field !w-auto" aria-label="Filter by stylist">
            <option value="all">All stylists</option>
            {STAFF.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto" role="radiogroup" aria-label="Status">
          <button role="radio" aria-checked={status === 'all'} onClick={() => setStatus('all')} className="chip shrink-0 !py-1.5">
            All
          </button>
          {(Object.keys(STATUS_STYLE) as Status[]).map((s) => (
            <button key={s} role="radio" aria-checked={status === s} onClick={() => setStatus(s)} className="chip shrink-0 !py-1.5">
              <span className={`h-2 w-2 rounded-full ${STATUS_STYLE[s].dot}`} />
              {STATUS_STYLE[s].label}
              <span className="text-xs opacity-60">{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {/* Table on wide screens, cards on phones */}
        <table className="hidden w-full text-sm md:table">
          <thead className="border-b border-line bg-porcelain/60 text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">When</th>
              <th className="px-5 py-3 font-semibold">Client</th>
              <th className="px-5 py-3 font-semibold">Services</th>
              <th className="px-5 py-3 font-semibold">Stylist</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.slice(0, limit).map((a) => {
              const c = clientsById.get(a.clientId)
              const s = staffById(a.staffId)!
              return (
                <tr key={a.id} onClick={() => setOpen(a.id)} className="cursor-pointer transition-colors hover:bg-porcelain">
                  <td className="whitespace-nowrap px-5 py-4">
                    <span className="font-semibold">{relativeDay(a.date)}</span>
                    <span className="block text-xs text-muted">{fmtTime(a.start)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button className="text-left font-semibold hover:text-rose" onClick={() => setOpen(a.id)}>
                      {c?.name}
                    </button>
                    <span className="block text-xs text-muted">{c?.phone}</span>
                  </td>
                  <td className="max-w-64 truncate px-5 py-4">{a.serviceIds.map((id) => serviceById(id)?.name).join(' + ')}</td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-2">
                      <Img name={s.image} sizes="28px" className="h-7 w-7 rounded-full object-cover" />
                      {s.name.split(' ')[0]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-5 py-4 text-right font-semibold">{aed(a.price)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <ul className="divide-y divide-line md:hidden">
          {rows.slice(0, limit).map((a) => {
            const c = clientsById.get(a.clientId)
            return (
              <li key={a.id}>
                <button onClick={() => setOpen(a.id)} className="flex w-full items-center gap-3 p-4 text-left">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{c?.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {relativeDay(a.date)}, {fmtTime(a.start)} · {a.serviceIds.map((id) => serviceById(id)?.name).join(' + ')}
                    </span>
                  </span>
                  <StatusBadge status={a.status} />
                </button>
              </li>
            )
          })}
        </ul>

        {!rows.length && <p className="p-10 text-center text-muted">No appointments match these filters.</p>}
        {rows.length > limit && (
          <div className="border-t border-line p-4 text-center">
            <button onClick={() => setLimit((l) => l + PAGE)} className="btn btn-ghost">
              Show more ({rows.length - limit} left)
            </button>
          </div>
        )}
      </div>

      <AppointmentDrawer id={open} onClose={() => setOpen(null)} />
    </div>
  )
}
