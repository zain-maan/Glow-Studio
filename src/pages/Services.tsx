import { useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Faq from '../components/Faq'
import { ArrowRight } from '../components/icons'
import Img from '../components/Img'
import PageHero from '../components/PageHero'
import ServiceMenu from '../components/ServiceMenu'
import { CATEGORIES, SERVICES, type Category } from '../data'
import { useReveal } from '../hooks/useReveal'
import { aed } from '../lib/time'

export default function Services() {
  const root = useRef<HTMLDivElement>(null)
  const [params] = useSearchParams()
  const requested = params.get('cat') as Category | null
  const initial = CATEGORIES.some((c) => c.id === requested) ? requested! : 'Hair'
  useReveal(root)

  return (
    <div ref={root}>
      <PageHero
        image="interior"
        eyebrow="Services & prices"
        title={
          <>
            Everything you need to <em className="text-glow">feel like you.</em>
          </>
        }
        text="Transparent prices, honest timings and no upselling. Tap any service to add it to your booking."
        badge={
          <>
            <p className="text-xs text-muted">Starting from</p>
            <p className="font-display text-3xl">{aed(Math.min(...SERVICES.map((s) => s.price)))}</p>
          </>
        }
      >
        <Link to="/book" className="btn btn-glow">
          Book now <ArrowRight size={16} />
        </Link>
      </PageHero>

      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <div className="card p-6 sm:p-10" data-reveal>
          <ServiceMenu key={initial} initial={initial} />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-24 sm:grid-cols-2 sm:px-6 lg:grid-cols-5">
        {CATEGORIES.map((c, i) => (
          <figure key={c.id} data-reveal={i * 0.06} className="group relative overflow-hidden rounded-[2rem]">
            <Img name={c.image} sizes="(min-width: 1024px) 20vw, 50vw" className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-plum/85 to-transparent p-5 text-white">
              <p className="font-display text-3xl">{c.id}</p>
              <p className="text-xs text-white/75">{c.blurb}</p>
            </figcaption>
          </figure>
        ))}
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:pb-32">
        <h2 data-split className="mb-8 font-display text-5xl leading-[1.02]">
          Before you <em className="text-glow">book.</em>
        </h2>
        <Faq />
      </section>
    </div>
  )
}
