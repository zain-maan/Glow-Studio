// Photos live in public/images (see scripts/fetch-images.mjs) and are referenced by name.
export const PORTRAITS = ['layla', 'sofia', 'omar', 'nadia', 'karim', 'client'] as const

export type ImageName =
  | 'hero'
  | 'hero-portrait'
  | 'pink-portrait'
  | 'interior'
  | 'interior-bright'
  | 'interior-dark'
  | 'hair'
  | 'blowdry'
  | 'facial'
  | 'makeup'
  | 'nails'
  | 'manicure'
  | 'spa'
  | 'products'
  | 'brushes'
  | 'team'
  | (typeof PORTRAITS)[number]

export type Category = 'Hair' | 'Skin' | 'Nails' | 'Makeup' | 'Spa'

export const CATEGORIES: { id: Category; image: ImageName; blurb: string }[] = [
  { id: 'Hair', image: 'hair', blurb: 'Cuts, colour and blow-dries by senior stylists.' },
  { id: 'Skin', image: 'facial', blurb: 'Facials that leave you glowing for days.' },
  { id: 'Nails', image: 'nails', blurb: 'Gel, BIAB and nail art that lasts.' },
  { id: 'Makeup', image: 'makeup', blurb: 'Soft glam to full bridal, camera ready.' },
  { id: 'Spa', image: 'spa', blurb: 'Massage and body rituals to switch off.' },
]

export type Service = {
  id: string
  name: string
  category: Category
  duration: number // minutes
  price: number // AED
  description: string
  popular?: boolean
}

export const SERVICES: Service[] = [
  { id: 'cut-style', name: 'Signature cut & style', category: 'Hair', duration: 60, price: 220, description: 'Consultation, wash, precision cut and a smooth blow-dry finish.', popular: true },
  { id: 'blowdry', name: 'Glossy blow-dry', category: 'Hair', duration: 45, price: 150, description: 'Bouncy volume or sleek and straight, with a gloss treatment.' },
  { id: 'balayage', name: 'Balayage', category: 'Hair', duration: 180, price: 850, description: 'Hand-painted, sun-kissed colour with toner and treatment.', popular: true },
  { id: 'root-colour', name: 'Root colour', category: 'Hair', duration: 90, price: 320, description: 'Single-process colour to refresh your roots.' },
  { id: 'keratin', name: 'Keratin smoothing', category: 'Hair', duration: 150, price: 700, description: 'Frizz-free, glossy hair for up to four months.' },
  { id: 'hydra-facial', name: 'HydraGlow facial', category: 'Skin', duration: 60, price: 450, description: 'Deep cleanse, extraction and serum infusion for instant glow.', popular: true },
  { id: 'brow-lami', name: 'Brow lamination & tint', category: 'Skin', duration: 45, price: 180, description: 'Fuller, brushed-up brows that last six weeks.' },
  { id: 'lash-lift', name: 'Lash lift & tint', category: 'Skin', duration: 60, price: 220, description: 'Curled, darker lashes without extensions.' },
  { id: 'gel-mani', name: 'Gel manicure', category: 'Nails', duration: 45, price: 140, description: 'Shape, cuticle care and a high-shine gel finish.', popular: true },
  { id: 'biab', name: 'BIAB nails', category: 'Nails', duration: 75, price: 220, description: 'Builder gel overlay that strengthens natural nails.' },
  { id: 'spa-pedi', name: 'Spa pedicure', category: 'Nails', duration: 60, price: 180, description: 'Soak, scrub, massage and polish of your choice.' },
  { id: 'soft-glam', name: 'Soft glam makeup', category: 'Makeup', duration: 60, price: 380, description: 'Glowing skin and soft definition for any occasion.' },
  { id: 'bridal', name: 'Bridal makeup & hair', category: 'Makeup', duration: 180, price: 1800, description: 'Trial included. Long-wear, photo-ready bridal look.' },
  { id: 'massage', name: 'Hot stone massage', category: 'Spa', duration: 60, price: 390, description: 'Warm basalt stones melt away deep tension.' },
  { id: 'body-polish', name: 'Rose body polish', category: 'Spa', duration: 45, price: 260, description: 'Exfoliating rose-salt scrub and hydrating wrap.' },
]

