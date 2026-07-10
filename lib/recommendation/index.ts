/**
 * LiveWhere - 200 cities, 2025 reference metrics.
 *
 * SCORING LOGIC:
 * - ყველა priority ყოველთვის ითვლება (1=მინიმალური გავლენა, 5=მაქსიმალური)
 * - Climate Medium(3) = ოდნავ სჯის ექსტრემებს (<5°C ან >32°C)
 * - Climate Low(1-2) = კლიმატი თითქმის არ ითვლება
 * - Climate High(4-5) = კლიმატი მნიშვნელოვანია, ზომიერი (15-25°C) იგებს
 */
import type { AnalyzeRequest, CityResult, UserPriorities } from '@/lib/types'
import { peelCompleteObjectsFromJsonArray } from '@/lib/parse-streaming-cities'
import { getVisaInfoForCountry } from '@/lib/visa-data'
import { rankCities, climateTargetTemp, climateWeightPercent, hasWarmClimateYearRound, type ScoreCityResult } from '@/lib/recommendation/scoreCity'

export type CityRow = {
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
}

export const CITIES: CityRow[] = [
  { name: "Dubai", country: "United Arab Emirates", avg_temp: 28, tax_rate: 0, rent_usd: 1850, safety: 8, healthcare: 6.8, stability_score: 66, airportScore: 98, internetScore: 92, walkabilityScore: 52, expatCommunityScore: 88, visaAccessScore: 62 },
  { name: "Abu Dhabi", country: "United Arab Emirates", avg_temp: 27, tax_rate: 0, rent_usd: 1600, safety: 9, healthcare: 7.2, stability_score: 66, airportScore: 95, internetScore: 90, walkabilityScore: 48, expatCommunityScore: 82, visaAccessScore: 62 },
  { name: "Sharjah", country: "United Arab Emirates", avg_temp: 27, tax_rate: 0, rent_usd: 1100, safety: 8, healthcare: 6.5, stability_score: 66, airportScore: 88, internetScore: 86, walkabilityScore: 45, expatCommunityScore: 70, visaAccessScore: 62 },
  { name: "Doha", country: "Qatar", avg_temp: 27, tax_rate: 0, rent_usd: 1650, safety: 9, healthcare: 6.4, stability_score: 69, airportScore: 96, internetScore: 88, walkabilityScore: 50, expatCommunityScore: 78, visaAccessScore: 48 },
  { name: "Manama", country: "Bahrain", avg_temp: 26, tax_rate: 0, rent_usd: 1100, safety: 8, healthcare: 5.6, stability_score: 44, airportScore: 90, internetScore: 82, walkabilityScore: 48, expatCommunityScore: 72, visaAccessScore: 55 },
  { name: "Muscat", country: "Oman", avg_temp: 27, tax_rate: 0, rent_usd: 950, safety: 8, healthcare: 6.3, stability_score: 63, airportScore: 88, internetScore: 78, walkabilityScore: 42, expatCommunityScore: 68, visaAccessScore: 55 },
  { name: "Haifa", country: "Israel", avg_temp: 19, tax_rate: 37, rent_usd: 1400, safety: 7, healthcare: 8, stability_score: 29, airportScore: 82, internetScore: 88, walkabilityScore: 72, expatCommunityScore: 58, visaAccessScore: 48 },
  { name: "Jerusalem", country: "Israel", avg_temp: 18, tax_rate: 37, rent_usd: 1800, safety: 7, healthcare: 8, stability_score: 29, airportScore: 80, internetScore: 86, walkabilityScore: 78, expatCommunityScore: 62, visaAccessScore: 48 },
  { name: "Tel Aviv", country: "Israel", avg_temp: 20, tax_rate: 37, rent_usd: 2100, safety: 7, healthcare: 8, stability_score: 29, airportScore: 92, internetScore: 92, walkabilityScore: 82, expatCommunityScore: 72, visaAccessScore: 48 },
  { name: "Casablanca", country: "Morocco", avg_temp: 18, tax_rate: 38, rent_usd: 480, safety: 5, healthcare: 6, stability_score: 41, airportScore: 88, internetScore: 68, walkabilityScore: 62, expatCommunityScore: 58, visaAccessScore: 58 },
  { name: "Fes", country: "Morocco", avg_temp: 17, tax_rate: 38, rent_usd: 380, safety: 5, healthcare: 5, stability_score: 41, airportScore: 72, internetScore: 58, walkabilityScore: 75, expatCommunityScore: 52, visaAccessScore: 58 },
  { name: "Marrakech", country: "Morocco", avg_temp: 20, tax_rate: 38, rent_usd: 420, safety: 5, healthcare: 5, stability_score: 41, airportScore: 85, internetScore: 65, walkabilityScore: 70, expatCommunityScore: 68, visaAccessScore: 58 },
  { name: "Rabat", country: "Morocco", avg_temp: 18, tax_rate: 38, rent_usd: 450, safety: 6, healthcare: 6, stability_score: 41, airportScore: 82, internetScore: 66, walkabilityScore: 65, expatCommunityScore: 55, visaAccessScore: 58 },
  { name: "Johannesburg", country: "South Africa", avg_temp: 16, tax_rate: 36, rent_usd: 650, safety: 3, healthcare: 6, stability_score: 38, airportScore: 90, internetScore: 72, walkabilityScore: 42, expatCommunityScore: 62, visaAccessScore: 55 },
  { name: "Cape Town", country: "South Africa", avg_temp: 16, tax_rate: 36, rent_usd: 750, safety: 3, healthcare: 7, stability_score: 38, airportScore: 92, internetScore: 75, walkabilityScore: 58, expatCommunityScore: 72, visaAccessScore: 55 },
  { name: "Durban", country: "South Africa", avg_temp: 21, tax_rate: 36, rent_usd: 500, safety: 4, healthcare: 6, stability_score: 38, airportScore: 78, internetScore: 68, walkabilityScore: 48, expatCommunityScore: 55, visaAccessScore: 55 },
  { name: "Port Elizabeth", country: "South Africa", avg_temp: 18, tax_rate: 36, rent_usd: 420, safety: 4, healthcare: 6, stability_score: 38, airportScore: 68, internetScore: 62, walkabilityScore: 45, expatCommunityScore: 48, visaAccessScore: 55 },
  { name: "Boquete", country: "Panama", avg_temp: 22, tax_rate: 0, rent_usd: 750, safety: 7, healthcare: 6, stability_score: 55, airportScore: 62, internetScore: 72, walkabilityScore: 55, expatCommunityScore: 78, visaAccessScore: 72 },
  { name: "Panama City", country: "Panama", avg_temp: 27, tax_rate: 0, rent_usd: 950, safety: 6, healthcare: 6, stability_score: 55, airportScore: 94, internetScore: 82, walkabilityScore: 58, expatCommunityScore: 82, visaAccessScore: 72 },
  { name: "San Jose", country: "Costa Rica", avg_temp: 22, tax_rate: 15, rent_usd: 650, safety: 6, healthcare: 7, stability_score: 74, airportScore: 88, internetScore: 78, walkabilityScore: 65, expatCommunityScore: 72, visaAccessScore: 70 },
  { name: "Tamarindo", country: "Costa Rica", avg_temp: 28, tax_rate: 15, rent_usd: 900, safety: 6, healthcare: 7, stability_score: 74, airportScore: 72, internetScore: 70, walkabilityScore: 52, expatCommunityScore: 76, visaAccessScore: 70 },
  { name: "Punta Cana", country: "Dominican Republic", avg_temp: 27, tax_rate: 25, rent_usd: 850, safety: 5, healthcare: 6, stability_score: 62, airportScore: 92, internetScore: 68, walkabilityScore: 42, expatCommunityScore: 70, visaAccessScore: 68 },
  { name: "Santiago", country: "Dominican Republic", avg_temp: 26, tax_rate: 25, rent_usd: 500, safety: 4, healthcare: 6, stability_score: 62, airportScore: 78, internetScore: 65, walkabilityScore: 55, expatCommunityScore: 58, visaAccessScore: 68 },
  { name: "Santo Domingo", country: "Dominican Republic", avg_temp: 25, tax_rate: 25, rent_usd: 650, safety: 4, healthcare: 6, stability_score: 62, airportScore: 90, internetScore: 70, walkabilityScore: 58, expatCommunityScore: 65, visaAccessScore: 68 },
  { name: "Mexico City", country: "Mexico", avg_temp: 16, tax_rate: 30, rent_usd: 750, safety: 4, healthcare: 6, stability_score: 36, airportScore: 95, internetScore: 78, walkabilityScore: 72, expatCommunityScore: 78, visaAccessScore: 58 },
  { name: "Guadalajara", country: "Mexico", avg_temp: 20, tax_rate: 30, rent_usd: 500, safety: 4, healthcare: 6, stability_score: 36, airportScore: 88, internetScore: 75, walkabilityScore: 62, expatCommunityScore: 68, visaAccessScore: 58 },
  { name: "Monterrey", country: "Mexico", avg_temp: 22, tax_rate: 30, rent_usd: 550, safety: 4, healthcare: 6, stability_score: 36, airportScore: 86, internetScore: 76, walkabilityScore: 48, expatCommunityScore: 62, visaAccessScore: 58 },
  { name: "Cancun", country: "Mexico", avg_temp: 26, tax_rate: 30, rent_usd: 800, safety: 5, healthcare: 7, stability_score: 36, airportScore: 94, internetScore: 72, walkabilityScore: 45, expatCommunityScore: 75, visaAccessScore: 58 },
  { name: "Playa del Carmen", country: "Mexico", avg_temp: 27, tax_rate: 30, rent_usd: 850, safety: 5, healthcare: 6, stability_score: 36, airportScore: 82, internetScore: 70, walkabilityScore: 55, expatCommunityScore: 78, visaAccessScore: 58 },
  { name: "Merida", country: "Mexico", avg_temp: 26, tax_rate: 30, rent_usd: 550, safety: 6, healthcare: 6, stability_score: 36, airportScore: 78, internetScore: 72, walkabilityScore: 68, expatCommunityScore: 72, visaAccessScore: 58 },
  { name: "Barranquilla", country: "Colombia", avg_temp: 28, tax_rate: 35, rent_usd: 400, safety: 3, healthcare: 6, stability_score: 31, airportScore: 82, internetScore: 68, walkabilityScore: 52, expatCommunityScore: 55, visaAccessScore: 62 },
  { name: "Bogota", country: "Colombia", avg_temp: 14, tax_rate: 35, rent_usd: 450, safety: 4, healthcare: 7, stability_score: 31, airportScore: 92, internetScore: 76, walkabilityScore: 68, expatCommunityScore: 72, visaAccessScore: 62 },
  { name: "Medellin", country: "Colombia", avg_temp: 22, tax_rate: 35, rent_usd: 500, safety: 4, healthcare: 7, stability_score: 31, airportScore: 88, internetScore: 82, walkabilityScore: 72, expatCommunityScore: 85, visaAccessScore: 62 },
  { name: "Cali", country: "Colombia", avg_temp: 24, tax_rate: 35, rent_usd: 380, safety: 3, healthcare: 6, stability_score: 31, airportScore: 85, internetScore: 72, walkabilityScore: 58, expatCommunityScore: 58, visaAccessScore: 62 },
  { name: "Cartagena", country: "Colombia", avg_temp: 28, tax_rate: 35, rent_usd: 550, safety: 4, healthcare: 6, stability_score: 31, airportScore: 86, internetScore: 70, walkabilityScore: 75, expatCommunityScore: 70, visaAccessScore: 62 },
  { name: "Arequipa", country: "Peru", avg_temp: 15, tax_rate: 30, rent_usd: 380, safety: 5, healthcare: 6, stability_score: 37, airportScore: 72, internetScore: 62, walkabilityScore: 72, expatCommunityScore: 55, visaAccessScore: 62 },
  { name: "Cusco", country: "Peru", avg_temp: 12, tax_rate: 30, rent_usd: 350, safety: 6, healthcare: 6, stability_score: 37, airportScore: 78, internetScore: 58, walkabilityScore: 78, expatCommunityScore: 62, visaAccessScore: 62 },
  { name: "Lima", country: "Peru", avg_temp: 19, tax_rate: 30, rent_usd: 600, safety: 4, healthcare: 6, stability_score: 37, airportScore: 92, internetScore: 72, walkabilityScore: 58, expatCommunityScore: 68, visaAccessScore: 62 },
  { name: "Cuenca", country: "Ecuador", avg_temp: 15, tax_rate: 25, rent_usd: 400, safety: 6, healthcare: 6, stability_score: 36, airportScore: 68, internetScore: 65, walkabilityScore: 78, expatCommunityScore: 72, visaAccessScore: 72 },
  { name: "Guayaquil", country: "Ecuador", avg_temp: 26, tax_rate: 25, rent_usd: 420, safety: 3, healthcare: 6, stability_score: 36, airportScore: 85, internetScore: 68, walkabilityScore: 52, expatCommunityScore: 55, visaAccessScore: 72 },
  { name: "Quito", country: "Ecuador", avg_temp: 15, tax_rate: 25, rent_usd: 450, safety: 5, healthcare: 6, stability_score: 36, airportScore: 90, internetScore: 70, walkabilityScore: 70, expatCommunityScore: 65, visaAccessScore: 72 },
  { name: "Concepcion", country: "Chile", avg_temp: 13, tax_rate: 40, rent_usd: 450, safety: 5, healthcare: 7, stability_score: 52, airportScore: 72, internetScore: 78, walkabilityScore: 62, expatCommunityScore: 52, visaAccessScore: 60 },
  { name: "Santiago", country: "Chile", avg_temp: 14, tax_rate: 40, rent_usd: 700, safety: 5, healthcare: 7, stability_score: 52, airportScore: 94, internetScore: 82, walkabilityScore: 68, expatCommunityScore: 68, visaAccessScore: 60 },
  { name: "Valparaiso", country: "Chile", avg_temp: 14, tax_rate: 40, rent_usd: 480, safety: 5, healthcare: 7, stability_score: 52, airportScore: 78, internetScore: 75, walkabilityScore: 72, expatCommunityScore: 58, visaAccessScore: 60 },
  { name: "Buenos Aires", country: "Argentina", avg_temp: 16, tax_rate: 35, rent_usd: 650, safety: 5, healthcare: 8, stability_score: 47, airportScore: 94, internetScore: 78, walkabilityScore: 82, expatCommunityScore: 78, visaAccessScore: 68 },
  { name: "Cordoba", country: "Argentina", avg_temp: 18, tax_rate: 35, rent_usd: 380, safety: 5, healthcare: 7, stability_score: 47, airportScore: 82, internetScore: 72, walkabilityScore: 68, expatCommunityScore: 58, visaAccessScore: 68 },
  { name: "Mendoza", country: "Argentina", avg_temp: 15, tax_rate: 35, rent_usd: 350, safety: 6, healthcare: 7, stability_score: 47, airportScore: 78, internetScore: 70, walkabilityScore: 65, expatCommunityScore: 62, visaAccessScore: 68 },
  { name: "Montevideo", country: "Uruguay", avg_temp: 16, tax_rate: 36, rent_usd: 650, safety: 5, healthcare: 8, stability_score: 76, airportScore: 88, internetScore: 82, walkabilityScore: 78, expatCommunityScore: 72, visaAccessScore: 72 },
  { name: "Punta del Este", country: "Uruguay", avg_temp: 16, tax_rate: 36, rent_usd: 1100, safety: 6, healthcare: 8, stability_score: 76, airportScore: 75, internetScore: 78, walkabilityScore: 55, expatCommunityScore: 68, visaAccessScore: 72 },
  { name: "Paris", country: "France", avg_temp: 12, tax_rate: 30, rent_usd: 1650, safety: 5, healthcare: 8, stability_score: 45, airportScore: 96, internetScore: 92, walkabilityScore: 88, expatCommunityScore: 82, visaAccessScore: 55 },
  { name: "Lyon", country: "France", avg_temp: 12, tax_rate: 30, rent_usd: 880, safety: 6, healthcare: 8, stability_score: 45, airportScore: 88, internetScore: 88, walkabilityScore: 82, expatCommunityScore: 65, visaAccessScore: 55 },
  { name: "Marseille", country: "France", avg_temp: 15, tax_rate: 30, rent_usd: 750, safety: 4, healthcare: 8, stability_score: 45, airportScore: 90, internetScore: 85, walkabilityScore: 75, expatCommunityScore: 62, visaAccessScore: 55 },
  { name: "Nice", country: "France", avg_temp: 16, tax_rate: 30, rent_usd: 1200, safety: 5, healthcare: 8, stability_score: 45, airportScore: 92, internetScore: 88, walkabilityScore: 78, expatCommunityScore: 70, visaAccessScore: 55 },
  { name: "Toulouse", country: "France", avg_temp: 13, tax_rate: 30, rent_usd: 780, safety: 6, healthcare: 8, stability_score: 45, airportScore: 85, internetScore: 86, walkabilityScore: 80, expatCommunityScore: 58, visaAccessScore: 55 },
  { name: "Berlin", country: "Germany", avg_temp: 10, tax_rate: 42, rent_usd: 1100, safety: 6, healthcare: 8, stability_score: 52, airportScore: 94, internetScore: 90, walkabilityScore: 85, expatCommunityScore: 75, visaAccessScore: 52 },
  { name: "Munich", country: "Germany", avg_temp: 9, tax_rate: 42, rent_usd: 1450, safety: 8, healthcare: 8, stability_score: 52, airportScore: 96, internetScore: 92, walkabilityScore: 82, expatCommunityScore: 72, visaAccessScore: 52 },
  { name: "Hamburg", country: "Germany", avg_temp: 9, tax_rate: 42, rent_usd: 1050, safety: 7, healthcare: 8, stability_score: 52, airportScore: 92, internetScore: 90, walkabilityScore: 84, expatCommunityScore: 68, visaAccessScore: 52 },
  { name: "Frankfurt", country: "Germany", avg_temp: 10, tax_rate: 42, rent_usd: 1300, safety: 6, healthcare: 8, stability_score: 52, airportScore: 98, internetScore: 94, walkabilityScore: 78, expatCommunityScore: 78, visaAccessScore: 52 },
  { name: "Graz", country: "Austria", avg_temp: 10, tax_rate: 45, rent_usd: 750, safety: 8, healthcare: 8, stability_score: 60, airportScore: 78, internetScore: 88, walkabilityScore: 82, expatCommunityScore: 55, visaAccessScore: 54 },
  { name: "Salzburg", country: "Austria", avg_temp: 9, tax_rate: 45, rent_usd: 950, safety: 8, healthcare: 8, stability_score: 60, airportScore: 82, internetScore: 86, walkabilityScore: 85, expatCommunityScore: 58, visaAccessScore: 54 },
  { name: "Vienna", country: "Austria", avg_temp: 11, tax_rate: 45, rent_usd: 1050, safety: 8, healthcare: 8, stability_score: 60, airportScore: 94, internetScore: 90, walkabilityScore: 88, expatCommunityScore: 72, visaAccessScore: 54 },
  { name: "Zurich", country: "Switzerland", avg_temp: 9, tax_rate: 22, rent_usd: 2200, safety: 8, healthcare: 9, stability_score: 70, airportScore: 97, internetScore: 96, walkabilityScore: 86, expatCommunityScore: 78, visaAccessScore: 44 },
  { name: "Geneva", country: "Switzerland", avg_temp: 10, tax_rate: 22, rent_usd: 2100, safety: 8, healthcare: 9, stability_score: 70, airportScore: 95, internetScore: 95, walkabilityScore: 84, expatCommunityScore: 82, visaAccessScore: 44 },
  { name: "Basel", country: "Switzerland", avg_temp: 10, tax_rate: 22, rent_usd: 1800, safety: 8, healthcare: 9, stability_score: 70, airportScore: 88, internetScore: 94, walkabilityScore: 88, expatCommunityScore: 65, visaAccessScore: 44 },
  { name: "Amsterdam", country: "Netherlands", avg_temp: 10, tax_rate: 37, rent_usd: 1750, safety: 6, healthcare: 8, stability_score: 59, airportScore: 96, internetScore: 94, walkabilityScore: 92, expatCommunityScore: 82, visaAccessScore: 52 },
  { name: "Rotterdam", country: "Netherlands", avg_temp: 10, tax_rate: 37, rent_usd: 1300, safety: 6, healthcare: 8, stability_score: 59, airportScore: 88, internetScore: 92, walkabilityScore: 85, expatCommunityScore: 68, visaAccessScore: 52 },
  { name: "The Hague", country: "Netherlands", avg_temp: 10, tax_rate: 37, rent_usd: 1250, safety: 6, healthcare: 8, stability_score: 59, airportScore: 85, internetScore: 92, walkabilityScore: 86, expatCommunityScore: 72, visaAccessScore: 52 },
  { name: "Brussels", country: "Belgium", avg_temp: 10, tax_rate: 40, rent_usd: 1150, safety: 5, healthcare: 8, stability_score: 52, airportScore: 94, internetScore: 90, walkabilityScore: 82, expatCommunityScore: 75, visaAccessScore: 52 },
  { name: "Antwerp", country: "Belgium", avg_temp: 10, tax_rate: 40, rent_usd: 950, safety: 5, healthcare: 8, stability_score: 52, airportScore: 85, internetScore: 88, walkabilityScore: 84, expatCommunityScore: 62, visaAccessScore: 52 },
  { name: "Luxembourg", country: "Luxembourg", avg_temp: 10, tax_rate: 42, rent_usd: 1650, safety: 7, healthcare: 8, stability_score: 71, airportScore: 82, internetScore: 92, walkabilityScore: 80, expatCommunityScore: 68, visaAccessScore: 50 },
  { name: "Copenhagen", country: "Denmark", avg_temp: 9, tax_rate: 42, rent_usd: 1400, safety: 8, healthcare: 8, stability_score: 65, airportScore: 94, internetScore: 96, walkabilityScore: 90, expatCommunityScore: 72, visaAccessScore: 50 },
  { name: "Aarhus", country: "Denmark", avg_temp: 8, tax_rate: 32, rent_usd: 950, safety: 8, healthcare: 8, stability_score: 65, airportScore: 78, internetScore: 94, walkabilityScore: 88, expatCommunityScore: 58, visaAccessScore: 50 },
  { name: "Odense", country: "Denmark", avg_temp: 8, tax_rate: 42, rent_usd: 1000, safety: 8, healthcare: 8, stability_score: 65, airportScore: 72, internetScore: 92, walkabilityScore: 82, expatCommunityScore: 52, visaAccessScore: 50 },
  { name: "Oslo", country: "Norway", avg_temp: 4, tax_rate: 47, rent_usd: 1500, safety: 8, healthcare: 8, stability_score: 68, airportScore: 94, internetScore: 95, walkabilityScore: 85, expatCommunityScore: 68, visaAccessScore: 48 },
  { name: "Bergen", country: "Norway", avg_temp: 7, tax_rate: 47, rent_usd: 1250, safety: 8, healthcare: 8, stability_score: 68, airportScore: 82, internetScore: 92, walkabilityScore: 80, expatCommunityScore: 55, visaAccessScore: 48 },
  { name: "Stavanger", country: "Norway", avg_temp: 6, tax_rate: 47, rent_usd: 1300, safety: 8, healthcare: 8, stability_score: 68, airportScore: 78, internetScore: 90, walkabilityScore: 72, expatCommunityScore: 58, visaAccessScore: 48 },
  { name: "Madrid", country: "Spain", avg_temp: 15, tax_rate: 24, rent_usd: 1250, safety: 6, healthcare: 8, stability_score: 50, airportScore: 96, internetScore: 90, walkabilityScore: 85, expatCommunityScore: 78, visaAccessScore: 60 },
  { name: "Barcelona", country: "Spain", avg_temp: 17, tax_rate: 24, rent_usd: 1350, safety: 6, healthcare: 8, stability_score: 50, airportScore: 94, internetScore: 88, walkabilityScore: 88, expatCommunityScore: 88, visaAccessScore: 60 },
  { name: "Valencia", country: "Spain", avg_temp: 18, tax_rate: 24, rent_usd: 900, safety: 7, healthcare: 8, stability_score: 50, airportScore: 88, internetScore: 86, walkabilityScore: 82, expatCommunityScore: 75, visaAccessScore: 60 },
  { name: "Malaga", country: "Spain", avg_temp: 19, tax_rate: 24, rent_usd: 850, safety: 7, healthcare: 7, stability_score: 50, airportScore: 90, internetScore: 84, walkabilityScore: 78, expatCommunityScore: 82, visaAccessScore: 60 },
  { name: "Lisbon", country: "Portugal", avg_temp: 17, tax_rate: 20, rent_usd: 1200, safety: 7, healthcare: 7, stability_score: 61, airportScore: 92, internetScore: 88, walkabilityScore: 85, expatCommunityScore: 92, visaAccessScore: 78 },
  { name: "Porto", country: "Portugal", avg_temp: 16, tax_rate: 20, rent_usd: 850, safety: 7, healthcare: 7, stability_score: 61, airportScore: 88, internetScore: 86, walkabilityScore: 82, expatCommunityScore: 85, visaAccessScore: 78 },
  { name: "Braga", country: "Portugal", avg_temp: 15, tax_rate: 20, rent_usd: 650, safety: 7, healthcare: 7, stability_score: 61, airportScore: 72, internetScore: 82, walkabilityScore: 78, expatCommunityScore: 62, visaAccessScore: 78 },
  { name: "Faro", country: "Portugal", avg_temp: 18, tax_rate: 20, rent_usd: 900, safety: 7, healthcare: 7, stability_score: 61, airportScore: 85, internetScore: 84, walkabilityScore: 72, expatCommunityScore: 78, visaAccessScore: 78 },
  { name: "Rome", country: "Italy", avg_temp: 15, tax_rate: 43, rent_usd: 1300, safety: 5, healthcare: 8, stability_score: 56, airportScore: 94, internetScore: 86, walkabilityScore: 82, expatCommunityScore: 75, visaAccessScore: 58 },
  { name: "Milan", country: "Italy", avg_temp: 13, tax_rate: 43, rent_usd: 1450, safety: 5, healthcare: 8, stability_score: 56, airportScore: 96, internetScore: 88, walkabilityScore: 80, expatCommunityScore: 78, visaAccessScore: 58 },
  { name: "Florence", country: "Italy", avg_temp: 15, tax_rate: 43, rent_usd: 1100, safety: 6, healthcare: 8, stability_score: 56, airportScore: 82, internetScore: 84, walkabilityScore: 88, expatCommunityScore: 72, visaAccessScore: 58 },
  { name: "Naples", country: "Italy", avg_temp: 16, tax_rate: 43, rent_usd: 850, safety: 4, healthcare: 7, stability_score: 56, airportScore: 88, internetScore: 78, walkabilityScore: 75, expatCommunityScore: 58, visaAccessScore: 58 },
  { name: "Venice", country: "Italy", avg_temp: 13, tax_rate: 43, rent_usd: 1200, safety: 6, healthcare: 8, stability_score: 56, airportScore: 85, internetScore: 82, walkabilityScore: 92, expatCommunityScore: 68, visaAccessScore: 58 },
  { name: "Athens", country: "Greece", avg_temp: 18, tax_rate: 44, rent_usd: 700, safety: 6, healthcare: 7, stability_score: 53, airportScore: 92, internetScore: 82, walkabilityScore: 78, expatCommunityScore: 72, visaAccessScore: 60 },
  { name: "Crete (Heraklion)", country: "Greece", avg_temp: 19, tax_rate: 44, rent_usd: 600, safety: 7, healthcare: 7, stability_score: 53, airportScore: 85, internetScore: 75, walkabilityScore: 65, expatCommunityScore: 65, visaAccessScore: 60 },
  { name: "Rhodes", country: "Greece", avg_temp: 18, tax_rate: 44, rent_usd: 550, safety: 7, healthcare: 7, stability_score: 53, airportScore: 82, internetScore: 72, walkabilityScore: 68, expatCommunityScore: 62, visaAccessScore: 60 },
  { name: "Thessaloniki", country: "Greece", avg_temp: 16, tax_rate: 44, rent_usd: 520, safety: 6, healthcare: 7, stability_score: 53, airportScore: 88, internetScore: 80, walkabilityScore: 72, expatCommunityScore: 58, visaAccessScore: 60 },
  { name: "Limassol", country: "Cyprus", avg_temp: 21, tax_rate: 20, rent_usd: 950, safety: 7, healthcare: 7, stability_score: 58, airportScore: 82, internetScore: 84, walkabilityScore: 62, expatCommunityScore: 78, visaAccessScore: 66 },
  { name: "Warsaw", country: "Poland", avg_temp: 9, tax_rate: 32, rent_usd: 750, safety: 7, healthcare: 7, stability_score: 60, airportScore: 92, internetScore: 88, walkabilityScore: 78, expatCommunityScore: 68, visaAccessScore: 58 },
  { name: "Krakow", country: "Poland", avg_temp: 8, tax_rate: 32, rent_usd: 650, safety: 7, healthcare: 7, stability_score: 60, airportScore: 85, internetScore: 86, walkabilityScore: 82, expatCommunityScore: 72, visaAccessScore: 58 },
  { name: "Wroclaw", country: "Poland", avg_temp: 9, tax_rate: 32, rent_usd: 600, safety: 7, healthcare: 7, stability_score: 60, airportScore: 82, internetScore: 85, walkabilityScore: 80, expatCommunityScore: 62, visaAccessScore: 58 },
  { name: "Brno", country: "Czech Republic", avg_temp: 9, tax_rate: 23, rent_usd: 650, safety: 7, healthcare: 8, stability_score: 69, airportScore: 78, internetScore: 86, walkabilityScore: 78, expatCommunityScore: 58, visaAccessScore: 58 },
  { name: "Prague", country: "Czech Republic", avg_temp: 10, tax_rate: 23, rent_usd: 900, safety: 7, healthcare: 8, stability_score: 69, airportScore: 92, internetScore: 88, walkabilityScore: 85, expatCommunityScore: 78, visaAccessScore: 58 },
  { name: "Ljubljana", country: "Slovenia", avg_temp: 12, tax_rate: 25, rent_usd: 850, safety: 8, healthcare: 8, stability_score: 64, airportScore: 82, internetScore: 86, walkabilityScore: 85, expatCommunityScore: 62, visaAccessScore: 62 },
  { name: "Zagreb", country: "Croatia", avg_temp: 13, tax_rate: 23, rent_usd: 700, safety: 7, healthcare: 7, stability_score: 62, airportScore: 88, internetScore: 84, walkabilityScore: 78, expatCommunityScore: 65, visaAccessScore: 64 },
  { name: "Dubrovnik", country: "Croatia", avg_temp: 17, tax_rate: 23, rent_usd: 850, safety: 8, healthcare: 7, stability_score: 62, airportScore: 78, internetScore: 78, walkabilityScore: 82, expatCommunityScore: 68, visaAccessScore: 64 },
  { name: "Split", country: "Croatia", avg_temp: 16, tax_rate: 23, rent_usd: 800, safety: 7, healthcare: 7, stability_score: 62, airportScore: 85, internetScore: 80, walkabilityScore: 80, expatCommunityScore: 65, visaAccessScore: 64 },
  { name: "Tallinn", country: "Estonia", avg_temp: 6, tax_rate: 20, rent_usd: 800, safety: 8, healthcare: 8, stability_score: 64, airportScore: 88, internetScore: 92, walkabilityScore: 82, expatCommunityScore: 72, visaAccessScore: 62 },
  { name: "Riga", country: "Latvia", avg_temp: 6, tax_rate: 20, rent_usd: 650, safety: 6, healthcare: 7, stability_score: 62, airportScore: 85, internetScore: 88, walkabilityScore: 78, expatCommunityScore: 62, visaAccessScore: 60 },
  { name: "Vilnius", country: "Lithuania", avg_temp: 7, tax_rate: 20, rent_usd: 750, safety: 7, healthcare: 7, stability_score: 69, airportScore: 86, internetScore: 90, walkabilityScore: 80, expatCommunityScore: 65, visaAccessScore: 62 },
  { name: "Bangkok", country: "Thailand", avg_temp: 29, tax_rate: 15, rent_usd: 650, safety: 6, healthcare: 8, stability_score: 36, airportScore: 96, internetScore: 88, walkabilityScore: 62, expatCommunityScore: 82, visaAccessScore: 62 },
  { name: "Chiang Mai", country: "Thailand", avg_temp: 26, tax_rate: 15, rent_usd: 420, safety: 7, healthcare: 7, stability_score: 36, airportScore: 82, internetScore: 85, walkabilityScore: 68, expatCommunityScore: 88, visaAccessScore: 62 },
  { name: "Hua Hin", country: "Thailand", avg_temp: 28, tax_rate: 15, rent_usd: 550, safety: 7, healthcare: 7, stability_score: 36, airportScore: 72, internetScore: 78, walkabilityScore: 52, expatCommunityScore: 75, visaAccessScore: 62 },
  { name: "Pattaya", country: "Thailand", avg_temp: 29, tax_rate: 15, rent_usd: 480, safety: 5, healthcare: 7, stability_score: 36, airportScore: 78, internetScore: 80, walkabilityScore: 48, expatCommunityScore: 78, visaAccessScore: 62 },
  { name: "Phuket", country: "Thailand", avg_temp: 28, tax_rate: 15, rent_usd: 520, safety: 6, healthcare: 7, stability_score: 36, airportScore: 92, internetScore: 82, walkabilityScore: 45, expatCommunityScore: 82, visaAccessScore: 62 },
  { name: "Singapore", country: "Singapore", avg_temp: 27, tax_rate: 22, rent_usd: 2800, safety: 9, healthcare: 9, stability_score: 75, airportScore: 99, internetScore: 98, walkabilityScore: 78, expatCommunityScore: 85, visaAccessScore: 45 },
  { name: "Johor Bahru", country: "Malaysia", avg_temp: 27, tax_rate: 24, rent_usd: 420, safety: 6, healthcare: 7, stability_score: 58, airportScore: 82, internetScore: 82, walkabilityScore: 48, expatCommunityScore: 65, visaAccessScore: 68 },
  { name: "Kuala Lumpur", country: "Malaysia", avg_temp: 27, tax_rate: 24, rent_usd: 550, safety: 6, healthcare: 8, stability_score: 58, airportScore: 94, internetScore: 88, walkabilityScore: 58, expatCommunityScore: 78, visaAccessScore: 68 },
  { name: "Penang", country: "Malaysia", avg_temp: 27, tax_rate: 24, rent_usd: 480, safety: 7, healthcare: 7, stability_score: 58, airportScore: 85, internetScore: 85, walkabilityScore: 65, expatCommunityScore: 75, visaAccessScore: 68 },
  { name: "Jakarta", country: "Indonesia", avg_temp: 27, tax_rate: 25, rent_usd: 550, safety: 5, healthcare: 5, stability_score: 38, airportScore: 92, internetScore: 72, walkabilityScore: 42, expatCommunityScore: 68, visaAccessScore: 62 },
  { name: "Bali", country: "Indonesia", avg_temp: 27, tax_rate: 25, rent_usd: 550, safety: 6, healthcare: 5, stability_score: 38, airportScore: 88, internetScore: 78, walkabilityScore: 52, expatCommunityScore: 85, visaAccessScore: 62 },
  { name: "Lombok", country: "Indonesia", avg_temp: 27, tax_rate: 25, rent_usd: 400, safety: 6, healthcare: 5, stability_score: 38, airportScore: 72, internetScore: 62, walkabilityScore: 45, expatCommunityScore: 58, visaAccessScore: 62 },
  { name: "Surabaya", country: "Indonesia", avg_temp: 28, tax_rate: 25, rent_usd: 380, safety: 5, healthcare: 5, stability_score: 38, airportScore: 85, internetScore: 70, walkabilityScore: 45, expatCommunityScore: 55, visaAccessScore: 62 },
  { name: "Yogyakarta", country: "Indonesia", avg_temp: 26, tax_rate: 25, rent_usd: 350, safety: 6, healthcare: 5, stability_score: 38, airportScore: 78, internetScore: 68, walkabilityScore: 62, expatCommunityScore: 62, visaAccessScore: 62 },
  { name: "Da Nang", country: "Vietnam", avg_temp: 26, tax_rate: 20, rent_usd: 450, safety: 6, healthcare: 6, stability_score: 50, airportScore: 88, internetScore: 82, walkabilityScore: 55, expatCommunityScore: 72, visaAccessScore: 62 },
  { name: "Hanoi", country: "Vietnam", avg_temp: 24, tax_rate: 20, rent_usd: 450, safety: 6, healthcare: 6, stability_score: 50, airportScore: 92, internetScore: 80, walkabilityScore: 68, expatCommunityScore: 68, visaAccessScore: 62 },
  { name: "Ho Chi Minh City", country: "Vietnam", avg_temp: 28, tax_rate: 20, rent_usd: 500, safety: 5, healthcare: 6, stability_score: 50, airportScore: 94, internetScore: 85, walkabilityScore: 62, expatCommunityScore: 75, visaAccessScore: 62 },
  { name: "Cebu", country: "Philippines", avg_temp: 28, tax_rate: 25, rent_usd: 380, safety: 5, healthcare: 6, stability_score: 35, airportScore: 88, internetScore: 72, walkabilityScore: 48, expatCommunityScore: 65, visaAccessScore: 58 },
  { name: "Davao", country: "Philippines", avg_temp: 28, tax_rate: 25, rent_usd: 320, safety: 5, healthcare: 6, stability_score: 35, airportScore: 82, internetScore: 68, walkabilityScore: 42, expatCommunityScore: 55, visaAccessScore: 58 },
  { name: "Manila", country: "Philippines", avg_temp: 27, tax_rate: 25, rent_usd: 450, safety: 4, healthcare: 6, stability_score: 35, airportScore: 94, internetScore: 75, walkabilityScore: 45, expatCommunityScore: 72, visaAccessScore: 58 },
  { name: "Tokyo", country: "Japan", avg_temp: 16, tax_rate: 33, rent_usd: 1200, safety: 8, healthcare: 9, stability_score: 73, airportScore: 98, internetScore: 96, walkabilityScore: 82, expatCommunityScore: 68, visaAccessScore: 36 },
  { name: "Osaka", country: "Japan", avg_temp: 16, tax_rate: 33, rent_usd: 850, safety: 8, healthcare: 8, stability_score: 73, airportScore: 94, internetScore: 94, walkabilityScore: 78, expatCommunityScore: 62, visaAccessScore: 36 },
  { name: "Kyoto", country: "Japan", avg_temp: 15, tax_rate: 33, rent_usd: 720, safety: 8, healthcare: 8, stability_score: 73, airportScore: 82, internetScore: 90, walkabilityScore: 85, expatCommunityScore: 58, visaAccessScore: 36 },
  { name: "Fukuoka", country: "Japan", avg_temp: 17, tax_rate: 33, rent_usd: 680, safety: 8, healthcare: 8, stability_score: 73, airportScore: 90, internetScore: 92, walkabilityScore: 75, expatCommunityScore: 55, visaAccessScore: 36 },
  { name: "Sapporo", country: "Japan", avg_temp: 9, tax_rate: 33, rent_usd: 550, safety: 8, healthcare: 8, stability_score: 73, airportScore: 88, internetScore: 90, walkabilityScore: 72, expatCommunityScore: 52, visaAccessScore: 36 },
  { name: "Sydney", country: "Australia", avg_temp: 18, tax_rate: 39, rent_usd: 2100, safety: 7, healthcare: 8, stability_score: 66, airportScore: 96, internetScore: 88, walkabilityScore: 72, expatCommunityScore: 78, visaAccessScore: 48 },
  { name: "Melbourne", country: "Australia", avg_temp: 15, tax_rate: 39, rent_usd: 1650, safety: 7, healthcare: 8, stability_score: 66, airportScore: 94, internetScore: 90, walkabilityScore: 82, expatCommunityScore: 82, visaAccessScore: 48 },
  { name: "Brisbane", country: "Australia", avg_temp: 21, tax_rate: 39, rent_usd: 1500, safety: 6, healthcare: 8, stability_score: 66, airportScore: 92, internetScore: 86, walkabilityScore: 65, expatCommunityScore: 68, visaAccessScore: 48 },
  { name: "Perth", country: "Australia", avg_temp: 18, tax_rate: 39, rent_usd: 1400, safety: 7, healthcare: 8, stability_score: 66, airportScore: 90, internetScore: 85, walkabilityScore: 58, expatCommunityScore: 65, visaAccessScore: 48 },
  { name: "Adelaide", country: "Australia", avg_temp: 17, tax_rate: 39, rent_usd: 1200, safety: 7, healthcare: 8, stability_score: 66, airportScore: 85, internetScore: 84, walkabilityScore: 68, expatCommunityScore: 58, visaAccessScore: 48 },
  { name: "Auckland", country: "New Zealand", avg_temp: 15, tax_rate: 33, rent_usd: 1900, safety: 6, healthcare: 8, stability_score: 73, airportScore: 94, internetScore: 88, walkabilityScore: 62, expatCommunityScore: 72, visaAccessScore: 50 },
  { name: "Wellington", country: "New Zealand", avg_temp: 13, tax_rate: 33, rent_usd: 1700, safety: 7, healthcare: 8, stability_score: 73, airportScore: 88, internetScore: 86, walkabilityScore: 78, expatCommunityScore: 65, visaAccessScore: 50 },
  { name: "Christchurch", country: "New Zealand", avg_temp: 12, tax_rate: 33, rent_usd: 1300, safety: 7, healthcare: 8, stability_score: 73, airportScore: 85, internetScore: 84, walkabilityScore: 68, expatCommunityScore: 58, visaAccessScore: 50 },
  { name: "Seoul", country: "South Korea", avg_temp: 13, tax_rate: 35, rent_usd: 950, safety: 8, healthcare: 9, stability_score: 63, airportScore: 97, internetScore: 98, walkabilityScore: 80, expatCommunityScore: 65, visaAccessScore: 42 },
  { name: "Busan", country: "South Korea", avg_temp: 15, tax_rate: 35, rent_usd: 650, safety: 7, healthcare: 8, stability_score: 63, airportScore: 90, internetScore: 95, walkabilityScore: 72, expatCommunityScore: 58, visaAccessScore: 42 },
  { name: "Valletta", country: "Malta", avg_temp: 19, tax_rate: 15, rent_usd: 1380, safety: 6, healthcare: 8.2, stability_score: 66, airportScore: 85, internetScore: 88, walkabilityScore: 88, expatCommunityScore: 82, visaAccessScore: 72 },
  { name: "Sliema", country: "Malta", avg_temp: 19, tax_rate: 15, rent_usd: 1800, safety: 6, healthcare: 8.2, stability_score: 66, airportScore: 82, internetScore: 86, walkabilityScore: 75, expatCommunityScore: 78, visaAccessScore: 72 },
  { name: "Victoria", country: "Seychelles", avg_temp: 28, tax_rate: 30, rent_usd: 1000, safety: 6, healthcare: 8.2, stability_score: 68, airportScore: 78, internetScore: 65, walkabilityScore: 55, expatCommunityScore: 52, visaAccessScore: 55 },
  { name: "Beau Vallon", country: "Seychelles", avg_temp: 28, tax_rate: 30, rent_usd: 1050, safety: 6, healthcare: 8.2, stability_score: 68, airportScore: 75, internetScore: 62, walkabilityScore: 48, expatCommunityScore: 55, visaAccessScore: 55 },
]

