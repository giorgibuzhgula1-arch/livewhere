import fs from 'fs'
import path from 'path'

const APPROVED = new Set([
  'Portugal', 'Spain', 'Italy', 'France', 'Greece', 'Cyprus', 'Malta', 'Switzerland',
  'Austria', 'Netherlands', 'Belgium', 'Luxembourg', 'Denmark', 'Norway', 'Germany',
  'Slovenia', 'Croatia', 'Czech Republic', 'Poland', 'Estonia', 'Latvia', 'Lithuania',
  'Mexico', 'Costa Rica', 'Panama', 'Uruguay', 'Chile', 'Argentina', 'Dominican Republic',
  'Colombia', 'Ecuador', 'Peru', 'Japan', 'South Korea', 'Singapore', 'Malaysia',
  'Thailand', 'Vietnam', 'Philippines', 'Indonesia', 'New Zealand', 'Australia',
  'United Arab Emirates', 'Qatar', 'Bahrain', 'Oman', 'Israel', 'Morocco',
  'South Africa', 'Mauritius', 'Seychelles',
])

const cityLineRe = /^\s*\{ name: "([^"]+)", country: "([^"]+)"/
const displayLineRe = /^\s*"([^"]+)\|([^"]+)":/

const indexPath = path.join(process.cwd(), 'lib/recommendation/index.ts')
const lines = fs.readFileSync(indexPath, 'utf8').split(/\r?\n/)

let inCities = false
let inDisplay = false
const out: string[] = []
const removedCities: string[] = []
const removedDisplay: string[] = []

for (const line of lines) {
  if (line.includes('export const CITIES: CityRow[] = [')) {
    inCities = true
    out.push(line)
    continue
  }
  if (inCities && line.trim() === ']') {
    inCities = false
    out.push(line)
    continue
  }
  if (inCities) {
    const m = line.match(cityLineRe)
    if (m) {
      const [, name, country] = m
      if (APPROVED.has(country)) {
        out.push(line)
      } else {
        removedCities.push(`${name} (${country})`)
      }
      continue
    }
  }

  if (line.includes('const DISPLAY: Record<string, { continent: string; flag: string }> = {')) {
    inDisplay = true
    out.push(line)
    continue
  }
  if (inDisplay && line.trim() === '}') {
    inDisplay = false
    out.push(line)
    continue
  }
  if (inDisplay) {
    const m = line.match(displayLineRe)
    if (m) {
      const [, name, country] = m
      if (APPROVED.has(country)) {
        out.push(line)
      } else {
        removedDisplay.push(`${name}|${country}`)
      }
      continue
    }
  }

  out.push(line)
}

fs.writeFileSync(indexPath, out.join('\n') + '\n', 'utf8')
console.log('Removed cities:', removedCities.length)
console.log('Removed display:', removedDisplay.length)
console.log('Kept cities:', out.filter((l) => cityLineRe.test(l)).length)
