import { useSyncExternalStore } from 'react'
import { SERVICES, STAFF, serviceById, type Category } from '../data'
import { addDays, nowMinutes, today, weekday } from './time'

export type Status = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show'
export type Source = 'online' | 'phone' | 'walk-in'

export type Client = {
  id: string
  name: string
  phone: string
  email: string
  createdAt: string // YYYY-MM-DD
  notes?: string
}

export type Appointment = {
  id: string
  clientId: string
  staffId: string
  serviceIds: string[]
  date: string
  start: number // minutes from midnight
  duration: number
  price: number
  status: Status
  source: Source
  notes?: string
  createdAt: string
}

type Db = { version: 1; seededOn: string; clients: Client[]; appointments: Appointment[] }

// Demo mode: the whole database lives in this browser's localStorage, seeded with
// two months of realistic history so the dashboard has something to show.
const KEY = 'glow-studio-db-v2'
const listeners = new Set<() => void>()
let db: Db // loaded at the bottom of this file, once the seed data below is defined

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Db
      // Demo dates are relative to the seed day, so refresh them once they go stale.
      if (parsed.version === 1 && parsed.seededOn >= addDays(today(), -7)) return parsed
    }
  } catch {
    /* storage blocked or corrupt: fall back to fresh demo data */
  }
  return seed()
}

function commit(next: Db) {
  db = next
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* private mode: changes last for this visit only */
  }
  listeners.forEach((l) => l())
}

export function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useDb() {
  return useSyncExternalStore(subscribe, () => db)
}