const DISPLAY: Record<string, { continent: string; flag: string }> = {
  "Dubai|United Arab Emirates": { continent: "Middle East", flag: "🇦🇪" },
  "Abu Dhabi|United Arab Emirates": { continent: "Middle East", flag: "🇦🇪" },
  "Sharjah|United Arab Emirates": { continent: "Middle East", flag: "🇦🇪" },
  "Doha|Qatar": { continent: "Middle East", flag: "🇶🇦" },
  "Manama|Bahrain": { continent: "Middle East", flag: "🇧🇭" },
  "Muscat|Oman": { continent: "Middle East", flag: "🇴🇲" },
  "Haifa|Israel": { continent: "Middle East", flag: "🇮🇱" },
  "Jerusalem|Israel": { continent: "Middle East", flag: "🇮🇱" },
  "Tel Aviv|Israel": { continent: "Middle East", flag: "🇮🇱" },
  "Casablanca|Morocco": { continent: "Africa", flag: "🇲🇦" },
  "Fes|Morocco": { continent: "Africa", flag: "🇲🇦" },
  "Marrakech|Morocco": { continent: "Africa", flag: "🇲🇦" },
  "Rabat|Morocco": { continent: "Africa", flag: "🇲🇦" },
  "Johannesburg|South Africa": { continent: "Africa", flag: "🇿🇦" },
  "Cape Town|South Africa": { continent: "Africa", flag: "🇿🇦" },
  "Durban|South Africa": { continent: "Africa", flag: "🇿🇦" },
  "Port Elizabeth|South Africa": { continent: "Africa", flag: "🇿🇦" },
  "Boquete|Panama": { continent: "Americas", flag: "🇵🇦" },
  "Panama City|Panama": { continent: "Americas", flag: "🇵🇦" },
  "San Jose|Costa Rica": { continent: "Americas", flag: "🇨🇷" },
  "Tamarindo|Costa Rica": { continent: "Americas", flag: "🇨🇷" },
  "Punta Cana|Dominican Republic": { continent: "Americas", flag: "🇩🇴" },
  "Santiago|Dominican Republic": { continent: "Americas", flag: "🇩🇴" },
  "Santo Domingo|Dominican Republic": { continent: "Americas", flag: "🇩🇴" },
  "Mexico City|Mexico": { continent: "Americas", flag: "🇲🇽" },
  "Guadalajara|Mexico": { continent: "Americas", flag: "🇲🇽" },
  "Monterrey|Mexico": { continent: "Americas", flag: "🇲🇽" },
  "Cancun|Mexico": { continent: "Americas", flag: "🇲🇽" },
  "Playa del Carmen|Mexico": { continent: "Americas", flag: "🇲🇽" },
  "Merida|Mexico": { continent: "Americas", flag: "🇲🇽" },
  "Barranquilla|Colombia": { continent: "Americas", flag: "🇨🇴" },
  "Bogota|Colombia": { continent: "Americas", flag: "🇨🇴" },
  "Medellin|Colombia": { continent: "Americas", flag: "🇨🇴" },
  "Cali|Colombia": { continent: "Americas", flag: "🇨🇴" },
  "Cartagena|Colombia": { continent: "Americas", flag: "🇨🇴" },
  "Arequipa|Peru": { continent: "Americas", flag: "🇵🇪" },
  "Cusco|Peru": { continent: "Americas", flag: "🇵🇪" },
  "Lima|Peru": { continent: "Americas", flag: "🇵🇪" },
  "Cuenca|Ecuador": { continent: "Americas", flag: "🇪🇨" },
  "Guayaquil|Ecuador": { continent: "Americas", flag: "🇪🇨" },
  "Quito|Ecuador": { continent: "Americas", flag: "🇪🇨" },
  "Concepcion|Chile": { continent: "Americas", flag: "🇨🇱" },
  "Santiago|Chile": { continent: "Americas", flag: "🇨🇱" },
  "Valparaiso|Chile": { continent: "Americas", flag: "🇨🇱" },
  "Buenos Aires|Argentina": { continent: "Americas", flag: "🇦🇷" },
  "Cordoba|Argentina": { continent: "Americas", flag: "🇦🇷" },
  "Mendoza|Argentina": { continent: "Americas", flag: "🇦🇷" },
  "Montevideo|Uruguay": { continent: "Americas", flag: "🇺🇾" },
  "Punta del Este|Uruguay": { continent: "Americas", flag: "🇺🇾" },
  "Paris|France": { continent: "Europe", flag: "🇫🇷" },
  "Lyon|France": { continent: "Europe", flag: "🇫🇷" },
  "Marseille|France": { continent: "Europe", flag: "🇫🇷" },
  "Nice|France": { continent: "Europe", flag: "🇫🇷" },
  "Toulouse|France": { continent: "Europe", flag: "🇫🇷" },
  "Berlin|Germany": { continent: "Europe", flag: "🇩🇪" },
  "Munich|Germany": { continent: "Europe", flag: "🇩🇪" },
  "Hamburg|Germany": { continent: "Europe", flag: "🇩🇪" },
  "Frankfurt|Germany": { continent: "Europe", flag: "🇩🇪" },
  "Graz|Austria": { continent: "Europe", flag: "🇦🇹" },
  "Salzburg|Austria": { continent: "Europe", flag: "🇦🇹" },
  "Vienna|Austria": { continent: "Europe", flag: "🇦🇹" },
  "Zurich|Switzerland": { continent: "Europe", flag: "🇨🇭" },
  "Geneva|Switzerland": { continent: "Europe", flag: "🇨🇭" },
  "Basel|Switzerland": { continent: "Europe", flag: "🇨🇭" },
  "Amsterdam|Netherlands": { continent: "Europe", flag: "🇳🇱" },
  "Rotterdam|Netherlands": { continent: "Europe", flag: "🇳🇱" },
  "The Hague|Netherlands": { continent: "Europe", flag: "🇳🇱" },
  "Brussels|Belgium": { continent: "Europe", flag: "🇧🇪" },
  "Antwerp|Belgium": { continent: "Europe", flag: "🇧🇪" },
  "Luxembourg|Luxembourg": { continent: "Europe", flag: "🇱🇺" },
  "Copenhagen|Denmark": { continent: "Europe", flag: "🇩🇰" },
  "Aarhus|Denmark": { continent: "Europe", flag: "🇩🇰" },
  "Odense|Denmark": { continent: "Europe", flag: "🇩🇰" },
  "Oslo|Norway": { continent: "Europe", flag: "🇳🇴" },
  "Bergen|Norway": { continent: "Europe", flag: "🇳🇴" },
  "Stavanger|Norway": { continent: "Europe", flag: "🇳🇴" },
  "Madrid|Spain": { continent: "Europe", flag: "🇪🇸" },
  "Barcelona|Spain": { continent: "Europe", flag: "🇪🇸" },
  "Valencia|Spain": { continent: "Europe", flag: "🇪🇸" },
  "Malaga|Spain": { continent: "Europe", flag: "🇪🇸" },
  "Lisbon|Portugal": { continent: "Europe", flag: "🇵🇹" },
  "Porto|Portugal": { continent: "Europe", flag: "🇵🇹" },
  "Braga|Portugal": { continent: "Europe", flag: "🇵🇹" },
  "Faro|Portugal": { continent: "Europe", flag: "🇵🇹" },
  "Rome|Italy": { continent: "Europe", flag: "🇮🇹" },
  "Milan|Italy": { continent: "Europe", flag: "🇮🇹" },
  "Florence|Italy": { continent: "Europe", flag: "🇮🇹" },
  "Naples|Italy": { continent: "Europe", flag: "🇮🇹" },
  "Venice|Italy": { continent: "Europe", flag: "🇮🇹" },
  "Athens|Greece": { continent: "Europe", flag: "🇬🇷" },
  "Crete (Heraklion)|Greece": { continent: "Europe", flag: "🇬🇷" },
  "Rhodes|Greece": { continent: "Europe", flag: "🇬🇷" },
  "Thessaloniki|Greece": { continent: "Europe", flag: "🇬🇷" },
  "Limassol|Cyprus": { continent: "Europe", flag: "🇨🇾" },
  "Warsaw|Poland": { continent: "Europe", flag: "🇵🇱" },
  "Krakow|Poland": { continent: "Europe", flag: "🇵🇱" },
  "Wroclaw|Poland": { continent: "Europe", flag: "🇵🇱" },
  "Brno|Czech Republic": { continent: "Europe", flag: "🇨🇿" },
  "Prague|Czech Republic": { continent: "Europe", flag: "🇨🇿" },
  "Ljubljana|Slovenia": { continent: "Europe", flag: "🇸🇮" },
  "Zagreb|Croatia": { continent: "Europe", flag: "🇭🇷" },
  "Dubrovnik|Croatia": { continent: "Europe", flag: "🇭🇷" },
  "Split|Croatia": { continent: "Europe", flag: "🇭🇷" },
  "Tallinn|Estonia": { continent: "Europe", flag: "🇪🇪" },
  "Riga|Latvia": { continent: "Europe", flag: "🇱🇻" },
  "Vilnius|Lithuania": { continent: "Europe", flag: "🇱🇹" },
  "Bangkok|Thailand": { continent: "Asia", flag: "🇹🇭" },
  "Chiang Mai|Thailand": { continent: "Asia", flag: "🇹🇭" },
  "Hua Hin|Thailand": { continent: "Asia", flag: "🇹🇭" },
  "Pattaya|Thailand": { continent: "Asia", flag: "🇹🇭" },
  "Phuket|Thailand": { continent: "Asia", flag: "🇹🇭" },
  "Singapore|Singapore": { continent: "Asia", flag: "🇸🇬" },
  "Johor Bahru|Malaysia": { continent: "Asia", flag: "🇲🇾" },
  "Kuala Lumpur|Malaysia": { continent: "Asia", flag: "🇲🇾" },
  "Penang|Malaysia": { continent: "Asia", flag: "🇲🇾" },
  "Jakarta|Indonesia": { continent: "Asia", flag: "🇮🇩" },
  "Bali|Indonesia": { continent: "Asia", flag: "🇮🇩" },
  "Lombok|Indonesia": { continent: "Asia", flag: "🇮🇩" },
  "Surabaya|Indonesia": { continent: "Asia", flag: "🇮🇩" },
  "Yogyakarta|Indonesia": { continent: "Asia", flag: "🇮🇩" },
  "Da Nang|Vietnam": { continent: "Asia", flag: "🇻🇳" },
  "Hanoi|Vietnam": { continent: "Asia", flag: "🇻🇳" },
  "Ho Chi Minh City|Vietnam": { continent: "Asia", flag: "🇻🇳" },
  "Cebu|Philippines": { continent: "Asia", flag: "🇵🇭" },
  "Davao|Philippines": { continent: "Asia", flag: "🇵🇭" },
  "Manila|Philippines": { continent: "Asia", flag: "🇵🇭" },
  "Tokyo|Japan": { continent: "Asia", flag: "🇯🇵" },
  "Osaka|Japan": { continent: "Asia", flag: "🇯🇵" },
  "Kyoto|Japan": { continent: "Asia", flag: "🇯🇵" },
  "Fukuoka|Japan": { continent: "Asia", flag: "🇯🇵" },
  "Sapporo|Japan": { continent: "Asia", flag: "🇯🇵" },
  "Sydney|Australia": { continent: "Oceania", flag: "🇦🇺" },
  "Melbourne|Australia": { continent: "Oceania", flag: "🇦🇺" },
  "Brisbane|Australia": { continent: "Oceania", flag: "🇦🇺" },
  "Perth|Australia": { continent: "Oceania", flag: "🇦🇺" },
  "Adelaide|Australia": { continent: "Oceania", flag: "🇦🇺" },
  "Auckland|New Zealand": { continent: "Oceania", flag: "🇳🇿" },
  "Wellington|New Zealand": { continent: "Oceania", flag: "🇳🇿" },
  "Christchurch|New Zealand": { continent: "Oceania", flag: "🇳🇿" },
  "Seoul|South Korea": { continent: "Asia", flag: "🇰🇷" },
  "Busan|South Korea": { continent: "Asia", flag: "🇰🇷" },
  "Valletta|Malta": { continent: "Europe", flag: "🇲🇹" },
  "Sliema|Malta": { continent: "Europe", flag: "🇲🇹" },
  "Victoria|Seychelles": { continent: "Africa", flag: "🇸🇨" },
  "Beau Vallon|Seychelles": { continent: "Africa", flag: "🇸🇨" },
}

