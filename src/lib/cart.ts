import { useSyncExternalStore } from 'react'
import { serviceById } from '../data'

// The services a visitor has picked before booking, shared by the menu, the floating
// basket and the booking flow. Kept for the browser session.
const KEY = 'glow-cart'
const listeners = new Set<() => void>()
let items: string[] = read()

function read(): string[] {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((id) => serviceById(id)) : []
  } catch {
    return []
  }
}

function write(next: string[]) {
  items = next
  try {
    sessionStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    /* session storage unavailable: the basket lives for this page only */
  }
  listeners.forEach((l) => l())
}

export const cart = {
  toggle: (id: string) => write(items.includes(id) ? items.filter((x) => x !== id) : [...items, id]),
  add: (ids: string[]) => write([...new Set([...items, ...ids])]),
  set: (ids: string[]) => write(ids),
  clear: () => write([]),
}

export function useCart() {
  const ids = useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => items,
  )
  const services = ids.map((id) => serviceById(id)!)
  return {
    ids,
    services,
    duration: services.reduce((n, s) => n + s.duration, 0),
    total: services.reduce((n, s) => n + s.price, 0),
  }
}
