// Downloads the site's photos once from Unsplash as resized WebP files into public/images,
// plus a tiny blurred preview of each (src/lqip.json) shown while the real photo loads.
// Usage: node scripts/fetch-images.mjs
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

const PHOTOS = {
  hero: '1522337360788-8b13dee7a37e',
  'hero-portrait': '1531746020798-e6953c6e8e04',
  'pink-portrait': '1519699047748-de8e457a634e',
  interior: '1521590832167-7bcbfaa6381f',
  'interior-bright': '1633681926022-84c23e8cb2d6',
  'interior-dark': '1600948836101-f9ffda59d250',
  hair: '1562322140-8baeececf3df',
  blowdry: '1580618672591-eb180b1a973f',
  facial: '1570172619644-dfd03ed5d881',
  makeup: '1487412947147-5cebf100ffc2',
  nails: '1604654894610-df63bc536371',
  manicure: '1610992015732-2449b76344bc',
  spa: '1596178060671-7a80dc8059ea',
  products: '1540555700478-4be289fbecef',
  brushes: '1516975080664-ed2fc6a32937',
  team: '1559599101-f09722fb4948',
}
// Portraits are cropped around the face.
const PORTRAITS = {
  layla: '1494790108377-be9c29b29330',
  sofia: '1544005313-94ddf0286df2',
  omar: '1507003211169-0a1dd7228f2d',
  nadia: '1438761681033-6461ffad8d80',
  karim: '1500648767791-00dcc994a43e',
  client: '1487412720507-e7ab37603c6f',
}

const outDir = new URL('../public/images/', import.meta.url)
mkdirSync(outDir, { recursive: true })

async function get(url, tries = 6) {
  for (let i = 1; i <= tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(240_000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return Buffer.from(await res.arrayBuffer())
    } catch (err) {
      console.log(`  retry ${i}/${tries}: ${err.message}`)
      await new Promise((r) => setTimeout(r, 3000 * i))
    }
  }
  throw new Error(`failed: ${url}`)
}

const lqip = {}
const jobs = [
  ...Object.entries(PHOTOS).map(([name, id]) => ({ name, id, widths: [640, 1280], extra: '' })),
  ...Object.entries(PORTRAITS).map(([name, id]) => ({ name, id, widths: [400, 800], extra: '&crop=faces&h=WIDTH' })),
]
for (const { name, id, widths, extra } of jobs) {
  const base = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&fm=webp`
  for (const w of widths) {
    const file = new URL(`${name}-${w}.webp`, outDir)
    if (existsSync(file)) continue
    const size = extra.replace('WIDTH', String(Math.round(w * 1.25)))
    writeFileSync(file, await get(`${base}&w=${w}&q=${w > 1000 ? 62 : 70}${size}`))
    console.log(`saved ${name}-${w}.webp`)
  }
  const tiny = await get(`${base}&w=20&q=30&blur=40${extra.replace('WIDTH', '25')}`)
  lqip[name] = `data:image/webp;base64,${tiny.toString('base64')}`
}
writeFileSync(new URL('../src/lqip.json', import.meta.url), JSON.stringify(lqip, null, 2) + '\n')
console.log('DONE')