export const RESULT_COUNT = 3
export const PRO_RESULT_COUNT = 12

const OPENAI_MODEL = "gpt-4o-mini"
const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function normPriority(p: unknown): number {
  const n = typeof p === "number" ? p : Number(p)
  if (!Number.isFinite(n)) return 3
  return clamp(Math.round(n), 1, 5)
}

function metaFor(city: CityRow): { continent: string; flag: string } {
  return DISPLAY[`${city.name}|${city.country}`] ?? { continent: "Other", flag: "🏙️" }
}

type OpenAINarrativeCity = Partial<CityResult> & { index?: number }

type OpenAIRecommendationResponse = {
  cities?: OpenAINarrativeCity[]
}

type OpenAIChatResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
}

function priorityLabel(n: number): string {
  switch (n) {
    case 1:
      return "not important"
    case 2:
      return "somewhat important"
    case 3:
      return "important"
    case 4:
      return "very important"
    case 5:
      return "very important"
    default:
      return "important"
  }
}

function text(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}

function list(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback
  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
  return items.length ? items.slice(0, 4) : fallback
}

function normPrioritiesFromBody(body: AnalyzeRequest): UserPriorities {
  return {
    tax: normPriority(body.priorities.tax),
    housing: normPriority(body.priorities.housing),
    climate: normPriority(body.priorities.climate),
    health: normPriority(body.priorities.health),
    stability: normPriority(body.priorities.stability),
    safety: normPriority(body.priorities.safety),
    expat_community: normPriority(body.priorities.expat_community),
    visa_residency: normPriority(body.priorities.visa_residency),
  }
}

