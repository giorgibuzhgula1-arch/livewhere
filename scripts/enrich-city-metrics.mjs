/**
 * One-off generator: merges lifestyle metrics into lib/recommendation/index.ts CITIES array.
 * Run: node scripts/enrich-city-metrics.mjs
 */
import fs from 'fs'
import path from 'path'

const INDEX_PATH = path.join(process.cwd(), 'lib/recommendation/index.ts')

/** @type {Record<string, { airport: number, internet: number, walk: number, expat: number, visa: number }>} */
const METRICS = {
  'Dubai|United Arab Emirates': { airport: 98, internet: 92, walk: 52, expat: 88, visa: 62 },
  'Abu Dhabi|United Arab Emirates': { airport: 95, internet: 90, walk: 48, expat: 82, visa: 62 },
  'Sharjah|United Arab Emirates': { airport: 88, internet: 86, walk: 45, expat: 70, visa: 62 },
  'Doha|Qatar': { airport: 96, internet: 88, walk: 50, expat: 78, visa: 48 },
  'Manama|Bahrain': { airport: 90, internet: 82, walk: 48, expat: 72, visa: 55 },
  'Muscat|Oman': { airport: 88, internet: 78, walk: 42, expat: 68, visa: 55 },
  'Haifa|Israel': { airport: 82, internet: 88, walk: 72, expat: 58, visa: 48 },
  'Jerusalem|Israel': { airport: 80, internet: 86, walk: 78, expat: 62, visa: 48 },
  'Tel Aviv|Israel': { airport: 92, internet: 92, walk: 82, expat: 72, visa: 48 },
  'Casablanca|Morocco': { airport: 88, internet: 68, walk: 62, expat: 58, visa: 58 },
  'Fes|Morocco': { airport: 72, internet: 58, walk: 75, expat: 52, visa: 58 },
  'Marrakech|Morocco': { airport: 85, internet: 65, walk: 70, expat: 68, visa: 58 },
  'Rabat|Morocco': { airport: 82, internet: 66, walk: 65, expat: 55, visa: 58 },
  'Johannesburg|South Africa': { airport: 90, internet: 72, walk: 42, expat: 62, visa: 55 },
  'Cape Town|South Africa': { airport: 92, internet: 75, walk: 58, expat: 72, visa: 55 },
  'Durban|South Africa': { airport: 78, internet: 68, walk: 48, expat: 55, visa: 55 },
  'Port Elizabeth|South Africa': { airport: 68, internet: 62, walk: 45, expat: 48, visa: 55 },
  'Boquete|Panama': { airport: 62, internet: 72, walk: 55, expat: 78, visa: 72 },
  'Panama City|Panama': { airport: 94, internet: 82, walk: 58, expat: 82, visa: 72 },
  'San Jose|Costa Rica': { airport: 88, internet: 78, walk: 65, expat: 72, visa: 70 },
  'Tamarindo|Costa Rica': { airport: 72, internet: 70, walk: 52, expat: 76, visa: 70 },
  'Punta Cana|Dominican Republic': { airport: 92, internet: 68, walk: 42, expat: 70, visa: 68 },
  'Santiago|Dominican Republic': { airport: 78, internet: 65, walk: 55, expat: 58, visa: 68 },
  'Santo Domingo|Dominican Republic': { airport: 90, internet: 70, walk: 58, expat: 65, visa: 68 },
  'Mexico City|Mexico': { airport: 95, internet: 78, walk: 72, expat: 78, visa: 58 },
  'Guadalajara|Mexico': { airport: 88, internet: 75, walk: 62, expat: 68, visa: 58 },
  'Monterrey|Mexico': { airport: 86, internet: 76, walk: 48, expat: 62, visa: 58 },
  'Cancun|Mexico': { airport: 94, internet: 72, walk: 45, expat: 75, visa: 58 },
  'Playa del Carmen|Mexico': { airport: 82, internet: 70, walk: 55, expat: 78, visa: 58 },
  'Merida|Mexico': { airport: 78, internet: 72, walk: 68, expat: 72, visa: 58 },
  'Barranquilla|Colombia': { airport: 82, internet: 68, walk: 52, expat: 55, visa: 62 },
  'Bogota|Colombia': { airport: 92, internet: 76, walk: 68, expat: 72, visa: 62 },
  'Medellin|Colombia': { airport: 88, internet: 82, walk: 72, expat: 85, visa: 62 },
  'Cali|Colombia': { airport: 85, internet: 72, walk: 58, expat: 58, visa: 62 },
  'Cartagena|Colombia': { airport: 86, internet: 70, walk: 75, expat: 70, visa: 62 },
  'Arequipa|Peru': { airport: 72, internet: 62, walk: 72, expat: 55, visa: 62 },
  'Cusco|Peru': { airport: 78, internet: 58, walk: 78, expat: 62, visa: 62 },
  'Lima|Peru': { airport: 92, internet: 72, walk: 58, expat: 68, visa: 62 },
  'Cuenca|Ecuador': { airport: 68, internet: 65, walk: 78, expat: 72, visa: 72 },
  'Guayaquil|Ecuador': { airport: 85, internet: 68, walk: 52, expat: 55, visa: 72 },
  'Quito|Ecuador': { airport: 90, internet: 70, walk: 70, expat: 65, visa: 72 },
  'Concepcion|Chile': { airport: 72, internet: 78, walk: 62, expat: 52, visa: 60 },
  'Santiago|Chile': { airport: 94, internet: 82, walk: 68, expat: 68, visa: 60 },
  'Valparaiso|Chile': { airport: 78, internet: 75, walk: 72, expat: 58, visa: 60 },
  'Buenos Aires|Argentina': { airport: 94, internet: 78, walk: 82, expat: 78, visa: 68 },
  'Cordoba|Argentina': { airport: 82, internet: 72, walk: 68, expat: 58, visa: 68 },
  'Mendoza|Argentina': { airport: 78, internet: 70, walk: 65, expat: 62, visa: 68 },
  'Montevideo|Uruguay': { airport: 88, internet: 82, walk: 78, expat: 72, visa: 72 },
  'Punta del Este|Uruguay': { airport: 75, internet: 78, walk: 55, expat: 68, visa: 72 },
  'Paris|France': { airport: 96, internet: 92, walk: 88, expat: 82, visa: 55 },
  'Lyon|France': { airport: 88, internet: 88, walk: 82, expat: 65, visa: 55 },
  'Marseille|France': { airport: 90, internet: 85, walk: 75, expat: 62, visa: 55 },
  'Nice|France': { airport: 92, internet: 88, walk: 78, expat: 70, visa: 55 },
  'Toulouse|France': { airport: 85, internet: 86, walk: 80, expat: 58, visa: 55 },
  'Berlin|Germany': { airport: 94, internet: 90, walk: 85, expat: 75, visa: 52 },
  'Munich|Germany': { airport: 96, internet: 92, walk: 82, expat: 72, visa: 52 },
  'Hamburg|Germany': { airport: 92, internet: 90, walk: 84, expat: 68, visa: 52 },
  'Frankfurt|Germany': { airport: 98, internet: 94, walk: 78, expat: 78, visa: 52 },
  'Graz|Austria': { airport: 78, internet: 88, walk: 82, expat: 55, visa: 54 },
  'Salzburg|Austria': { airport: 82, internet: 86, walk: 85, expat: 58, visa: 54 },
  'Vienna|Austria': { airport: 94, internet: 90, walk: 88, expat: 72, visa: 54 },
  'Zurich|Switzerland': { airport: 97, internet: 96, walk: 86, expat: 78, visa: 44 },
  'Geneva|Switzerland': { airport: 95, internet: 95, walk: 84, expat: 82, visa: 44 },
  'Basel|Switzerland': { airport: 88, internet: 94, walk: 88, expat: 65, visa: 44 },
  'Amsterdam|Netherlands': { airport: 96, internet: 94, walk: 92, expat: 82, visa: 52 },
  'Rotterdam|Netherlands': { airport: 88, internet: 92, walk: 85, expat: 68, visa: 52 },
  'The Hague|Netherlands': { airport: 85, internet: 92, walk: 86, expat: 72, visa: 52 },
  'Brussels|Belgium': { airport: 94, internet: 90, walk: 82, expat: 75, visa: 52 },
  'Antwerp|Belgium': { airport: 85, internet: 88, walk: 84, expat: 62, visa: 52 },
  'Luxembourg|Luxembourg': { airport: 82, internet: 92, walk: 80, expat: 68, visa: 50 },
  'Copenhagen|Denmark': { airport: 94, internet: 96, walk: 90, expat: 72, visa: 50 },
  'Aarhus|Denmark': { airport: 78, internet: 94, walk: 88, expat: 58, visa: 50 },
  'Odense|Denmark': { airport: 72, internet: 92, walk: 82, expat: 52, visa: 50 },
  'Oslo|Norway': { airport: 94, internet: 95, walk: 85, expat: 68, visa: 48 },
  'Bergen|Norway': { airport: 82, internet: 92, walk: 80, expat: 55, visa: 48 },
  'Stavanger|Norway': { airport: 78, internet: 90, walk: 72, expat: 58, visa: 48 },
  'Madrid|Spain': { airport: 96, internet: 90, walk: 85, expat: 78, visa: 60 },
  'Barcelona|Spain': { airport: 94, internet: 88, walk: 88, expat: 88, visa: 60 },
  'Valencia|Spain': { airport: 88, internet: 86, walk: 82, expat: 75, visa: 60 },
  'Malaga|Spain': { airport: 90, internet: 84, walk: 78, expat: 82, visa: 60 },
  'Lisbon|Portugal': { airport: 92, internet: 88, walk: 85, expat: 92, visa: 78 },
  'Porto|Portugal': { airport: 88, internet: 86, walk: 82, expat: 85, visa: 78 },
  'Braga|Portugal': { airport: 72, internet: 82, walk: 78, expat: 62, visa: 78 },
  'Faro|Portugal': { airport: 85, internet: 84, walk: 72, expat: 78, visa: 78 },
  'Rome|Italy': { airport: 94, internet: 86, walk: 82, expat: 75, visa: 58 },
  'Milan|Italy': { airport: 96, internet: 88, walk: 80, expat: 78, visa: 58 },
  'Florence|Italy': { airport: 82, internet: 84, walk: 88, expat: 72, visa: 58 },
  'Naples|Italy': { airport: 88, internet: 78, walk: 75, expat: 58, visa: 58 },
  'Venice|Italy': { airport: 85, internet: 82, walk: 92, expat: 68, visa: 58 },
  'Athens|Greece': { airport: 92, internet: 82, walk: 78, expat: 72, visa: 60 },
  'Crete (Heraklion)|Greece': { airport: 85, internet: 75, walk: 65, expat: 65, visa: 60 },
  'Rhodes|Greece': { airport: 82, internet: 72, walk: 68, expat: 62, visa: 60 },
  'Thessaloniki|Greece': { airport: 88, internet: 80, walk: 72, expat: 58, visa: 60 },
  'Limassol|Cyprus': { airport: 82, internet: 84, walk: 62, expat: 78, visa: 66 },
  'Warsaw|Poland': { airport: 92, internet: 88, walk: 78, expat: 68, visa: 58 },
  'Krakow|Poland': { airport: 85, internet: 86, walk: 82, expat: 72, visa: 58 },
  'Wroclaw|Poland': { airport: 82, internet: 85, walk: 80, expat: 62, visa: 58 },
  'Brno|Czech Republic': { airport: 78, internet: 86, walk: 78, expat: 58, visa: 58 },
  'Prague|Czech Republic': { airport: 92, internet: 88, walk: 85, expat: 78, visa: 58 },
  'Ljubljana|Slovenia': { airport: 82, internet: 86, walk: 85, expat: 62, visa: 62 },
  'Zagreb|Croatia': { airport: 88, internet: 84, walk: 78, expat: 65, visa: 64 },
  'Dubrovnik|Croatia': { airport: 78, internet: 78, walk: 82, expat: 68, visa: 64 },
  'Split|Croatia': { airport: 85, internet: 80, walk: 80, expat: 65, visa: 64 },
  'Tallinn|Estonia': { airport: 88, internet: 92, walk: 82, expat: 72, visa: 62 },
  'Riga|Latvia': { airport: 85, internet: 88, walk: 78, expat: 62, visa: 60 },
  'Vilnius|Lithuania': { airport: 86, internet: 90, walk: 80, expat: 65, visa: 62 },
  'Bangkok|Thailand': { airport: 96, internet: 88, walk: 62, expat: 82, visa: 62 },
  'Chiang Mai|Thailand': { airport: 82, internet: 85, walk: 68, expat: 88, visa: 62 },
  'Hua Hin|Thailand': { airport: 72, internet: 78, walk: 52, expat: 75, visa: 62 },
  'Pattaya|Thailand': { airport: 78, internet: 80, walk: 48, expat: 78, visa: 62 },
  'Phuket|Thailand': { airport: 92, internet: 82, walk: 45, expat: 82, visa: 62 },
  'Singapore|Singapore': { airport: 99, internet: 98, walk: 78, expat: 85, visa: 45 },
  'Johor Bahru|Malaysia': { airport: 82, internet: 82, walk: 48, expat: 65, visa: 68 },
  'Kuala Lumpur|Malaysia': { airport: 94, internet: 88, walk: 58, expat: 78, visa: 68 },
  'Penang|Malaysia': { airport: 85, internet: 85, walk: 65, expat: 75, visa: 68 },
  'Jakarta|Indonesia': { airport: 92, internet: 72, walk: 42, expat: 68, visa: 62 },
  'Bali|Indonesia': { airport: 88, internet: 78, walk: 52, expat: 85, visa: 62 },
  'Lombok|Indonesia': { airport: 72, internet: 62, walk: 45, expat: 58, visa: 62 },
  'Surabaya|Indonesia': { airport: 85, internet: 70, walk: 45, expat: 55, visa: 62 },
  'Yogyakarta|Indonesia': { airport: 78, internet: 68, walk: 62, expat: 62, visa: 62 },
  'Da Nang|Vietnam': { airport: 88, internet: 82, walk: 55, expat: 72, visa: 62 },
  'Hanoi|Vietnam': { airport: 92, internet: 80, walk: 68, expat: 68, visa: 62 },
  'Ho Chi Minh City|Vietnam': { airport: 94, internet: 85, walk: 62, expat: 75, visa: 62 },
  'Cebu|Philippines': { airport: 88, internet: 72, walk: 48, expat: 65, visa: 58 },
  'Davao|Philippines': { airport: 82, internet: 68, walk: 42, expat: 55, visa: 58 },
  'Manila|Philippines': { airport: 94, internet: 75, walk: 45, expat: 72, visa: 58 },
  'Tokyo|Japan': { airport: 98, internet: 96, walk: 82, expat: 68, visa: 36 },
  'Osaka|Japan': { airport: 94, internet: 94, walk: 78, expat: 62, visa: 36 },
  'Kyoto|Japan': { airport: 82, internet: 90, walk: 85, expat: 58, visa: 36 },
  'Fukuoka|Japan': { airport: 90, internet: 92, walk: 75, expat: 55, visa: 36 },
  'Sapporo|Japan': { airport: 88, internet: 90, walk: 72, expat: 52, visa: 36 },
  'Sydney|Australia': { airport: 96, internet: 88, walk: 72, expat: 78, visa: 48 },
  'Melbourne|Australia': { airport: 94, internet: 90, walk: 82, expat: 82, visa: 48 },
  'Brisbane|Australia': { airport: 92, internet: 86, walk: 65, expat: 68, visa: 48 },
  'Perth|Australia': { airport: 90, internet: 85, walk: 58, expat: 65, visa: 48 },
  'Adelaide|Australia': { airport: 85, internet: 84, walk: 68, expat: 58, visa: 48 },
  'Auckland|New Zealand': { airport: 94, internet: 88, walk: 62, expat: 72, visa: 50 },
  'Wellington|New Zealand': { airport: 88, internet: 86, walk: 78, expat: 65, visa: 50 },
  'Christchurch|New Zealand': { airport: 85, internet: 84, walk: 68, expat: 58, visa: 50 },
  'Seoul|South Korea': { airport: 97, internet: 98, walk: 80, expat: 65, visa: 42 },
  'Busan|South Korea': { airport: 90, internet: 95, walk: 72, expat: 58, visa: 42 },
  'Valletta|Malta': { airport: 85, internet: 88, walk: 88, expat: 82, visa: 72 },
  'Sliema|Malta': { airport: 82, internet: 86, walk: 75, expat: 78, visa: 72 },
  'Victoria|Seychelles': { airport: 78, internet: 65, walk: 55, expat: 52, visa: 55 },
  'Beau Vallon|Seychelles': { airport: 75, internet: 62, walk: 48, expat: 55, visa: 55 },
}

