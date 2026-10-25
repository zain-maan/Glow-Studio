# Glow Studio: salon booking website + studio dashboard

A full booking system for a fictional hair, skin, nails and spa studio in Jumeirah, Dubai: a public website where clients book real time slots, and a password-protected dashboard where the owner runs the day.

**Live demo:** _add your Vercel link here_ · **Admin demo:** `/admin` → "Explore with the demo account"

![Glow Studio home page](docs/screenshot-home.png)

## The problem

Most salons still take bookings over WhatsApp and phone calls. Clients wait for replies, stylists get double-booked, and the owner has no clear view of revenue or how busy the team is. Glow Studio replaces that with self-service booking and a live dashboard.

## Client website

- **Live "next free slot"** in the hero, calculated from the real diary.
- **Tap-to-add price list** with a floating basket that follows you across pages.
- **Smart booking flow**: services → specialist → date & time → details. Only genuinely free times are shown. A basket that needs different specialists (say, hair and nails) is scheduled back to back with the right person for each service, trying different orders to find the most slots.
- **Packages** that add their services to the basket in one click.
- **Confirmation** with an "Add to calendar" (.ics) file and a link to see the booking in the dashboard.
- Team page with working days and hours, FAQ, reviews.

## Studio dashboard

- **Overview**: today's revenue, bookings, next-7-days load and chair occupancy with week-on-week change; revenue chart (7/30/60 days), revenue by category, today's schedule, top services, team performance and a live feed of online bookings.
- **Calendar**: day view with a column per stylist, shifts and days off shaded, and a "now" line.
- **Appointments**: search by name or phone, filter by status, stylist and date range.
- **Appointment drawer**: confirm, complete, mark no-show, cancel or reschedule into a free slot.
- **Clients**: visits, total spend, last and next visit, VIP badges and full history.
- **Team**: revenue, clients served, occupancy and what's next for each stylist.

## Design and motion

Blush, plum and a peach → rose → orchid "glow" gradient, Instrument Serif with Manrope. Branded intro, page-transition curtain, line-by-line headings (GSAP SplitText), rotating hero word, arch photo reveals, pointer parallax, expanding category panels, a hover photo that follows the cursor over the price list, an endless marquee, animated charts and count-ups. Respects reduced motion, works on phones (bottom tab bar in the dashboard).

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · GSAP (ScrollTrigger, SplitText) · Lenis · React Router · hand-built SVG charts · Vercel

Data runs in **demo mode**: the database (2 months of seeded history, ~220 clients) lives in the browser's localStorage so anyone can try the full system without a backend. The store is a single module (`src/lib/store.ts`), ready to be backed by Supabase.

## Run locally

```bash
npm install
npm run dev
```

`npm run build` creates the production build. `node scripts/fetch-images.mjs` re-downloads the optimised photos.

## Notes

The studio, team, clients and reviews are fictional. Photos from Unsplash.