function limitCitiesPerCountry(results: ScoreCityResult[], maxPerCountry: number): ScoreCityResult[] {
  const countryCounts = new Map<string, number>()
  const limited: ScoreCityResult[] = []
  for (const result of results) {
    const country = result.city.country
    const seen = countryCounts.get(country) ?? 0
    if (seen >= maxPerCountry) continue
    countryCounts.set(country, seen + 1)
    limited.push(result)
  }
  return limited
}

function rankSurvivorsForUser(body: AnalyzeRequest, count: number): ScoreCityResult[] {
  const priorities = normPrioritiesFromBody(body)
  return limitCitiesPerCountry(
    rankCities(CITIES, {
      monthlyBudget: body.monthlyBudget,
      priorities,
      lifestyle: body.lifestyle ?? [],
    }).filter((r) => !r.eliminated),
    2,
  ).slice(0, count)
}

function rowToCityResult(row: CityRow, ranked: ScoreCityResult, monthlyBudget: number): CityResult {
  const meta = metaFor(row)
  const sub = ranked.subScores!
  const monthlyCost = ranked.costOfLiving

  return {
    name: row.name,
    country: row.country,
    continent: meta.continent,
    flag: meta.flag,
    score: Math.round(ranked.score!),
    taxRate: row.tax_rate,
    monthlyRent: row.rent_usd,
    monthlyCost,
    takeHomeMonthly: monthlyBudget,
    monthlySavings: monthlyBudget - monthlyCost,
    pros: ["Strong fit for your selected priorities."],
    cons: ["Verify tax and visa rules for your passport."],
    tags: [meta.continent],
    visa: "Check retiree, work, or residency options.",
    healthcare: "Building healthcare details…",
    scores: {
      tax: sub.taxes,
      housing: sub.housing,
      climate: sub.climate,
      health: sub.healthcare,
      stability: sub.stability,
      expat: sub.expat,
      safety: sub.safety,
    },
    aiInsight: `${row.name} is a strong match based on your budget and priorities.`,
  }
}