const src = fs.readFileSync(INDEX_PATH, 'utf8')
const cityLineRe =
  /\{\s*name:\s*"([^"]+)",\s*country:\s*"([^"]+)",\s*avg_temp:\s*(-?\d+),\s*tax_rate:\s*(\d+),\s*rent_usd:\s*(\d+),\s*safety:\s*([\d.]+),\s*healthcare:\s*([\d.]+),\s*stability_score:\s*(\d+)\s*\}/g

let missing = []
const lines = []
let match
while ((match = cityLineRe.exec(src)) !== null) {
  const [full, name, country, avg_temp, tax_rate, rent_usd, safety, healthcare, stability_score] =
    match
  const key = `${name}|${country}`
  let taxRate = Number(tax_rate)
  if (name === 'Aarhus' && country === 'Denmark') {
    taxRate = 32 // yields tax score 20 via 100 - tax_rate * 2.5
  }
  const m = METRICS[key]
  if (!m) {
    missing.push(key)
    continue
  }
  lines.push(
    `  { name: "${name}", country: "${country}", avg_temp: ${avg_temp}, tax_rate: ${taxRate}, rent_usd: ${rent_usd}, safety: ${safety}, healthcare: ${healthcare}, stability_score: ${stability_score}, airportScore: ${m.airport}, internetScore: ${m.internet}, walkabilityScore: ${m.walk}, expatCommunityScore: ${m.expat}, visaAccessScore: ${m.visa} },`,
  )
}

if (missing.length) {
  console.error('Missing metrics for:', missing)
  process.exit(1)
}

const typeBlock = `export type CityRow = {
  name: string
  country: string
  avg_temp: number
  tax_rate: number
  rent_usd: number
  safety: number
  healthcare: number
  stability_score: number
  airportScore: number
  internetScore: number
  walkabilityScore: number
  expatCommunityScore: number
  visaAccessScore: number
}`

let out = src.replace(
  /export type CityRow = \{[\s\S]*?\}/,
  typeBlock,
)

const citiesBlock = `export const CITIES: CityRow[] = [\n${lines.join('\n')}\n]`
out = out.replace(/export const CITIES: CityRow\[\] = \[[\s\S]*?\n\]/, citiesBlock)

fs.writeFileSync(INDEX_PATH, out)
console.log(`Updated ${lines.length} cities in ${INDEX_PATH}`)
