import { STAFF, serviceById, type Category } from '../data'
import type { Appointment, Client } from './store'
import { addDays, fmtDate, today, weekday } from './time'

// Revenue counts completed appointments, plus confirmed ones for today and later
// (money the studio expects to take).
export const earns = (a: Appointment) => a.status === 'completed' || (a.status === 'confirmed' && a.date >= today())
export const active = (a: Appointment) => a.status !== 'cancelled' && a.status !== 'no-show'

export function revenueSeries(appointments: Appointment[], days: number) {
  const t = today()
  return Array.from({ length: days }, (_, i) => {
    const d = addDays(t, i - days + 1)
    const value = appointments.filter((a) => a.date === d && a.status === 'completed').reduce((n, a) => n + a.price, 0)
    return { label: fmtDate(d, { day: 'numeric', month: 'short' }), value, date: d }
  })
}

export function dayStats(appointments: Appointment[], date: string) {
  const list = appointments.filter((a) => a.date === date)
  return {
    bookings: list.filter(active).length,
    revenue: list.filter(earns).reduce((n, a) => n + a.price, 0),
    cancelled: list.filter((a) => a.status === 'cancelled').length,
  }
}

// Booked minutes as a share of the minutes stylists are scheduled to work.
export function occupancy(appointments: Appointment[], from: string, days: number, staffId?: string) {
  let open = 0
  let booked = 0
  for (let i = 0; i < days; i++) {
    const d = addDays(from, i)
    for (const s of STAFF) {
      if (staffId && s.id !== staffId) continue
      if (!s.workDays.includes(weekday(d))) continue
      open += s.end - s.start
      booked += appointments.filter((a) => a.date === d && a.staffId === s.id && active(a)).reduce((n, a) => n + a.duration, 0)
    }
  }
  return open ? booked / open : 0
}

export function revenueByCategory(appointments: Appointment[], from: string) {
  const totals: Record<string, number> = {}
  for (const a of appointments) {
    if (a.date < from || a.status !== 'completed') continue
    for (const id of a.serviceIds) {
      const s = serviceById(id)
      if (s) totals[s.category] = (totals[s.category] ?? 0) + s.price
    }
  }
  return totals as Partial<Record<Category, number>>
}

export function topServices(appointments: Appointment[], from: string, limit = 5) {
  const counts: Record<string, number> = {}
  for (const a of appointments) {
    if (a.date < from || !active(a)) continue
    for (const id of a.serviceIds) counts[id] = (counts[id] ?? 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, n]) => ({ service: serviceById(id)!, count: n }))
}

export type ClientSummary = Client & {
  visits: number
  spend: number
  lastVisit?: string
  nextVisit?: Appointment
  noShows: number
}

export function clientSummaries(clients: Client[], appointments: Appointment[]): ClientSummary[] {
  const t = today()
  return clients.map((c) => {
    const mine = appointments.filter((a) => a.clientId === c.id)
    const done = mine.filter((a) => a.status === 'completed')
    const upcoming = mine.filter((a) => a.date >= t && active(a) && a.status !== 'completed').sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    return {
      ...c,
      visits: done.length,
      spend: done.reduce((n, a) => n + a.price, 0),
      lastVisit: done.map((a) => a.date).sort().at(-1),
      nextVisit: upcoming[0],
      noShows: mine.filter((a) => a.status === 'no-show').length,
    }
  })
}

export const pct = (n: number) => `${Math.round(n * 100)}%`

export function change(current: number, previous: number) {
  if (!previous) return null
  return (current - previous) / previous
}