function mergeNarrative(base: CityResult, partial: Partial<CityResult>): CityResult {
  return {
    ...base,
    pros: list(partial.pros, base.pros),
    cons: list(partial.cons, base.cons),
    aiInsight: text(partial.aiInsight, base.aiInsight),
    visa: text(partial.visa, base.visa),
    healthcare: text(partial.healthcare, base.healthcare),
    tags: list(partial.tags, base.tags),
  }
}

type NarrativeMergePath = "index" | "name-country" | "none"

const narrativeMergeStats = {
  index: 0,
  nameCountry: 0,
  none: 0,
}

function resetNarrativeMergeStats(): void {
  narrativeMergeStats.index = 0
  narrativeMergeStats.nameCountry = 0
  narrativeMergeStats.none = 0
}

function recordNarrativeMerge(path: NarrativeMergePath): void {
  if (path === "index") narrativeMergeStats.index++
  else if (path === "name-country") narrativeMergeStats.nameCountry++
  else narrativeMergeStats.none++
}

function narrativeListIndex(partial: OpenAINarrativeCity): number | null {
  return typeof partial.index === "number" && Number.isInteger(partial.index)
    ? partial.index
    : null
}

function resolveNarrativePartial(
  base: CityResult,
  position: number,
  narratives: OpenAINarrativeCity[],
  byKey: Map<string, OpenAINarrativeCity>
): { partial?: OpenAINarrativeCity; path: NarrativeMergePath } {
  const expectedIndex = position + 1
  const byIndex = narratives.find((n) => narrativeListIndex(n) === expectedIndex)
  if (byIndex) return { partial: byIndex, path: "index" }

  const byName = byKey.get(`${base.name}|${base.country}`)
  if (byName) return { partial: byName, path: "name-country" }

  return { path: "none" }
}

