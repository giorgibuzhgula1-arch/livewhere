import { NUMBEO_FALLBACK, NumbeoSnapshot } from '@/lib/recommendation/numbeo-fallback'

const cache = new Map<string, NumbeoSnapshot>()

function parseRentUsd(prices: { item_name?: string; average_price?: number; usd_price?: number }[]): number | null {
  const rentItems = prices.filter((p) => {
    const name = (p.item_name ?? '').toLowerCase()
    return name.includes('apartment') && name.includes('1 bedroom')
  })
  if (rentItems.length === 0) return null

  const centre = rentItems.find((p) => p.item_name?.toLowerCase().includes('city centre'))
  const pick = centre ?? rentItems[0]
  const usd = pick.usd_price ?? pick.average_price
  return typeof usd === 'number' && usd > 0 ? Math.round(usd) : null
}

function parseMonthlyCostUsd(rent: number, prices: { item_name?: string; usd_price?: number; average_price?: number }[]): number {
  const meal = prices.find((p) => (p.item_name ?? '').includes('Meal, Inexpensive Restaurant'))
  const mealUsd = meal?.usd_price ?? meal?.average_price
  const groceries = rent * 0.45 + (typeof mealUsd === 'number' ? mealUsd * 90 : 400)
  return Math.round(rent + groceries + 150)
}

type IndicesResponse = {
  crime_index?: number
  safety_index?: number
}

type PricesResponse = {
  prices?: { item_name?: string; average_price?: number; usd_price?: number }[]
}

export async function fetchNumbeoData(query: string): Promise<NumbeoSnapshot> {
  const cacheKey = query.toLowerCase()
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const fallback = NUMBEO_FALLBACK[query] ?? NUMBEO_FALLBACK[query.split(',')[0].trim()]
  const apiKey = process.env.NUMBEO_API_KEY?.trim()

  if (!apiKey) {
    if (fallback) {
      cache.set(cacheKey, fallback)
      return fallback
    }
    return { monthlyRent: 900, monthlyCost: 1700, safetyIndex: 55, crimeIndex: 45 }
  }

  try {
    const [indicesRes, pricesRes] = await Promise.all([
      fetch(
        `https://www.numbeo.com/api/indices?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}`,
        { next: { revalidate: 86400 } }
      ),
      fetch(
        `https://www.numbeo.com/api/city_prices?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(query)}`,
        { next: { revalidate: 86400 } }
      ),
    ])

    let safetyIndex = fallback?.safetyIndex ?? 55
    let crimeIndex = fallback?.crimeIndex ?? 45

    if (indicesRes.ok) {
      const indices = (await indicesRes.json()) as IndicesResponse
      if (typeof indices.safety_index === 'number') safetyIndex = Math.round(indices.safety_index)
      if (typeof indices.crime_index === 'number') crimeIndex = Math.round(indices.crime_index)
    }

    let monthlyRent = fallback?.monthlyRent ?? 900
    let monthlyCost = fallback?.monthlyCost ?? Math.round(monthlyRent * 1.75)
    if (pricesRes.ok) {
      const pricesBody = (await pricesRes.json()) as PricesResponse
      const prices = pricesBody.prices ?? []
      const parsedRent = parseRentUsd(prices)
      if (parsedRent) monthlyRent = parsedRent
      monthlyCost = parseMonthlyCostUsd(monthlyRent, prices)
    }

    const snapshot: NumbeoSnapshot = {
      monthlyRent,
      monthlyCost: fallback && !pricesRes.ok ? fallback.monthlyCost : monthlyCost,
      safetyIndex,
      crimeIndex,
    }

    cache.set(cacheKey, snapshot)
    return snapshot
  } catch {
    const snap = fallback ?? { monthlyRent: 900, monthlyCost: 1700, safetyIndex: 55, crimeIndex: 45 }
    cache.set(cacheKey, snap)
    return snap
  }
}