export type Staff = {
  id: string
  name: string
  role: string
  image: ImageName
  specialties: Category[]
  rating: number
  reviews: number
  workDays: number[] // 0 = Sunday
  start: number // minutes from midnight
  end: number
  color: string
  bio: string
}

export const STAFF: Staff[] = [
  { id: 'layla', name: 'Layla Haddad', role: 'Creative director', image: 'layla', specialties: ['Hair', 'Makeup'], rating: 4.9, reviews: 412, workDays: [1, 2, 3, 4, 6], start: 600, end: 1140, color: '#ff6f91', bio: 'Twelve years of colour and bridal work across Beirut and Dubai.' },
  { id: 'sofia', name: 'Sofia Marin', role: 'Senior colourist', image: 'sofia', specialties: ['Hair'], rating: 4.9, reviews: 288, workDays: [0, 2, 3, 4, 5], start: 660, end: 1200, color: '#c86dd7', bio: 'Balayage specialist known for soft, lived-in blondes.' },
  { id: 'nadia', name: 'Nadia Rahman', role: 'Skin therapist', image: 'nadia', specialties: ['Skin', 'Spa', 'Nails'], rating: 4.8, reviews: 196, workDays: [0, 1, 3, 5, 6], start: 600, end: 1080, color: '#3fb68b', bio: 'Licensed aesthetician focused on barrier repair and glow.' },
  { id: 'omar', name: 'Omar Khalil', role: 'Stylist & barber', image: 'omar', specialties: ['Hair', 'Spa'], rating: 4.8, reviews: 231, workDays: [1, 2, 4, 5, 6], start: 720, end: 1260, color: '#d9a86c', bio: 'Precision cuts and the best hot stone massage in Jumeirah.' },
  { id: 'karim', name: 'Karim Aziz', role: 'Nail & lash artist', image: 'karim', specialties: ['Nails', 'Skin', 'Makeup'], rating: 4.9, reviews: 174, workDays: [0, 2, 3, 5, 6], start: 600, end: 1140, color: '#ffb199', bio: 'Minimal nail art and lash lifts with a featherlight touch.' },
]

export const OPENING = { days: 'Every day', hours: '10:00 – 21:00' }

export const PACKAGES = [
  { id: 'weekend-reset', name: 'Weekend reset', services: ['blowdry', 'gel-mani', 'hydra-facial'], price: 650, note: 'Save AED 90' },
  { id: 'bridal-glow', name: 'Bridal glow', services: ['bridal', 'hydra-facial', 'gel-mani', 'massage'], price: 2450, note: 'Save AED 330', featured: true },
  { id: 'new-you', name: 'New you', services: ['cut-style', 'root-colour', 'brow-lami'], price: 640, note: 'Save AED 80' },
]

export const TESTIMONIALS = [
  { quote: 'Booked at midnight, got a 10 am slot with Sofia, and walked out with the best balayage of my life.', name: 'Mariam A.', service: 'Balayage', image: 'client' as ImageName },
  { quote: 'The HydraGlow facial is unreal. My skin looked filtered for a week. Nadia is a magician.', name: 'Hannah P.', service: 'HydraGlow facial', image: 'pink-portrait' as ImageName },
  { quote: 'Clean, calm and on time. I love that I can see real availability instead of calling around.', name: 'Reem S.', service: 'Gel manicure', image: 'hero-portrait' as ImageName },
]

export const FAQ = [
  { q: 'Can I book more than one service at once?', a: 'Yes. Add as many services as you like and we will find a stylist and time that fits them back to back.' },
  { q: 'What if I need to cancel?', a: 'Cancel or move your appointment free of charge up to 12 hours before. Later changes may carry a 50% fee.' },
  { q: 'Do you take walk-ins?', a: 'We do when there is space, but booking online is the only way to guarantee your stylist and time.' },
  { q: 'Is there parking?', a: 'Free valet parking for all guests, right outside the studio on Jumeirah Beach Road.' },
]

export const serviceById = (id: string) => SERVICES.find((s) => s.id === id)
export const staffById = (id: string) => STAFF.find((s) => s.id === id)