function resolveStreamedNarrativePartial(
  partial: OpenAINarrativeCity,
  baseCities: CityResult[],
  baseByKey: Map<string, CityResult>
): { base?: CityResult; path: NarrativeMergePath } {
  const listIndex = narrativeListIndex(partial)
  if (listIndex !== null && listIndex >= 1 && listIndex <= baseCities.length) {
    return { base: baseCities[listIndex - 1], path: "index" }
  }

  const name = typeof partial.name === "string" ? partial.name.trim() : ""
  const country = typeof partial.country === "string" ? partial.country.trim() : "Unknown"
  const byName = baseByKey.get(`${name}|${country}`)
  if (byName) return { base: byName, path: "name-country" }

  return { path: "none" }
}

function logNarrativeMergeSummary(total: number): void {
  console.warn(
    `[narrative-merge-summary] matched_via_index=${narrativeMergeStats.index} matched_via_name=${narrativeMergeStats.nameCountry} unmatched=${narrativeMergeStats.none} total=${total}`
  )
}

function finalizeNarratives(
  baseCities: CityResult[],
  narratives: OpenAINarrativeCity[] | undefined
): CityResult[] {
  if (!narratives?.length) {
    resetNarrativeMergeStats()
    for (const base of baseCities) {
      console.warn(`[narrative-merge] no match for "${base.name}|${base.country}"`)
      recordNarrativeMerge("none")
    }
    console.warn(`[narrative-merge] ${baseCities.length}/${baseCities.length} cities failed to merge`)
    return baseCities
  }

  resetNarrativeMergeStats()

  const byKey = new Map(
    narratives.map((n) => [`${text(n.name, "")}|${text(n.country, "")}`, n])
  )
  let unmatchedCount = 0

  const result = baseCities.map((base, i) => {
    const { partial, path } = resolveNarrativePartial(base, i, narratives, byKey)
    console.warn(
      `[narrative-merge] city ${i} (${base.name}|${base.country}) matched via: ${path}`
    )
    recordNarrativeMerge(path)

    if (!partial) {
      unmatchedCount++
      console.warn(`[narrative-merge] no match for "${base.name}|${base.country}"`)
      return base
    }

    return mergeNarrative(base, partial)
  })

  console.warn(`[narrative-merge] ${unmatchedCount}/${baseCities.length} cities failed to merge`)
  return result
}

