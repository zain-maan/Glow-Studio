import { Link } from 'react-router-dom'
import { OPENING } from '../data'
import { Clock, Mail, MapPin, Phone } from './icons'
import { Logo } from './Nav'

export default function Footer() {
  return (
    <footer className="bg-plum-glow relative overflow-hidden text-white/75">
      <div className="mx-auto max-w-7xl px-4 pt-20 sm:px-6">
        <p className="max-w-4xl font-display text-5xl leading-[1.05] text-white sm:text-7xl">
          Ready for your <em className="text-glow">glow up?</em>
        </p>
        <Link to="/book" className="btn btn-glow mt-8">
          Book an appointment
        </Link>
      </div>

      <div className="mx-auto mt-16 grid max-w-7xl gap-10 border-t border-white/10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            A calm, light-filled studio for hair, skin, nails and spa on Jumeirah Beach Road. Open late, every day.
          </p>
        </div>
        <ul className="space-y-3 text-sm">
          <li className="flex gap-3">
            <MapPin size={17} className="mt-0.5 shrink-0 text-peach" />
            Villa 21, Jumeirah Beach Road, Dubai
          </li>
          <li className="flex gap-3">
            <Clock size={17} className="mt-0.5 shrink-0 text-peach" />
            {OPENING.days}, {OPENING.hours}
          </li>
          <li className="flex gap-3">
            <Phone size={17} className="mt-0.5 shrink-0 text-peach" />
            +971 4 000 0000
          </li>
          <li className="flex gap-3">
            <Mail size={17} className="mt-0.5 shrink-0 text-peach" />
            hello@glowstudio.example
          </li>
        </ul>
        <ul className="space-y-3 text-sm">
          <li><Link className="hover:text-white" to="/services">Services & prices</Link></li>
          <li><Link className="hover:text-white" to="/team">Our team</Link></li>
          <li><Link className="hover:text-white" to="/book">Book online</Link></li>
          <li><Link className="hover:text-white" to="/admin">Studio dashboard (demo)</Link></li>
        </ul>
      </div>

      <p className="mx-auto max-w-7xl px-4 pb-8 text-xs text-white/40 sm:px-6">
        © {new Date().getFullYear()} Glow Studio. A concept project: the studio, team and bookings are fictional.
      </p>
      <span aria-hidden="true" className="pointer-events-none absolute -bottom-24 -right-10 select-none font-display text-[16rem] italic leading-none text-white/[0.04] sm:text-[24rem]">
        Glow
      </span>
    </footer>
  )
}
