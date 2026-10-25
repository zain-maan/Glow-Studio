import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap, prefersReducedMotion } from '../lib/motion'

// Lightweight SVG charts drawn by hand, so the dashboard needs no charting library.

type Point = { label: string; value: number }

export function AreaChart({ data, format, height = 240 }: { data: Point[]; format: (n: number) => string; height?: number }) {
  const id = useId()
  const svg = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const W = 640
  const H = height
  const pad = { t: 16, r: 8, b: 26, l: 8 }
  const max = Math.max(1, ...data.map((d) => d.value)) * 1.12
  const x = (i: number) => pad.l + (i / Math.max(1, data.length - 1)) * (W - pad.l - pad.r)
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b)

  const { line, area } = useMemo(() => {
    // Smooth the line with simple cubic segments between points.
    const pts = data.map((d, i) => [x(i), y(d.value)] as const)
    let l = ''
    pts.forEach(([px, py], i) => {
      if (!i) l = `M${px},${py}`
      else {
        const [qx, qy] = pts[i - 1]
        const cx = (qx + px) / 2
        l += ` C${cx},${qy} ${cx},${py} ${px},${py}`
      }
    })
    return { line: l, area: `${l} L${x(data.length - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z` }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, max])

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !svg.current) return
    const path = svg.current.querySelector<SVGPathElement>('[data-line]')!
    const len = path.getTotalLength()
    gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.4, ease: 'power3.out' })
    gsap.fromTo(svg.current.querySelector('[data-area]'), { opacity: 0 }, { opacity: 1, duration: 1.2, delay: 0.3 })
  }, [data])

  function onMove(e: React.PointerEvent) {
    const r = svg.current!.getBoundingClientRect()
    const rel = ((e.clientX - r.left) / r.width) * W
    const i = Math.round(((rel - pad.l) / (W - pad.l - pad.r)) * (data.length - 1))
    setHover(Math.max(0, Math.min(data.length - 1, i)))
  }

  const ticks = data.length > 10 ? data.map((_, i) => i).filter((i) => i % Math.ceil(data.length / 6) === 0) : data.map((_, i) => i)

  return (
    <div className="relative">
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Revenue over time">
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff6f91" stopOpacity="0.35" />
            <stop offset="1" stopColor="#ff6f91" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${id}-stroke`} x1="0" x2="1">
            <stop offset="0" stopColor="#ffb199" />
            <stop offset="0.5" stopColor="#ff6f91" />
            <stop offset="1" stopColor="#c86dd7" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={pad.l} x2={W - pad.r} y1={pad.t + f * (H - pad.t - pad.b)} y2={pad.t + f * (H - pad.t - pad.b)} stroke="#ecdcd6" strokeDasharray="3 5" />
        ))}
        <path data-area d={area} fill={`url(#${id}-fill)`} />
        <path data-line d={line} fill="none" stroke={`url(#${id}-stroke)`} strokeWidth="3" strokeLinecap="round" />
        {ticks.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} fontSize="11" fill="#7b6874">
            {data[i].label}
          </text>
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="#2b1330" strokeOpacity="0.15" />
            <circle cx={x(hover)} cy={y(data[hover].value)} r="6" fill="white" stroke="#ff6f91" strokeWidth="3" />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-xl bg-plum px-3 py-2 text-xs text-white shadow-lg"
          style={{ left: `${(x(hover) / W) * 100}%` }}
        >
          <p className="text-white/60">{data[hover].label}</p>
          <p className="font-semibold">{format(data[hover].value)}</p>
        </div>
      )}
    </div>
  )
}

export function Donut({ data, center }: { data: { label: string; value: number; color: string }[]; center: React.ReactNode }) {
  const ref = useRef<SVGSVGElement>(null)
  const total = data.reduce((n, d) => n + d.value, 0) || 1
  const R = 70
  const C = 2 * Math.PI * R
  let offset = 0

  useLayoutEffect(() => {
    if (prefersReducedMotion() || !ref.current) return
    const tweens = [...ref.current.querySelectorAll<SVGCircleElement>('circle[data-seg]')].map((seg, i) =>
      gsap.fromTo(
        seg,
        { attr: { 'stroke-dasharray': `0 ${C}` } },
        { attr: { 'stroke-dasharray': seg.getAttribute('stroke-dasharray')! }, duration: 1.2, ease: 'power3.out', delay: i * 0.08 },
      ),
    )
    return () => tweens.forEach((t) => t.progress(1).kill())
  }, [data, C])

  return (
    <div className="relative mx-auto w-full max-w-[220px]">
      <svg ref={ref} viewBox="0 0 180 180" className="-rotate-90" role="img" aria-label="Share of revenue by category">
        <circle cx="90" cy="90" r={R} fill="none" stroke="#f7e4de" strokeWidth="18" />
        {data.map((d) => {
          const len = (d.value / total) * C
          const seg = (
            <circle key={d.label} data-seg cx="90" cy="90" r={R} fill="none" stroke={d.color} strokeWidth="18" strokeDasharray={`${Math.max(0, len - 3)} ${C}`} strokeDashoffset={-offset} strokeLinecap="round" />
          )
          offset += len
          return seg
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>
    </div>
  )
}

export function Sparkline({ values, color = '#ff6f91' }: { values: number[]; color?: string }) {
  const max = Math.max(1, ...values)
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * 100},${30 - (v / max) * 26}`).join(' ')
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className="h-8 w-24" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function BarList({ items, format }: { items: { label: string; value: number; color?: string; sub?: string }[]; format: (n: number) => string }) {
  const ref = useRef<HTMLUListElement>(null)
  const max = Math.max(1, ...items.map((i) => i.value))
  useLayoutEffect(() => {
    if (prefersReducedMotion() || !ref.current) return
    gsap.from(ref.current.querySelectorAll('[data-bar]'), { scaleX: 0, duration: 1, ease: 'power3.out', stagger: 0.06 })
  }, [items])
  return (
    <ul ref={ref} className="space-y-4">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-semibold">
              {i.label}
              {i.sub && <span className="ml-2 font-normal text-muted">{i.sub}</span>}
            </span>
            <span className="shrink-0 text-muted">{format(i.value)}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-blush">
            <div data-bar className="h-full origin-left rounded-full" style={{ width: `${(i.value / max) * 100}%`, background: i.color ?? 'linear-gradient(90deg,#ffb199,#ff6f91,#c86dd7)' }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
