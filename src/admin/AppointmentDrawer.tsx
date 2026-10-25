import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Calendar, Clock, Mail, Phone, X } from '../components/icons'
import Img from '../components/Img'
import { serviceById, staffById } from '../data'
import { gsap, prefersReducedMotion } from '../lib/motion'
import { availableSlots, updateAppointment, useDb, type Status } from '../lib/store'
import { aed, addDays, fmtDate, fmtTime, today } from '../lib/time'
import { StatusBadge } from './ui'

const ACTIONS: { status: Status; label: string; className: string }[] = [
  { status: 'confirmed', label: 'Confirm', className: 'btn-dark' },
  { status: 'completed', label: 'Mark completed', className: 'btn-glow' },
  { status: 'no-show', label: 'No-show', className: 'btn-ghost' },
  { status: 'cancelled', label: 'Cancel', className: 'btn-ghost' },
]

// Slide-over panel with everything about one appointment, plus status changes and rescheduling.
export default function AppointmentDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const db = useDb()
  const panel = useRef<HTMLDivElement>(null)
  const [moving, setMoving] = useState(false)
  const [newDate, setNewDate] = useState(today())
  const a = db.appointments.find((x) => x.id === id)

  useEffect(() => {
    setMoving(false)
    if (a) setNewDate(a.date >= today() ? a.date : today())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    if (!id) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [id, onClose])

  useLayoutEffect(() => {
    if (!id || !panel.current || prefersReducedMotion()) return
    gsap.fromTo(panel.current, { xPercent: 100 }, { xPercent: 0, duration: 0.5, ease: 'expo.out' })
  }, [id])

  if (!id || !a) return null
  const client = db.clients.find((c) => c.id === a.clientId)
  const staff = staffById(a.staffId)!
  const services = a.serviceIds.map((s) => serviceById(s)!).filter(Boolean)
  const history = db.appointments.filter((x) => x.clientId === a.clientId && x.status === 'completed').length
  // Same stylist, whole appointment, ignoring its own current time.
  const slots = moving ? availableSlots(newDate, a.serviceIds, a.staffId, a.id).filter((s) => s.plan.length === 1 && s.plan[0].staffId === a.staffId) : []

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Appointment details">
      <button className="absolute inset-0 bg-plum/40 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div ref={panel} className="relative flex h-full w-full max-w-md flex-col overflow-y-auto bg-porcelain shadow-2xl">
        <div className="bg-plum-glow p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <StatusBadge status={a.status} />
            <button onClick={onClose} className="-mr-2 -mt-2 rounded-full p-2 hover:bg-white/10" aria-label="Close">
              <X size={20} />
            </button>
          </div>
          <p className="mt-5 font-display text-4xl leading-none">{client?.name ?? 'Unknown client'}</p>
          <p className="mt-2 text-sm text-white/70">{history ? `${history} previous visits` : 'First visit'}</p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <span className="flex items-center gap-2"><Calendar size={15} /> {fmtDate(a.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <span className="flex items-center gap-2"><Clock size={15} /> {fmtTime(a.start)} – {fmtTime(a.start + a.duration)}</span>
          </div>
        </div>

        <div className="flex-1 space-y-6 p-6">
          <div className="card p-5">
            <ul className="space-y-3 text-sm">
              {services.map((s) => (
                <li key={s.id} className="flex justify-between gap-3">
                  <span>
                    <span className="font-semibold">{s.name}</span>
                    <span className="block text-xs text-muted">{s.category} · {s.duration} min</span>
                  </span>
                  <span>{aed(s.price)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex justify-between border-t border-line pt-3 font-bold">
              <span>Total</span>
              <span>{aed(a.price)}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Img name={staff.image} sizes="48px" className="h-12 w-12 rounded-full object-cover" />
            <div className="text-sm">
              <p className="font-semibold">{staff.name}</p>
              <p className="text-muted">{staff.role} · booked {a.source}</p>
            </div>
          </div>

          {client && (
            <div className="space-y-2 text-sm">
              <a href={`tel:${client.phone.replace(/\s/g, '')}`} className="flex items-center gap-3 hover:text-rose"><Phone size={15} className="text-muted" /> {client.phone}</a>
              <a href={`mailto:${client.email}`} className="flex items-center gap-3 hover:text-rose"><Mail size={15} className="text-muted" /> {client.email}</a>
            </div>
          )}
          {a.notes && <p className="rounded-2xl bg-blush p-4 text-sm">“{a.notes}”</p>}

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted">Update status</p>
            <div className="flex flex-wrap gap-2">
              {ACTIONS.filter((x) => x.status !== a.status).map((x) => (
                <button key={x.status} onClick={() => updateAppointment(a.id, { status: x.status })} className={`btn ${x.className} !px-4 !py-2 text-sm`}>
                  {x.label}
                </button>
              ))}
            </div>
          </div>

          {a.status !== 'completed' && (
            <div>
              <button onClick={() => setMoving((m) => !m)} className="text-sm font-semibold text-rose underline-offset-4 hover:underline">
                {moving ? 'Keep current time' : 'Reschedule…'}
              </button>
              {moving && (
                <div className="mt-4 space-y-4">
                  <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                    {Array.from({ length: 14 }, (_, i) => addDays(today(), i)).map((d) => (
                      <button key={d} onClick={() => setNewDate(d)} aria-pressed={newDate === d} className="chip shrink-0 !px-3 !py-1.5 text-xs">
                        {fmtDate(d, { weekday: 'short', day: 'numeric' })}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map((s) => (
                      <button
                        key={s.start}
                        onClick={() => {
                          updateAppointment(a.id, { date: newDate, start: s.start, status: a.status === 'cancelled' ? 'confirmed' : a.status })
                          setMoving(false)
                        }}
                        className="rounded-xl border border-line bg-white py-2 text-xs font-semibold hover:border-rose hover:text-rose"
                      >
                        {fmtTime(s.start)}
                      </button>
                    ))}
                  </div>
                  {!slots.length && <p className="text-sm text-muted">{staff.name.split(' ')[0]} has no free time that day.</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
