import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Star } from '../components/icons'
import Img from '../components/Img'
import PageHero from '../components/PageHero'
import { STAFF } from '../data'
import { useReveal } from '../hooks/useReveal'
import { fmtTime } from '../lib/time'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Team() {
  const root = useRef<HTMLDivElement>(null)
  useReveal(root)

  return (
    <div ref={root}>
      <PageHero
        image="team"
        eyebrow="Our team"
        title={
          <>
            Five experts, <em className="text-glow">one obsession.</em>
          </>
        }
        text="Every stylist is senior, salaried and never rushed. Pick a favourite or let us match you with whoever is free first."
        badge={
          <p className="flex items-center gap-2 font-semibold">
            <Star size={18} fill="currentColor" className="text-gold" /> 4.9 average rating
          </p>
        }
      />

      <section className="mx-auto max-w-7xl space-y-6 px-4 pb-24 sm:px-6 lg:pb-32">
        {STAFF.map((s, i) => (
          <article key={s.id} data-reveal className="card group grid items-center gap-6 overflow-hidden p-4 sm:grid-cols-[220px_1fr] sm:p-5 lg:grid-cols-[260px_1fr_auto] lg:gap-10">
            <div className="overflow-hidden rounded-[1.6rem]" data-reveal-img={i * 0.05}>
              <Img name={s.image} sizes="260px" className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: s.color }}>
                {s.role}
              </p>
              <h2 className="mt-1 font-display text-4xl sm:text-5xl">{s.name}</h2>
              <p className="mt-3 max-w-lg text-muted">{s.bio}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {s.specialties.map((c) => (
                  <span key={c} className="rounded-full bg-blush px-3 py-1 text-xs font-semibold">
                    {c}
                  </span>
                ))}
              </div>
              <ul className="mt-5 flex gap-1.5" aria-label="Working days">
                {DAYS.map((d, n) => (
                  <li
                    key={d}
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-[0.65rem] font-bold ${
                      s.workDays.includes(n) ? 'bg-plum text-white' : 'bg-porcelain text-muted/60 line-through'
                    }`}
                  >
                    {d}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">
                {fmtTime(s.start)} – {fmtTime(s.end)}
              </p>
            </div>
            <div className="flex flex-row items-center gap-4 sm:col-span-2 lg:col-span-1 lg:flex-col lg:items-end">
              <p className="flex items-center gap-1 text-lg font-semibold">
                <Star size={16} fill="currentColor" className="text-gold" /> {s.rating}
                <span className="text-sm font-normal text-muted">({s.reviews})</span>
              </p>
              <Link to={`/book?staff=${s.id}`} className="btn btn-glow">
                Book with {s.name.split(' ')[0]} <ArrowRight size={16} />
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}
