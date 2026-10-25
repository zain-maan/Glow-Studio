import type { ReactNode } from 'react'
import type { Status } from '../lib/store'

export const STATUS_STYLE: Record<Status, { label: string; className: string; dot: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  confirmed: { label: 'Confirmed', className: 'bg-violet-50 text-violet-700', dot: 'bg-violet-500' },
  completed: { label: 'Completed', className: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', className: 'bg-stone-100 text-stone-500', dot: 'bg-stone-400' },
  'no-show': { label: 'No-show', className: 'bg-rose-50 text-rose-600', dot: 'bg-rose-500' },
}

export function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_STYLE[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${s.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

export function Panel({ title, action, children, className = '' }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card min-w-0 p-5 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title && <h2 className="font-display text-2xl">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function PageTitle({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl leading-none sm:text-5xl">{title}</h1>
        {sub && <p className="mt-2 text-sm text-muted">{sub}</p>}
      </div>
      {children}
    </div>
  )
}
