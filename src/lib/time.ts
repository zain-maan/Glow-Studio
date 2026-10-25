// Dates are local "YYYY-MM-DD" strings and times are minutes from midnight, so they survive
// storage and URLs without time-zone surprises.

export function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function fromISO(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(s: string, n: number) {
  const d = fromISO(s)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

export const today = () => toISO(new Date())

export function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export function weekday(s: string) {
  return fromISO(s).getDay()
}

export function fmtTime(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  const suffix = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 || 12
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`
}

export function fmtDuration(min: number) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (!h) return `${m} min`
  return m ? `${h} h ${m} min` : `${h} h`
}

export function fmtDate(s: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return fromISO(s).toLocaleDateString('en-GB', opts)
}

export function relativeDay(s: string) {
  const t = today()
  if (s === t) return 'Today'
  if (s === addDays(t, 1)) return 'Tomorrow'
  if (s === addDays(t, -1)) return 'Yesterday'
  return fmtDate(s)
}

export const aed = (n: number) => `AED ${n.toLocaleString('en-US')}`