function formatUserContext(body: AnalyzeRequest, priorities: UserPriorities): string {
  return [
    `Target monthly living budget: $${body.monthlyBudget.toLocaleString()} ${body.currency}/month`,
    `Lifestyle: ${body.lifestyle.length ? body.lifestyle.join(", ") : "No specific lifestyle selected"}`,
    "Priorities, 1-5:",
    `- Low taxes: ${priorities.tax} (${priorityLabel(priorities.tax)})`,
    `- Affordable housing: ${priorities.housing} (${priorityLabel(priorities.housing)})`,
    `- Climate: ${hasWarmClimateYearRound(body.lifestyle) ? 'Warm year-round' : 'Mild default'} — ${climateTargetTemp(body.lifestyle)}°C ideal avg (${climateWeightPercent(body.lifestyle)}% ranking weight)`,
    `- Healthcare: ${priorities.health} (${priorityLabel(priorities.health)})`,
    `- Long-term stability: ${priorities.stability} (${priorityLabel(priorities.stability)})`,
    `- Safety: ${priorities.safety} (${priorityLabel(priorities.safety)})`,
    `- Expat community: ${priorities.expat_community} (${priorityLabel(priorities.expat_community)})`,
    `- Visa and residency ease: ${priorities.visa_residency} (${priorityLabel(priorities.visa_residency)})`,
  ].join("\n")
}

function formatVisaDataForCountry(country: string): string {
  const info = getVisaInfoForCountry(country)
  if (!info) {
    return 'No verified visa facts on file for this country. Do not invent visa names, income thresholds, or URLs.'
  }

  const optionLines = info.options.map((option) => {
    const incomeLine =
      option.minIncomeMonthly != null
        ? `Minimum income (verified): $${option.minIncomeMonthly.toLocaleString()}/mo USD`
        : 'Minimum income (verified): none on file'
    return [
      `  • ${option.name} (${option.type}, ${option.difficulty})`,
      `    ${incomeLine}`,
      `    Cost: ${option.cost}; Duration: ${option.duration}; Processing: ${option.processingTime}`,
      `    Requirements: ${option.requirements.join('; ')}`,
    ].join('\n')
  })

  return [`Country summary: ${info.summary}`, 'Verified visa options:', ...optionLines].join('\n')
}

function narrativeFmtUsd(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`
}

type NarrativePeerAverages = {
  score: number
  monthlyCost: number
  monthlySavings: number
  tax: number
  housing: number
  climate: number
  health: number
  stability: number
  expat: number
  safety: number
}

function computeNarrativePeerAverages(cities: CityResult[]): NarrativePeerAverages {
  const n = cities.length || 1
  const avg = (fn: (c: CityResult) => number) =>
    cities.reduce((sum, c) => sum + fn(c), 0) / n

  return {
    score: avg((c) => c.score),
    monthlyCost: avg((c) => c.monthlyCost),
    monthlySavings: avg((c) => c.monthlySavings),
    tax: avg((c) => c.scores.tax),
    housing: avg((c) => c.scores.housing),
    climate: avg((c) => c.scores.climate),
    health: avg((c) => c.scores.health),
    stability: avg((c) => c.scores.stability),
    expat: avg((c) => c.scores.expat ?? 0),
    safety: avg((c) => c.scores.safety),
  }
}

function formatTopUserPriorities(priorities: UserPriorities): string {
  const entries: Array<[string, number]> = [
    ['Low taxes', priorities.tax],
    ['Affordable housing', priorities.housing],
    ['Healthcare', priorities.health],
    ['Long-term stability', priorities.stability],
    ['Safety', priorities.safety],
    ['Expat community', priorities.expat_community],
    ['Visa and residency ease', priorities.visa_residency],
  ]
  const top = entries
    .filter(([, value]) => value >= 4)
    .sort((a, b) => b[1] - a[1])

  if (top.length === 0) {
    return 'No priority rated 4–5; most factors left at default importance.'
  }

  return top.map(([name, value]) => `${name} (${value}/5)`).join(', ')
}

function narrativeScoreDeltaLine(
  label: string,
  value: number,
  peerAvg: number,
  cityCount: number,
): string {
  const diff = Math.round(value - peerAvg)
  const sign = diff >= 0 ? '+' : ''
  return `  ${label}: ${Math.round(value)}/100 (${sign}${diff} vs ${Math.round(peerAvg)} avg across these ${cityCount} matches)`
}

function formatCityNarrativeBlock(
  city: CityResult,
  rank: number,
  body: AnalyzeRequest,
  priorities: UserPriorities,
  peers: NarrativePeerAverages,
  cityCount: number,
): string[] {
  const visaDataForCity = formatVisaDataForCountry(city.country)
  const savingsWord = city.monthlySavings >= 0 ? 'savings' : 'deficit'
  const savingsSign = city.monthlySavings >= 0 ? '+' : '-'
  const scoreDiff = Math.round(city.score - peers.score)
  const scoreSign = scoreDiff >= 0 ? '+' : ''

  return [
    `${rank}. ${city.name}, ${city.country} — rank #${rank} of ${cityCount} (overall match score ${city.score}/100, ${scoreSign}${scoreDiff} vs ${Math.round(peers.score)} avg across this list)`,
    `User budget: ${narrativeFmtUsd(body.monthlyBudget)} ${body.currency}/month`,
    `This city's estimated monthly cost: ${narrativeFmtUsd(city.monthlyCost)} (${narrativeFmtUsd(city.monthlyCost - peers.monthlyCost)} vs ${narrativeFmtUsd(peers.monthlyCost)} avg cost across this list)`,
    `Monthly rent component: ${narrativeFmtUsd(city.monthlyRent)}`,
    `Monthly ${savingsWord} vs this user's budget: ${savingsSign}${narrativeFmtUsd(Math.abs(city.monthlySavings))} (${narrativeFmtUsd(city.monthlySavings - peers.monthlySavings)} vs ${narrativeFmtUsd(peers.monthlySavings)} avg across this list)`,
    `Tax rate: ${city.taxRate}%`,
    'Priority-weighted sub-scores for THIS user (0–100, higher is better):',
    narrativeScoreDeltaLine('Taxes', city.scores.tax, peers.tax, cityCount),
    narrativeScoreDeltaLine('Housing affordability', city.scores.housing, peers.housing, cityCount),
    narrativeScoreDeltaLine('Climate fit', city.scores.climate, peers.climate, cityCount),
    narrativeScoreDeltaLine('Healthcare', city.scores.health, peers.health, cityCount),
    narrativeScoreDeltaLine('Political stability', city.scores.stability, peers.stability, cityCount),
    narrativeScoreDeltaLine('Expat community', city.scores.expat ?? 0, peers.expat, cityCount),
    narrativeScoreDeltaLine('Safety', city.scores.safety, peers.safety, cityCount),
    `User's highest-stated priorities: ${formatTopUserPriorities(priorities)}`,
    `Use ONLY these verified visa facts: ${visaDataForCity}`,
    'Do not invent income requirements. If minimum income exists, state the exact USD figure.',
    '',
  ]
}

