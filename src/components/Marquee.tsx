import { Sparkles } from './icons'

const WORDS = ['Balayage', 'HydraGlow facials', 'Gel nails', 'Soft glam', 'Hot stone massage', 'Brow lamination', 'Bridal']

// An endless band of words. The list is rendered twice and shifted by half its width per loop.
export default function Marquee({ reverse = false }: { reverse?: boolean }) {
  const items = [...WORDS, ...WORDS]
  return (
    <div className={`overflow-hidden py-6 ${reverse ? 'bg-plum text-white' : 'bg-glow text-white'}`} aria-hidden="true">
      <div className={`animate-marquee flex w-max items-center ${reverse ? '[animation-direction:reverse]' : ''}`}>
        {items.map((w, i) => (
          <span key={i} className="flex items-center gap-8 pr-8 font-display text-4xl italic sm:text-5xl">
            {w}
            <Sparkles size={22} />
          </span>
        ))}
      </div>
    </div>
  )
}
