import { useEffect, useMemo, useState } from 'react'
import { Mail, Phone, Search, X } from '../components/icons'
import { serviceById } from '../data'
import { clientSummaries, type ClientSummary } from '../lib/stats'
import { useDb } from '../lib/store'
import { aed, fmtDate, fmtTime, relativeDay } from '../lib/time'
import AppointmentDrawer from './AppointmentDrawer'
import { PageTitle, StatusBadge } from './ui'

type Sort = 'spend' | 'visits' | 'recent' | 'name'
const VIP = 3000

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
}

export default function Clients() {
  const db = useDb()
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('spend')
  const [selected, setSelected] = useState<string | null>(null)
  const [appointment, setAppointment] = useState<string | null>(null)

  const all = useMemo(() => clientSummaries(db.clients, db.appointments), [db.clients, db.appointments])
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.email.includes(q) || c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, '')))
      .sort((a, b) =>
        sort === 'spend' ? b.spend - a.spend : sort === 'visits' ? b.visits - a.visits : sort === 'recent' ? (b.lastVisit ?? '').localeCompare(a.lastVisit ?? '') : a.name.localeCompare(b.name),
      )
  }, [all, query, sort])

  const current = all.find((c) => c.id === selected)
  const vipCount = all.filter((c) => c.spend >= VIP).length

  useEffect(() => {
    if (!selected) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !appointment && setSelected(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, appointment])

  return (
    <div>
      <PageTitle title="Clients" sub={`${all.length} clients · ${vipCount} VIPs (over ${aed(VIP)} spent)`} />

      <div className="card mb-4 flex flex-wrap gap-3 p-4">
        <label className="relative min-w-56 flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone or email" className="field !pl-11" aria-label="Search clients" />
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field !w-auto" aria-label="Sort clients">
          <option value="spend">Top spenders</option>
          <option value="visits">Most visits</option>
          <option value="recent">Recently visited</option>
          <option value="name">Name A–Z</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map((c) => (
          <ClientCard key={c.id} client={c} onOpen={() => setSelected(c.id)} />
        ))}
      </div>
      {!rows.length && <p className="card p-10 text-center text-muted">No clients match “{query}”.</p>}

      {current && (
        <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={`${current.name} profile`}>
          <button className="absolute inset-0 bg-plum/40 backdrop-blur-sm" onClick={() => setSelected(null)} aria-label="Close" />
          <div className="relative h-full w-full max-w-md overflow-y-auto bg-porcelain shadow-2xl">
            <div className="bg-plum-glow p-6 text-white">
              <button onClick={() => setSelected(null)} className="absolute right-4 top-4 rounded-full p-2 hover:bg-white/10" aria-label="Close">
                <X size={20} />
              </button>
              <span className="bg-glow flex h-16 w-16 items-center justify-center rounded-full font-display text-2xl">{initials(current.name)}</span>
              <p className="mt-4 font-display text-4xl leading-none">{current.name}</p>
              <p className="mt-2 text-sm text-white/70">Client since {fmtDate(current.createdAt, { month: 'long', year: 'numeric' })}</p>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                {[
                  ['Visits', String(current.visits)],
                  ['Spent', aed(current.spend)],
                  ['No-shows', String(current.noShows)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-white/10 p-3">
                    <p className="font-display text-xl">{v}</p>
                    <p className="text-xs text-white/60">{k}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 p-6 text-sm">
              <a href={`tel:${current.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 hover:text-rose"><Phone size={15} className="text-muted" /> {current.phone}</a>
              <a href={`mailto:${current.email}`} className="flex items-center gap-3 hover:text-rose"><Mail size={15} className="text-muted" /> {current.email}</a>
            </div>
            <div className="px-6 pb-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted">History</p>
              <ul className="space-y-2">
                {db.appointments
                  .filter((a) => a.clientId === current.id)
                  .sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start))
                  .map((a) => (
                    <li key={a.id}>
                      <button onClick={() => setAppointment(a.id)} className="card flex w-full items-center gap-3 p-4 text-left text-sm transition-transform hover:-translate-y-0.5">
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">{relativeDay(a.date)}, {fmtTime(a.start)}</span>
                          <span className="block truncate text-xs text-muted">{a.serviceIds.map((id) => serviceById(id)?.name).join(' + ')}</span>
                        </span>
                        <StatusBadge status={a.status} />
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <AppointmentDrawer id={appointment} onClose={() => setAppointment(null)} />
    </div>
  )
}

function ClientCard({ client: c, onOpen }: { client: ClientSummary; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="card flex items-center gap-4 p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-lg ${c.spend >= VIP ? 'bg-glow text-white' : 'bg-blush'}`}>{initials(c.name)}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-semibold">{c.name}</span>
          {c.spend >= VIP && <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-gold">VIP</span>}
        </span>
        <span className="block text-xs text-muted">
          {c.visits} visits · last {c.lastVisit ? relativeDay(c.lastVisit) : 'never'}
        </span>
        {c.nextVisit && <span className="mt-1 block text-xs font-semibold text-rose">Next: {relativeDay(c.nextVisit.date)}, {fmtTime(c.nextVisit.start)}</span>}
      </span>
      <span className="shrink-0 text-right text-sm font-bold">{aed(c.spend)}</span>
    </button>
  )
}
