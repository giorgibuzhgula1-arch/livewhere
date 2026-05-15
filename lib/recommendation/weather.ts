/** Approximate mean annual °C when climate API fails (1991–2020 style norms). */
const TEMP_FALLBACK: Record<string, number> = {
  Dubai: 28,
  'Panama City': 27,
  Tbilisi: 13,
  Batumi: 19,
  Asuncion: 22,
  Bangkok: 29,
  'Chiang Mai': 26,
  Lisbon: 17,
  Porto: 16,
  Valencia: 18,
  Barcelona: 17,
  Malaga: 19,
  Berlin: 10,
  Munich: 9,
  Vienna: 11,
  Budapest: 12,
  Prague: 10,
  Warsaw: 9,
  Bucharest: 11,
  Sofia: 11,
  Athens: 18,
  Limassol: 21,
  'Mexico City': 18,
  'Playa del Carmen': 27,
  Merida: 26,
  Medellin: 22,
  Cartagena: 28,
  'Buenos Aires': 17,
  Santiago: 15,
  'San Jose': 22,
  Tokyo: 16,
  Seoul: 13,
  Singapore: 27,
  'Kuala Lumpur': 27,
  'Ho Chi Minh City': 28,
  'Da Nang': 26,
  Bali: 27,
  Taipei: 23,
  Zurich: 9,
  London: 11,
  Amsterdam: 10,
  Paris: 12,
  Copenhagen: 9,
  Miami: 25,
  Austin: 21,
  Toronto: 9,
  Montreal: 7,
  Sydney: 18,
  Melbourne: 15,
  'Cape Town': 17,
  Marrakech: 20,
}

const tempCache = new Map<string, number>()

export async function fetchAnnualMeanTempC(
  lat: number,
  lon: number,
  cityName: string
): Promise<number> {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`
  const cached = tempCache.get(key)
  if (cached !== undefined) return cached

  const fallback = TEMP_FALLBACK[cityName] ?? TEMP_FALLBACK[cityName.split(' ')[0]]

  try {
    const url = new URL('https://climate-api.open-meteo.com/v1/climate')
    url.searchParams.set('latitude', String(lat))
    url.searchParams.set('longitude', String(lon))
    url.searchParams.set('start_date', '1991-01-01')
    url.searchParams.set('end_date', '2020-12-31')
    url.searchParams.set('models', 'EC_Earth3P_HR')
    url.searchParams.set('daily', 'temperature_2m_mean')

    const res = await fetch(url.toString(), { next: { revalidate: 604800 } })
    if (!res.ok) throw new Error('climate api failed')

    const data = (await res.json()) as {
      daily?: { temperature_2m_mean?: number[] }
    }
    const temps = data.daily?.temperature_2m_mean?.filter((t) => typeof t === 'number') ?? []
    if (temps.length === 0) throw new Error('no temps')

    const mean = temps.reduce((a, b) => a + b, 0) / temps.length
    const rounded = Math.round(mean * 10) / 10
    tempCache.set(key, rounded)
    return rounded
  } catch {
    const value = fallback ?? 15
    tempCache.set(key, value)
    return value
  }
}

/** Resolve fallback key from numbeo query name */
export function tempFallbackForQuery(query: string): number | undefined {
  const base = query.split(',')[0].trim()
  return TEMP_FALLBACK[base] ?? TEMP_FALLBACK[query]
}