export const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`

export function resetDemoData() {
  commit(seed())
}

export function updateAppointment(id: string, patch: Partial<Appointment>) {
  commit({ ...db, appointments: db.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)) })
}

export function updateClient(id: string, patch: Partial<Client>) {
  commit({ ...db, clients: db.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) })
}

const normalisePhone = (p: string) => p.replace(/\D/g, '').slice(-9)

// One booking can involve several specialists: services run back to back and each one is
// given to a stylist who does that category and is free at that moment.
export type Segment = { staffId: string; serviceIds: string[]; start: number; duration: number; price: number }

// Finds the client by phone number (or creates them) and books every segment of the plan.
export function createBooking(input: { name: string; phone: string; email: string; notes?: string; date: string; plan: Segment[]; source?: Source }) {
  let client = db.clients.find((c) => normalisePhone(c.phone) === normalisePhone(input.phone))
  const clients = [...db.clients]
  if (!client) {
    client = { id: uid('cl'), name: input.name, phone: input.phone, email: input.email, createdAt: today() }
    clients.push(client)
  }
  const booked: Appointment[] = input.plan.map((seg) => ({
    id: uid('ap'),
    clientId: client.id,
    staffId: seg.staffId,
    serviceIds: seg.serviceIds,
    date: input.date,
    start: seg.start,
    duration: seg.duration,
    price: seg.price,
    status: 'confirmed',
    source: input.source ?? 'online',
    notes: input.notes,
    createdAt: today(),
  }))
  commit({ ...db, clients, appointments: [...db.appointments, ...booked] })
  return booked
}

// ---------- availability ----------

export const SLOT_STEP = 15

export const canDo = (staffId: string, category: Category) => STAFF.find((x) => x.id === staffId)!.specialties.includes(category)

export function isBusy(staffId: string, date: string, start: number, duration: number, ignoreId?: string) {
  return db.appointments.some(
    (a) =>
      a.staffId === staffId &&
      a.date === date &&
      a.id !== ignoreId &&
      a.status !== 'cancelled' &&
      a.status !== 'no-show' &&
      start < a.start + a.duration &&
      a.start < start + duration,
  )
}

function freeAt(staffId: string, date: string, start: number, duration: number, ignoreId?: string) {
  const s = STAFF.find((x) => x.id === staffId)!
  return s.workDays.includes(weekday(date)) && start >= s.start && start + duration <= s.end && !isBusy(staffId, date, start, duration, ignoreId)
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items]
  return items.flatMap((x, i) => permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [x, ...rest]))
}

// Schedules the services back to back from `start`, trying other orders when the chosen one
// doesn't fit (up to four services, like a receptionist juggling the diary would).
export function planBooking(date: string, start: number, serviceIds: string[], preferred: string | 'any', ignoreId?: string): Segment[] | null {
  const orders = serviceIds.length <= 4 ? permutations(serviceIds) : [serviceIds]
  for (const order of orders) {
    const plan = planInOrder(date, start, order, preferred, ignoreId)
    if (plan) return plan
  }
  return null
}

// A preferred stylist takes every service they can do; the rest go to whoever is free,
// staying with the same person where possible.
function planInOrder(date: string, start: number, serviceIds: string[], preferred: string | 'any', ignoreId?: string): Segment[] | null {
  const plan: Segment[] = []
  let t = start
  for (const id of serviceIds) {
    const service = serviceById(id)
    if (!service) return null
    const capable = STAFF.filter((s) => canDo(s.id, service.category)).map((s) => s.id)
    const pool = preferred !== 'any' && capable.includes(preferred) ? [preferred] : capable
    const last = plan.at(-1)?.staffId
    const ordered = last && pool.includes(last) ? [last, ...pool.filter((p) => p !== last)] : pool
    const who = ordered.find((p) => freeAt(p, date, t, service.duration, ignoreId))
    if (!who) return null
    const prev = plan.at(-1)
    if (prev && prev.staffId === who) {
      prev.serviceIds.push(id)
      prev.duration += service.duration
      prev.price += service.price
    } else {
      plan.push({ staffId: who, serviceIds: [id], start: t, duration: service.duration, price: service.price })
    }
    t += service.duration
  }
  return plan
}

// Every start time on `date` where the whole basket fits.
export function availableSlots(date: string, serviceIds: string[], preferred: string | 'any', ignoreId?: string) {
  if (!serviceIds.length) return []
  const total = serviceIds.reduce((n, id) => n + (serviceById(id)?.duration ?? 0), 0)
  const earliest = date === today() ? Math.ceil((nowMinutes() + 30) / SLOT_STEP) * SLOT_STEP : 0
  const slots: { start: number; plan: Segment[] }[] = []
  for (let t = 600; t + total <= 1260; t += SLOT_STEP) {
    if (t < earliest) continue
    const plan = planBooking(date, t, serviceIds, preferred, ignoreId)
    if (plan) slots.push({ start: t, plan })
  }
  return slots
}

// The soonest hour any stylist has free, for the "next free slot" badge.
export function nextFreeSlot(duration = 60) {
  for (let i = 0; i < 7; i++) {
    const date = addDays(today(), i)
    const earliest = i === 0 ? Math.ceil((nowMinutes() + 30) / SLOT_STEP) * SLOT_STEP : 0
    for (let t = Math.max(600, earliest); t + duration <= 1260; t += SLOT_STEP) {
      const who = STAFF.find((s) => freeAt(s.id, date, t, duration))
      if (who) return { date, start: t, staffId: who.id }
    }
  }
  return null
}

// ---------- demo seed ----------

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

const FIRST = ['Mariam', 'Hannah', 'Reem', 'Sara', 'Aisha', 'Noor', 'Lina', 'Dana', 'Fatima', 'Yasmin', 'Chloe', 'Priya', 'Emma', 'Zara', 'Leila', 'Huda', 'Mona', 'Rania', 'Olivia', 'Sophie', 'Amira', 'Jana', 'Tala', 'Maya', 'Nadine', 'Ines', 'Hessa', 'Alia', 'Grace', 'Ruby', 'Khalid', 'Yousef', 'Adam', 'James', 'Faris', 'Rashid', 'Ali', 'Tariq', 'Daniel', 'Hamad']
const LAST = ['Al Mansoori', 'Patel', 'Saleh', 'Haddad', 'Khan', 'Nasser', 'Farouk', 'Rahman', 'Wilson', 'Ibrahim', 'Mendes', 'Aziz', 'Karam', 'Hussein', 'Brown', 'Chen', 'Al Zaabi', 'Murphy', 'Shah', 'Darwish']

function seed(): Db {
  const r = rng(20261026)
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(r() * arr.length)]
  const t0 = today()

  const clients: Client[] = Array.from({ length: 220 }, (_, i) => {
    const first = i < FIRST.length ? FIRST[i] : pick(FIRST)
    const last = pick(LAST)
    return {
      id: `cl_${i}`,
      name: `${first} ${last}`,
      phone: `+971 5${Math.floor(r() * 9)} ${String(Math.floor(r() * 900) + 100)} ${String(Math.floor(r() * 9000) + 1000)}`,
      email: `${first.toLowerCase()}.${last.toLowerCase().replace(/\s/g, '')}@example.com`,
      createdAt: addDays(t0, -Math.floor(r() * 120) - 1),
    }
  })

  const appointments: Appointment[] = []
  for (let day = -60; day <= 14; day++) {
    const date = addDays(t0, day)
    const wd = weekday(date)
    // Weekends (Fri/Sat/Sun) are busier, future days are less booked.
    const busy = (wd === 5 || wd === 6 || wd === 0 ? 0.78 : 0.6) * (day > 0 ? Math.max(0.25, 0.75 - day * 0.04) : 1)
    for (const s of STAFF) {
      if (!s.workDays.includes(wd)) continue
      let t = s.start + Math.floor(r() * 4) * 15
      while (t < s.end - 45) {
        const options = SERVICES.filter((x) => s.specialties.includes(x.category) && t + x.duration <= s.end)
        if (!options.length || r() > busy) {
          t += 30 + Math.floor(r() * 3) * 15
          continue
        }
        const first = pick(options)
        const serviceIds = [first.id]
        const second = r() < 0.25 ? options.find((o) => o.id !== first.id && o.category !== first.category && t + first.duration + o.duration <= s.end) : undefined
        if (second) serviceIds.push(second.id)
        const services = serviceIds.map((id) => serviceById(id)!)
        const duration = services.reduce((n, x) => n + x.duration, 0)
        const past = day < 0 || (day === 0 && t + duration < nowMinutes())
        const roll = r()
        const status: Status = past ? (roll < 0.86 ? 'completed' : roll < 0.94 ? 'cancelled' : 'no-show') : roll < 0.82 ? 'confirmed' : roll < 0.94 ? 'pending' : 'cancelled'
        appointments.push({
          id: `ap_${appointments.length}`,
          clientId: pick(clients).id,
          staffId: s.id,
          serviceIds,
          date,
          start: t,
          duration,
          price: services.reduce((n, x) => n + x.price, 0),
          status,
          source: r() < 0.68 ? 'online' : r() < 0.6 ? 'phone' : 'walk-in',
          createdAt: addDays(date, -Math.floor(r() * 10)),
        })
        t += duration + (r() < 0.5 ? 0 : 15)
      }
    }
  }
  return { version: 1, seededOn: t0, clients, appointments }
}

db = load()