function formatNarrativePrompt(
  body: AnalyzeRequest,
  priorities: UserPriorities,
  cities: CityResult[]
): string {
  const peers = computeNarrativePeerAverages(cities)
  const cityBlocks = cities.flatMap((c, i) =>
    formatCityNarrativeBlock(c, i + 1, body, priorities, peers, cities.length)
  )

  return [
    `Write personalized retirement relocation narratives for exactly these ${cities.length} cities.`,
    "These cities are ALREADY ranked by our deterministic scoring engine — do NOT reorder, rescore, or substitute cities.",
    "For each city return:",
    "- pros (2-4 bullets)",
    "- cons (1-3 bullets)",
    "- aiInsight (one short paragraph tied to the user's priorities)",
    "- visa: pick the best retiree option using ONLY that city's verified visa facts above; state the exact USD minimum income if listed (or \"none\"); 1-2 sentence application overview; include the official URL from requirements when present",
    "- healthcare: 1-2 sentences on local healthcare system quality for retirees; estimated monthly healthcare cost in USD; and whether international health insurance is recommended (yes/no with a brief reason)",
    "- tags (1-4 lifestyle tags)",
    "- index: set to the exact 1-based list number shown next to that city in Cities (fixed order) below",
    "For each city in your response, set the `index` field to the exact number (1-based) shown next to that city in the list above.",
    "",
    "PROS AND CONS RULES (strict):",
    "- Every pro and con bullet MUST cite at least one SPECIFIC number or fact from that city's block below (monthly cost, savings/deficit vs budget, tax rate, match score, rank, or a named sub-score with its /100 value and delta vs the list average).",
    "- Explain WHY this city ranks at its position (#1, #2, etc.) relative to the user's stated priorities — reference the user's top priorities (4–5/5) and this city's sub-scores vs the average across these matches.",
    "- Do NOT write generic travel-brochure filler (e.g. \"vibrant city life\", \"endless entertainment\", \"high standard of healthcare\", \"rich culture\", \"welcoming locals\") unless you immediately tie it to a specific stat from that city's block.",
    "- Cons should flag real tradeoffs for THIS user: e.g. below-average sub-scores on their top priorities, tight budget margin, high tax rate, or visa income thresholds vs their budget.",
    "",
    formatUserContext(body, priorities),
    "",
    "Cities (fixed order, with per-user numbers):",
    ...cityBlocks,
  ].join("\n")
}

function extractOpenAIJson(payload: OpenAIChatResponse): OpenAIRecommendationResponse | null {
  const content = payload.choices?.[0]?.message?.content
  if (!content) return null
  try {
    return JSON.parse(content) as OpenAIRecommendationResponse
  } catch {
    return null
  }
}

function cityNarrativesJsonSchema(resultCount: number) {
  return {
    type: "json_schema" as const,
    json_schema: {
      name: "city_narratives",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["cities"],
        properties: {
          cities: {
            type: "array",
            minItems: resultCount,
            maxItems: resultCount,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["index", "name", "country", "pros", "cons", "tags", "visa", "healthcare", "aiInsight"],
              properties: {
                index: { type: "integer" },
                name: { type: "string" },
                country: { type: "string" },
                pros: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
                cons: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
                tags: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
                visa: { type: "string" },
                healthcare: { type: "string" },
                aiInsight: { type: "string" },
              },
            },
          },
        },
      },
    },
  }
}

function buildNarrativeRequestBody(
  body: AnalyzeRequest,
  priorities: UserPriorities,
  cities: CityResult[],
  stream: boolean
) {
  return {
    model: OPENAI_MODEL,
    temperature: 0.4,
    max_tokens: cities.length > 6 ? 9000 : 4000,
    stream,
    messages: [
      {
        role: "system",
        content:
          "You are LiveWhere's retirement relocation writer. Return only narrative fields for the pre-selected cities — including detailed visa and healthcare summaries. Never change rankings or invent numeric scores. For visa fields, use ONLY the verified visa facts provided per country — never invent income requirements. For pros and cons: every bullet must cite a specific number or fact from that city's provided data block (cost, savings, tax rate, match score, rank, or sub-score). Never use generic travel-brochure language unless tied to a specific stat. Explain why each city ranks where it does relative to the user's top priorities.",
      },
      { role: "user", content: formatNarrativePrompt(body, priorities, cities) },
    ],
    response_format: cityNarrativesJsonSchema(cities.length),
  }
}

export type RecommendStreamHandlers = {
  onDelta?: (text: string) => void
  onCity?: (city: CityResult) => void
}

function emitNarrativesFromBuffer(
  buffer: string,
  baseCities: CityResult[],
  baseByKey: Map<string, CityResult>,
  seen: Set<string>,
  handlers: RecommendStreamHandlers
): CityResult[] {
  const emitted: CityResult[] = []
  const peeled = peelCompleteObjectsFromJsonArray(buffer)
  for (const raw of peeled) {
    const partial = raw as OpenAINarrativeCity
    const name = typeof partial.name === "string" ? partial.name.trim() : ""
    if (!name) continue

    const { base, path } = resolveStreamedNarrativePartial(partial, baseCities, baseByKey)
    if (!base) {
      const country = typeof partial.country === "string" ? partial.country.trim() : "Unknown"
      console.warn(`[narrative-merge] no match for "${name}|${country}"`)
      continue
    }

    const seenKey = `${base.name}|${base.country}`
    if (seen.has(seenKey)) continue
    seen.add(seenKey)

    const position = baseCities.indexOf(base)
    console.warn(
      `[narrative-merge] city ${position} (${base.name}|${base.country}) matched via: ${path}`
    )
    recordNarrativeMerge(path)

    const city = mergeNarrative(base, partial)
    emitted.push(city)
    handlers.onCity?.(city)
  }
  return emitted
}

async function readOpenAIStream(
  body: ReadableStream<Uint8Array>,
  onContentDelta: (text: string) => void
): Promise<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let sseBuffer = ""
  let content = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    sseBuffer += decoder.decode(value, { stream: true })

    const lines = sseBuffer.split("\n")
    sseBuffer = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data:")) continue
      const data = trimmed.slice(trimmed.indexOf(":") + 1).trim()
      if (!data || data === "[DONE]") continue
      try {
        const json = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string | null } }>
        }
        const delta = json.choices?.[0]?.delta?.content
        if (delta) {
          content += delta
          onContentDelta(delta)
        }
      } catch {
        /* ignore malformed SSE chunks */
      }
    }
  }

  return content
}

export async function streamRecommendCities(
  body: AnalyzeRequest,
  count: number = RESULT_COUNT,
  handlers: RecommendStreamHandlers = {}
): Promise<CityResult[]> {
  const resultCount = Math.max(1, Math.min(PRO_RESULT_COUNT, Math.round(count)))
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured")
  }

  const priorities = normPrioritiesFromBody(body)
  const ranked = rankSurvivorsForUser(body, resultCount)
  if (ranked.length === 0) {
    throw new Error("No cities matched your budget and priority filters")
  }

  const baseCities = ranked.map((r) => rowToCityResult(r.city, r, body.monthlyBudget))
  const baseByKey = new Map(baseCities.map((c) => [`${c.name}|${c.country}`, c]))

  resetNarrativeMergeStats()

  const res = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(buildNarrativeRequestBody(body, priorities, baseCities, true)),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    throw new Error(`OpenAI API request failed (${res.status})${detail ? `: ${detail}` : ""}`)
  }

  if (!res.body) {
    throw new Error("OpenAI API returned no response body")
  }

  const seen = new Set<string>()
  const streamed: CityResult[] = []
  let accumulated = ""
  let finalCities: CityResult[]

  const content = await readOpenAIStream(res.body, (delta) => {
    accumulated += delta
    handlers.onDelta?.(delta)
    for (const city of emitNarrativesFromBuffer(
      accumulated,
      baseCities,
      baseByKey,
      seen,
      handlers
    )) {
      streamed.push(city)
    }
  })

  if (!content.trim()) {
    finalCities = finalizeNarratives(baseCities, undefined)
  } else {
    const finalJson = extractOpenAIJson({ choices: [{ message: { content } }] })
    const narratives = finalJson?.cities
    if (narratives && narratives.length >= resultCount) {
      finalCities = finalizeNarratives(baseCities, narratives.slice(0, resultCount))
    } else if (streamed.length >= resultCount) {
      const streamedByKey = new Map(streamed.map((c) => [`${c.name}|${c.country}`, c]))
      finalCities = baseCities.map((base) => {
        const merged = streamedByKey.get(`${base.name}|${base.country}`)
        if (merged) return merged
        recordNarrativeMerge("none")
        console.warn(`[narrative-merge] no match for "${base.name}|${base.country}"`)
        return base
      })
    } else {
      emitNarrativesFromBuffer(content, baseCities, baseByKey, seen, handlers)
      if (streamed.length >= resultCount) {
        const streamedByKey = new Map(streamed.map((c) => [`${c.name}|${c.country}`, c]))
        finalCities = baseCities.map((base) => {
          const merged = streamedByKey.get(`${base.name}|${base.country}`)
          if (merged) return merged
          recordNarrativeMerge("none")
          console.warn(`[narrative-merge] no match for "${base.name}|${base.country}"`)
          return base
        })
      } else {
        finalCities = finalizeNarratives(baseCities, undefined)
      }
    }
  }

  logNarrativeMergeSummary(finalCities.length)
  return finalCities
}

export async function recommendCities(
  body: AnalyzeRequest,
  count: number = RESULT_COUNT
): Promise<CityResult[]> {
  return streamRecommendCities(body, count)
}

function makeTeaser(row: CityRow, score: number): CityResult {
  const meta = metaFor(row)
  return {
    name: row.name,
    country: row.country,
    continent: meta.continent,
    flag: meta.flag,
    score,
    taxRate: 0,
    monthlyRent: 0,
    monthlyCost: 0,
    takeHomeMonthly: 0,
    monthlySavings: 0,
    pros: [],
    cons: [],
    tags: [],
    visa: "",
    healthcare: "",
    scores: { tax: 0, housing: 0, climate: 0, health: 0, stability: 0, safety: 0 },
    aiInsight: "",
    locked: true,
  }
}

/**
 * Build cheap locked-teaser cities to pad the free-tier grid up to the full
 * count without asking the model to generate expensive detail for cards the
 * user can't open. Locked cards only render the continent and match score, so
 * teasers carry no premium data. Cities are spread across the region-grouped
 * table for continent variety, with descending scores below the #1 match.
 */
export function buildTeaserCities(
  exclude: Set<string>,
  count: number,
  startScore: number
): CityResult[] {
  if (count <= 0) return []
  const candidates = CITIES.filter((c) => !exclude.has(`${c.name}|${c.country}`))
  if (candidates.length === 0) return []

  const step = Math.max(1, Math.floor(candidates.length / count))
  const picked: CityRow[] = []
  const usedIdx = new Set<number>()
  for (let i = 0; picked.length < count && i < candidates.length; i += step) {
    if (!usedIdx.has(i)) {
      usedIdx.add(i)
      picked.push(candidates[i])
    }
  }
  for (let i = 0; picked.length < count && i < candidates.length; i++) {
    if (!usedIdx.has(i)) {
      usedIdx.add(i)
      picked.push(candidates[i])
    }
  }

  return picked.map((row, idx) => makeTeaser(row, clamp(Math.round(startScore - idx * 3), 45, 99)))
}

