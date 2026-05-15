import { readFileSync } from 'fs'
import { pathToFileURL } from 'url'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Quick inline test without full TS compile
const COOL = new Set(['tbilisi|georgia'])
const THRESHOLD = 4

async function main() {
  const res = await fetch(
    'https://climate-api.open-meteo.com/v1/climate?latitude=41.72&longitude=44.78&start_date=1991-01-01&end_date=2020-12-31&models=EC_Earth3P_HR&daily=temperature_2m_mean'
  )
  const data = await res.json()
  const temps = data.daily?.temperature_2m_mean?.filter((t) => typeof t === 'number') ?? []
  const mean = temps.reduce((a, b) => a + b, 0) / temps.length
  console.log('Tbilisi API mean temp:', mean, 'count:', temps.length, 'sample:', temps.slice(0, 5))
  console.log('In cool list:', COOL.has('tbilisi|georgia'))
  console.log('Would pass climate high filter:', mean >= 20 && !COOL.has('tbilisi|georgia'))
}

main().catch(console.error)
