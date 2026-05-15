/** Countries eligible when Low taxes priority is High (4–5). */
export const LOW_TAX_COUNTRIES = new Set([
  'United Arab Emirates',
  'Panama',
  'Georgia',
  'Paraguay',
])

/** Cities with internationally recognized healthcare (priority High). */
export const HEALTHCARE_HUB_CITIES = new Set(
  [
    'Bangkok|Thailand',
    'Vienna|Austria',
    'Tokyo|Japan',
    'Seoul|South Korea',
    'Singapore|Singapore',
    'Zurich|Switzerland',
    'Munich|Germany',
    'Taipei|Taiwan',
    'Kuala Lumpur|Malaysia',
    'Melbourne|Australia',
    'Sydney|Australia',
    'Copenhagen|Denmark',
    'Oslo|Norway',
    'Stockholm|Sweden',
    'Helsinki|Finland',
    'Barcelona|Spain',
    'Madrid|Spain',
    'Paris|France',
    'London|United Kingdom',
    'Montreal|Canada',
    'Toronto|Canada',
    'Hong Kong|Hong Kong',
    'Dubai|United Arab Emirates',
    'Panama City|Panama',
  ].map((k) => k.toLowerCase())
)

/** Cities known for strong nightlife & culture (priority High). */
export const NIGHTLIFE_HUB_CITIES = new Set(
  [
    'Berlin|Germany',
    'Barcelona|Spain',
    'Lisbon|Portugal',
    'Tokyo|Japan',
    'Bangkok|Thailand',
    'Amsterdam|Netherlands',
    'Seoul|South Korea',
    'London|United Kingdom',
    'Paris|France',
    'Buenos Aires|Argentina',
    'Medellín|Colombia',
    'Mexico City|Mexico',
    'Miami|United States',
    'Prague|Czech Republic',
    'Budapest|Hungary',
    'Tel Aviv|Israel',
    'Rio de Janeiro|Brazil',
    'New York|United States',
  ].map((k) => k.toLowerCase())
)

/** Blocked when Safety priority is High — high crime or unreliable safety data. */
export const UNSAFE_CITIES = new Set(
  [
    'Caracas|Venezuela',
    'Johannesburg|South Africa',
    'Nairobi|Kenya',
    'Cape Town|South Africa',
    'San Pedro Sula|Honduras',
    'Mexico City|Mexico',
    'Manila|Philippines',
    'Bogotá|Colombia',
    'Rio de Janeiro|Brazil',
    'Kingston|Jamaica',
    'Port-au-Prince|Haiti',
    'Lagos|Nigeria',
    'Karachi|Pakistan',
  ].map((k) => k.toLowerCase())
)

/** Blocked when Climate priority is High — not warm year-round. */
export const COOL_CLIMATE_CITIES = new Set(
  [
    'Tbilisi|Georgia',
    'Yerevan|Armenia',
    'Kyiv|Ukraine',
    'Belgrade|Serbia',
    'Budapest|Hungary',
    'Bucharest|Romania',
    'Sofia|Bulgaria',
    'Prague|Czech Republic',
    'Warsaw|Poland',
    'Berlin|Germany',
    'Paris|France',
    'London|United Kingdom',
    'Amsterdam|Netherlands',
    'Vienna|Austria',
    'Zagreb|Croatia',
    'Sarajevo|Bosnia and Herzegovina',
    'Minsk|Belarus',
    'Riga|Latvia',
    'Tallinn|Estonia',
    'Vilnius|Lithuania',
    'Copenhagen|Denmark',
    'Stockholm|Sweden',
    'Helsinki|Finland',
    'Oslo|Norway',
    'Dublin|Ireland',
    'Edinburgh|United Kingdom',
    'Montreal|Canada',
    'Toronto|Canada',
    'New York|United States',
    'Chicago|United States',
    'Boston|United States',
    'Seattle|United States',
    'Moscow|Russia',
    'Buenos Aires|Argentina',
    'Santiago|Chile',
    'Montevideo|Uruguay',
  ].map((k) => k.toLowerCase())
)

export function cityKey(name: string, country: string): string {
  return `${name}|${country}`.toLowerCase()
}

export const PRIORITY_HIGH_THRESHOLD = 4

export const CLIMATE_MIN_TEMP_C = 20
export const HOUSING_MAX_RENT_USD = 800
export const SAFETY_MIN_INDEX = 55
export const MAX_CRIME_INDEX = 45
