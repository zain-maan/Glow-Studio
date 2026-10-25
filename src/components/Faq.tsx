import { useState } from 'react'
import { FAQ } from '../data'
import { Plus } from './icons'

export default function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <div className="divide-y divide-line border-y border-line">
      {FAQ.map((f, i) => {
        const isOpen = open === i
        return (
          <div key={f.q}>
            <button
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
              aria-controls={`faq-${i}`}
              className="flex w-full items-center justify-between gap-6 py-6 text-left"
            >
              <span className="font-display text-2xl sm:text-3xl">{f.q}</span>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line transition-transform duration-500 ${isOpen ? 'bg-glow rotate-45 border-transparent text-white' : ''}`}>
                <Plus size={18} />
              </span>
            </button>
            <div id={`faq-${i}`} className={`grid transition-[grid-template-rows] duration-500 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
              <p className="overflow-hidden text-muted">
                <span className="block max-w-2xl pb-6">{f.a}</span>
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
