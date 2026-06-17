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
import { rankCities, type ScoreCityResult } from '@/lib/recommendation/scoreCity'

export type CityRow = {
  name: string
  country: string
  avg_temp: number
  tax_rate: number
  rent_usd: number
  safety: number
  healthcare: number
  stability_score: number
}

export const CITIES: CityRow[] = [
  { name: "Dubai", country: "United Arab Emirates", avg_temp: 28, tax_rate: 0, rent_usd: 1850, safety: 8, healthcare: 6.8, stability_score: 81 },
  { name: "Abu Dhabi", country: "United Arab Emirates", avg_temp: 27, tax_rate: 0, rent_usd: 1600, safety: 9, healthcare: 7.2, stability_score: 81 },
  { name: "Doha", country: "Qatar", avg_temp: 27, tax_rate: 0, rent_usd: 1650, safety: 9, healthcare: 6.4, stability_score: 77 },
  { name: "Manama", country: "Bahrain", avg_temp: 26, tax_rate: 0, rent_usd: 1100, safety: 8, healthcare: 5.6, stability_score: 54 },
  { name: "Kuwait City", country: "Kuwait", avg_temp: 26, tax_rate: 0, rent_usd: 1400, safety: 8, healthcare: 5.8, stability_score: 59 },
  { name: "Muscat", country: "Oman", avg_temp: 27, tax_rate: 0, rent_usd: 950, safety: 8, healthcare: 6.3, stability_score: 73 },
  { name: "Riyadh", country: "Saudi Arabia", avg_temp: 26, tax_rate: 0, rent_usd: 900, safety: 7, healthcare: 5.4, stability_score: 59 },
  { name: "Jeddah", country: "Saudi Arabia", avg_temp: 27, tax_rate: 0, rent_usd: 850, safety: 7, healthcare: 5.2, stability_score: 59 },
  { name: "Tel Aviv", country: "Israel", avg_temp: 20, tax_rate: 37, rent_usd: 2100, safety: 7, healthcare: 8, stability_score: 32 },
  { name: "Jerusalem", country: "Israel", avg_temp: 18, tax_rate: 37, rent_usd: 1800, safety: 7, healthcare: 8, stability_score: 32 },
  { name: "Beirut", country: "Lebanon", avg_temp: 21, tax_rate: 25, rent_usd: 800, safety: 5, healthcare: 6, stability_score: 10 },
  { name: "Amman", country: "Jordan", avg_temp: 16, tax_rate: 20, rent_usd: 550, safety: 6, healthcare: 6, stability_score: 43 },
  { name: "Cairo", country: "Egypt", avg_temp: 22, tax_rate: 25, rent_usd: 400, safety: 4, healthcare: 5, stability_score: 19 },
  { name: "Casablanca", country: "Morocco", avg_temp: 18, tax_rate: 38, rent_usd: 480, safety: 5, healthcare: 6, stability_score: 43 },
  { name: "Marrakech", country: "Morocco", avg_temp: 20, tax_rate: 38, rent_usd: 420, safety: 5, healthcare: 5, stability_score: 43 },
  { name: "Tunis", country: "Tunisia", avg_temp: 19, tax_rate: 35, rent_usd: 380, safety: 5, healthcare: 6, stability_score: 43 },
  { name: "Lagos", country: "Nigeria", avg_temp: 27, tax_rate: 24, rent_usd: 650, safety: 3, healthcare: 4, stability_score: 5 },
  { name: "Nairobi", country: "Kenya", avg_temp: 19, tax_rate: 30, rent_usd: 550, safety: 4, healthcare: 5, stability_score: 19 },
  { name: "Johannesburg", country: "South Africa", avg_temp: 16, tax_rate: 36, rent_usd: 650, safety: 3, healthcare: 6, stability_score: 38 },
  { name: "Cape Town", country: "South Africa", avg_temp: 16, tax_rate: 36, rent_usd: 750, safety: 3, healthcare: 7, stability_score: 38 },
  { name: "Durban", country: "South Africa", avg_temp: 21, tax_rate: 36, rent_usd: 500, safety: 4, healthcare: 6, stability_score: 38 },
  { name: "Dar es Salaam", country: "Tanzania", avg_temp: 25, tax_rate: 30, rent_usd: 380, safety: 4, healthcare: 5, stability_score: 49 },
  { name: "Addis Ababa", country: "Ethiopia", avg_temp: 16, tax_rate: 35, rent_usd: 320, safety: 4, healthcare: 4, stability_score: 8 },
  { name: "Panama City", country: "Panama", avg_temp: 27, tax_rate: 0, rent_usd: 950, safety: 6, healthcare: 6, stability_score: 59 },
  { name: "San Jose", country: "Costa Rica", avg_temp: 22, tax_rate: 15, rent_usd: 650, safety: 6, healthcare: 7, stability_score: 72 },
  { name: "Guatemala City", country: "Guatemala", avg_temp: 17, tax_rate: 7, rent_usd: 450, safety: 4, healthcare: 5, stability_score: 29 },
  { name: "San Salvador", country: "El Salvador", avg_temp: 23, tax_rate: 30, rent_usd: 480, safety: 4, healthcare: 5, stability_score: 39 },
  { name: "Tegucigalpa", country: "Honduras", avg_temp: 20, tax_rate: 25, rent_usd: 400, safety: 3, healthcare: 5, stability_score: 32 },
  { name: "Managua", country: "Nicaragua", avg_temp: 26, tax_rate: 30, rent_usd: 380, safety: 5, healthcare: 5, stability_score: 32 },
  { name: "San Juan", country: "Puerto Rico", avg_temp: 26, tax_rate: 33, rent_usd: 1200, safety: 3, healthcare: 7, stability_score: 59 },
  { name: "Kingston", country: "Jamaica", avg_temp: 26, tax_rate: 25, rent_usd: 700, safety: 3, healthcare: 6, stability_score: 43 },
  { name: "Havana", country: "Cuba", avg_temp: 25, tax_rate: 15, rent_usd: 350, safety: 5, healthcare: 4, stability_score: 22 },
  { name: "Santo Domingo", country: "Dominican Republic", avg_temp: 25, tax_rate: 25, rent_usd: 650, safety: 4, healthcare: 6, stability_score: 51 },
  { name: "Mexico City", country: "Mexico", avg_temp: 16, tax_rate: 30, rent_usd: 750, safety: 4, healthcare: 6, stability_score: 35 },
  { name: "Guadalajara", country: "Mexico", avg_temp: 20, tax_rate: 30, rent_usd: 500, safety: 4, healthcare: 6, stability_score: 35 },
  { name: "Monterrey", country: "Mexico", avg_temp: 22, tax_rate: 30, rent_usd: 550, safety: 4, healthcare: 6, stability_score: 35 },
  { name: "Cancun", country: "Mexico", avg_temp: 26, tax_rate: 30, rent_usd: 800, safety: 5, healthcare: 7, stability_score: 35 },
  { name: "Playa del Carmen", country: "Mexico", avg_temp: 27, tax_rate: 30, rent_usd: 850, safety: 5, healthcare: 6, stability_score: 35 },
  { name: "Merida", country: "Mexico", avg_temp: 26, tax_rate: 30, rent_usd: 550, safety: 6, healthcare: 6, stability_score: 35 },
  { name: "Bogota", country: "Colombia", avg_temp: 14, tax_rate: 35, rent_usd: 450, safety: 4, healthcare: 7, stability_score: 38 },
  { name: "Medellin", country: "Colombia", avg_temp: 22, tax_rate: 35, rent_usd: 500, safety: 4, healthcare: 7, stability_score: 38 },
  { name: "Cali", country: "Colombia", avg_temp: 24, tax_rate: 35, rent_usd: 380, safety: 3, healthcare: 6, stability_score: 38 },
  { name: "Cartagena", country: "Colombia", avg_temp: 28, tax_rate: 35, rent_usd: 550, safety: 4, healthcare: 6, stability_score: 38 },
  { name: "Lima", country: "Peru", avg_temp: 19, tax_rate: 30, rent_usd: 600, safety: 4, healthcare: 6, stability_score: 43 },
  { name: "Cusco", country: "Peru", avg_temp: 12, tax_rate: 30, rent_usd: 350, safety: 6, healthcare: 6, stability_score: 43 },
  { name: "Quito", country: "Ecuador", avg_temp: 15, tax_rate: 25, rent_usd: 450, safety: 5, healthcare: 6, stability_score: 32 },
  { name: "Guayaquil", country: "Ecuador", avg_temp: 26, tax_rate: 25, rent_usd: 420, safety: 3, healthcare: 6, stability_score: 32 },
  { name: "La Paz", country: "Bolivia", avg_temp: 8, tax_rate: 13, rent_usd: 350, safety: 5, healthcare: 5, stability_score: 43 },
  { name: "Santa Cruz de la Sierra", country: "Bolivia", avg_temp: 23, tax_rate: 13, rent_usd: 400, safety: 4, healthcare: 5, stability_score: 43 },
  { name: "Santiago", country: "Chile", avg_temp: 14, tax_rate: 40, rent_usd: 700, safety: 5, healthcare: 7, stability_score: 66 },
  { name: "Valparaiso", country: "Chile", avg_temp: 14, tax_rate: 40, rent_usd: 480, safety: 5, healthcare: 7, stability_score: 66 },
  { name: "Buenos Aires", country: "Argentina", avg_temp: 16, tax_rate: 35, rent_usd: 650, safety: 5, healthcare: 8, stability_score: 52 },
  { name: "Cordoba", country: "Argentina", avg_temp: 18, tax_rate: 35, rent_usd: 380, safety: 5, healthcare: 7, stability_score: 52 },
  { name: "Mendoza", country: "Argentina", avg_temp: 15, tax_rate: 35, rent_usd: 350, safety: 6, healthcare: 7, stability_score: 52 },
  { name: "Montevideo", country: "Uruguay", avg_temp: 16, tax_rate: 36, rent_usd: 650, safety: 5, healthcare: 8, stability_score: 83 },
  { name: "Asuncion", country: "Paraguay", avg_temp: 22, tax_rate: 10, rent_usd: 380, safety: 5, healthcare: 6, stability_score: 52 },
  { name: "Sao Paulo", country: "Brazil", avg_temp: 20, tax_rate: 27, rent_usd: 900, safety: 3, healthcare: 7, stability_score: 38 },
  { name: "Rio de Janeiro", country: "Brazil", avg_temp: 23, tax_rate: 27, rent_usd: 750, safety: 3, healthcare: 6, stability_score: 38 },
  { name: "Brasilia", country: "Brazil", avg_temp: 21, tax_rate: 27, rent_usd: 550, safety: 4, healthcare: 7, stability_score: 38 },
  { name: "Belo Horizonte", country: "Brazil", avg_temp: 21, tax_rate: 27, rent_usd: 420, safety: 3, healthcare: 7, stability_score: 38 },
  { name: "Curitiba", country: "Brazil", avg_temp: 17, tax_rate: 27, rent_usd: 480, safety: 5, healthcare: 7, stability_score: 38 },
  { name: "Porto Alegre", country: "Brazil", avg_temp: 19, tax_rate: 27, rent_usd: 450, safety: 3, healthcare: 7, stability_score: 38 },
  { name: "New York", country: "United States", avg_temp: 13, tax_rate: 37, rent_usd: 4200, safety: 5, healthcare: 8, stability_score: 72 },
  { name: "Los Angeles", country: "United States", avg_temp: 18, tax_rate: 37, rent_usd: 2800, safety: 5, healthcare: 8, stability_score: 72 },
  { name: "San Francisco", country: "United States", avg_temp: 14, tax_rate: 37, rent_usd: 3500, safety: 4, healthcare: 8, stability_score: 72 },
  { name: "Miami", country: "United States", avg_temp: 25, tax_rate: 32, rent_usd: 2200, safety: 5, healthcare: 7, stability_score: 72 },
  { name: "Chicago", country: "United States", avg_temp: 10, tax_rate: 37, rent_usd: 2000, safety: 4, healthcare: 8, stability_score: 72 },
  { name: "Austin", country: "United States", avg_temp: 21, tax_rate: 32, rent_usd: 1600, safety: 6, healthcare: 7, stability_score: 72 },
  { name: "Seattle", country: "United States", avg_temp: 11, tax_rate: 32, rent_usd: 2300, safety: 4, healthcare: 8, stability_score: 72 },
  { name: "Boston", country: "United States", avg_temp: 10, tax_rate: 37, rent_usd: 2800, safety: 6, healthcare: 8, stability_score: 72 },
  { name: "Washington DC", country: "United States", avg_temp: 14, tax_rate: 32, rent_usd: 2400, safety: 5, healthcare: 8, stability_score: 72 },
  { name: "Atlanta", country: "United States", avg_temp: 17, tax_rate: 37, rent_usd: 1700, safety: 3, healthcare: 8, stability_score: 72 },
  { name: "Las Vegas", country: "United States", avg_temp: 21, tax_rate: 32, rent_usd: 1200, safety: 4, healthcare: 7, stability_score: 72 },
  { name: "Nashville", country: "United States", avg_temp: 16, tax_rate: 32, rent_usd: 1600, safety: 4, healthcare: 7, stability_score: 72 },
  { name: "Honolulu", country: "United States", avg_temp: 25, tax_rate: 32, rent_usd: 2200, safety: 6, healthcare: 8, stability_score: 72 },
  { name: "Toronto", country: "Canada", avg_temp: 9, tax_rate: 33, rent_usd: 1900, safety: 6, healthcare: 8, stability_score: 82 },
  { name: "Vancouver", country: "Canada", avg_temp: 11, tax_rate: 33, rent_usd: 2100, safety: 6, healthcare: 8, stability_score: 82 },
  { name: "Montreal", country: "Canada", avg_temp: 7, tax_rate: 33, rent_usd: 1200, safety: 7, healthcare: 8, stability_score: 82 },
  { name: "Calgary", country: "Canada", avg_temp: 4, tax_rate: 33, rent_usd: 1400, safety: 7, healthcare: 8, stability_score: 82 },
  { name: "Ottawa", country: "Canada", avg_temp: 6, tax_rate: 33, rent_usd: 1500, safety: 8, healthcare: 8, stability_score: 82 },
  { name: "Quebec City", country: "Canada", avg_temp: 5, tax_rate: 33, rent_usd: 900, safety: 8, healthcare: 8, stability_score: 82 },
  { name: "Edmonton", country: "Canada", avg_temp: 2, tax_rate: 33, rent_usd: 1200, safety: 6, healthcare: 8, stability_score: 82 },
  { name: "London", country: "United Kingdom", avg_temp: 11, tax_rate: 40, rent_usd: 2100, safety: 5, healthcare: 8, stability_score: 69 },
  { name: "Manchester", country: "United Kingdom", avg_temp: 10, tax_rate: 40, rent_usd: 1200, safety: 5, healthcare: 8, stability_score: 69 },
  { name: "Edinburgh", country: "United Kingdom", avg_temp: 9, tax_rate: 40, rent_usd: 1250, safety: 6, healthcare: 8, stability_score: 69 },
  { name: "Birmingham", country: "United Kingdom", avg_temp: 10, tax_rate: 40, rent_usd: 1050, safety: 5, healthcare: 8, stability_score: 69 },
  { name: "Glasgow", country: "United Kingdom", avg_temp: 9, tax_rate: 40, rent_usd: 1000, safety: 4, healthcare: 8, stability_score: 69 },
  { name: "Dublin", country: "Ireland", avg_temp: 10, tax_rate: 40, rent_usd: 2200, safety: 6, healthcare: 8, stability_score: 83 },
  { name: "Cork", country: "Ireland", avg_temp: 10, tax_rate: 40, rent_usd: 1400, safety: 6, healthcare: 8, stability_score: 83 },
  { name: "Paris", country: "France", avg_temp: 12, tax_rate: 30, rent_usd: 1650, safety: 5, healthcare: 8, stability_score: 67 },
  { name: "Lyon", country: "France", avg_temp: 12, tax_rate: 30, rent_usd: 880, safety: 6, healthcare: 8, stability_score: 67 },
  { name: "Marseille", country: "France", avg_temp: 15, tax_rate: 30, rent_usd: 750, safety: 4, healthcare: 8, stability_score: 67 },
  { name: "Nice", country: "France", avg_temp: 16, tax_rate: 30, rent_usd: 1200, safety: 5, healthcare: 8, stability_score: 67 },
  { name: "Toulouse", country: "France", avg_temp: 13, tax_rate: 30, rent_usd: 780, safety: 6, healthcare: 8, stability_score: 67 },
  { name: "Berlin", country: "Germany", avg_temp: 10, tax_rate: 42, rent_usd: 1100, safety: 6, healthcare: 8, stability_score: 78 },
  { name: "Munich", country: "Germany", avg_temp: 9, tax_rate: 42, rent_usd: 1450, safety: 8, healthcare: 8, stability_score: 78 },
  { name: "Hamburg", country: "Germany", avg_temp: 9, tax_rate: 42, rent_usd: 1050, safety: 7, healthcare: 8, stability_score: 78 },
  { name: "Frankfurt", country: "Germany", avg_temp: 10, tax_rate: 42, rent_usd: 1300, safety: 6, healthcare: 8, stability_score: 78 },
  { name: "Vienna", country: "Austria", avg_temp: 11, tax_rate: 45, rent_usd: 1050, safety: 8, healthcare: 8, stability_score: 85 },
  { name: "Zurich", country: "Switzerland", avg_temp: 9, tax_rate: 22, rent_usd: 2200, safety: 8, healthcare: 9, stability_score: 91 },
  { name: "Geneva", country: "Switzerland", avg_temp: 10, tax_rate: 22, rent_usd: 2100, safety: 8, healthcare: 9, stability_score: 91 },
  { name: "Basel", country: "Switzerland", avg_temp: 10, tax_rate: 22, rent_usd: 1800, safety: 8, healthcare: 9, stability_score: 91 },
  { name: "Amsterdam", country: "Netherlands", avg_temp: 10, tax_rate: 37, rent_usd: 1750, safety: 6, healthcare: 8, stability_score: 83 },
  { name: "Rotterdam", country: "Netherlands", avg_temp: 10, tax_rate: 37, rent_usd: 1300, safety: 6, healthcare: 8, stability_score: 83 },
  { name: "The Hague", country: "Netherlands", avg_temp: 10, tax_rate: 37, rent_usd: 1250, safety: 6, healthcare: 8, stability_score: 83 },
  { name: "Brussels", country: "Belgium", avg_temp: 10, tax_rate: 40, rent_usd: 1150, safety: 5, healthcare: 8, stability_score: 73 },
  { name: "Antwerp", country: "Belgium", avg_temp: 10, tax_rate: 40, rent_usd: 950, safety: 5, healthcare: 8, stability_score: 73 },
  { name: "Luxembourg", country: "Luxembourg", avg_temp: 10, tax_rate: 42, rent_usd: 1650, safety: 7, healthcare: 8, stability_score: 85 },
  { name: "Copenhagen", country: "Denmark", avg_temp: 9, tax_rate: 42, rent_usd: 1400, safety: 8, healthcare: 8, stability_score: 90 },
  { name: "Aarhus", country: "Denmark", avg_temp: 8, tax_rate: 42, rent_usd: 950, safety: 8, healthcare: 8, stability_score: 90 },
  { name: "Stockholm", country: "Sweden", avg_temp: 7, tax_rate: 52, rent_usd: 1400, safety: 6, healthcare: 8, stability_score: 85 },
  { name: "Gothenburg", country: "Sweden", avg_temp: 8, tax_rate: 52, rent_usd: 900, safety: 6, healthcare: 8, stability_score: 85 },
  { name: "Oslo", country: "Norway", avg_temp: 4, tax_rate: 47, rent_usd: 1500, safety: 8, healthcare: 8, stability_score: 93 },
  { name: "Bergen", country: "Norway", avg_temp: 7, tax_rate: 47, rent_usd: 1250, safety: 8, healthcare: 8, stability_score: 93 },
  { name: "Helsinki", country: "Finland", avg_temp: 5, tax_rate: 56, rent_usd: 1200, safety: 8, healthcare: 8, stability_score: 93 },
  { name: "Tampere", country: "Finland", avg_temp: 4, tax_rate: 56, rent_usd: 850, safety: 8, healthcare: 8, stability_score: 93 },
  { name: "Reykjavik", country: "Iceland", avg_temp: 4, tax_rate: 46, rent_usd: 1600, safety: 9, healthcare: 8, stability_score: 92 },
  { name: "Madrid", country: "Spain", avg_temp: 15, tax_rate: 24, rent_usd: 1250, safety: 6, healthcare: 8, stability_score: 67 },
  { name: "Barcelona", country: "Spain", avg_temp: 17, tax_rate: 24, rent_usd: 1350, safety: 6, healthcare: 8, stability_score: 67 },
  { name: "Valencia", country: "Spain", avg_temp: 18, tax_rate: 24, rent_usd: 900, safety: 7, healthcare: 8, stability_score: 67 },
  { name: "Malaga", country: "Spain", avg_temp: 19, tax_rate: 24, rent_usd: 850, safety: 7, healthcare: 7, stability_score: 67 },
  { name: "Lisbon", country: "Portugal", avg_temp: 17, tax_rate: 20, rent_usd: 1200, safety: 7, healthcare: 7, stability_score: 77 },
  { name: "Porto", country: "Portugal", avg_temp: 16, tax_rate: 20, rent_usd: 850, safety: 7, healthcare: 7, stability_score: 77 },
  { name: "Braga", country: "Portugal", avg_temp: 15, tax_rate: 20, rent_usd: 650, safety: 7, healthcare: 7, stability_score: 77 },
  { name: "Faro", country: "Portugal", avg_temp: 18, tax_rate: 20, rent_usd: 900, safety: 7, healthcare: 7, stability_score: 77 },
  { name: "Rome", country: "Italy", avg_temp: 15, tax_rate: 43, rent_usd: 1300, safety: 5, healthcare: 8, stability_score: 59 },
  { name: "Milan", country: "Italy", avg_temp: 13, tax_rate: 43, rent_usd: 1450, safety: 5, healthcare: 8, stability_score: 59 },
  { name: "Florence", country: "Italy", avg_temp: 15, tax_rate: 43, rent_usd: 1100, safety: 6, healthcare: 8, stability_score: 59 },
  { name: "Naples", country: "Italy", avg_temp: 16, tax_rate: 43, rent_usd: 850, safety: 4, healthcare: 7, stability_score: 59 },
  { name: "Venice", country: "Italy", avg_temp: 13, tax_rate: 43, rent_usd: 1200, safety: 6, healthcare: 8, stability_score: 59 },
  { name: "Athens", country: "Greece", avg_temp: 18, tax_rate: 44, rent_usd: 700, safety: 6, healthcare: 7, stability_score: 59 },
  { name: "Thessaloniki", country: "Greece", avg_temp: 16, tax_rate: 44, rent_usd: 520, safety: 6, healthcare: 7, stability_score: 59 },
  { name: "Limassol", country: "Cyprus", avg_temp: 21, tax_rate: 20, rent_usd: 950, safety: 7, healthcare: 7, stability_score: 69 },
  { name: "Warsaw", country: "Poland", avg_temp: 9, tax_rate: 32, rent_usd: 750, safety: 7, healthcare: 7, stability_score: 73 },
  { name: "Krakow", country: "Poland", avg_temp: 8, tax_rate: 32, rent_usd: 650, safety: 7, healthcare: 7, stability_score: 73 },
  { name: "Wroclaw", country: "Poland", avg_temp: 9, tax_rate: 32, rent_usd: 600, safety: 7, healthcare: 7, stability_score: 73 },
  { name: "Prague", country: "Czech Republic", avg_temp: 10, tax_rate: 23, rent_usd: 900, safety: 7, healthcare: 8, stability_score: 76 },
  { name: "Budapest", country: "Hungary", avg_temp: 12, tax_rate: 15, rent_usd: 650, safety: 7, healthcare: 7, stability_score: 59 },
  { name: "Ljubljana", country: "Slovenia", avg_temp: 12, tax_rate: 25, rent_usd: 850, safety: 8, healthcare: 8, stability_score: 83 },
  { name: "Zagreb", country: "Croatia", avg_temp: 13, tax_rate: 23, rent_usd: 700, safety: 7, healthcare: 7, stability_score: 77 },
  { name: "Split", country: "Croatia", avg_temp: 16, tax_rate: 23, rent_usd: 800, safety: 7, healthcare: 7, stability_score: 77 },
  { name: "Belgrade", country: "Serbia", avg_temp: 13, tax_rate: 20, rent_usd: 500, safety: 5, healthcare: 6, stability_score: 52 },
  { name: "Bucharest", country: "Romania", avg_temp: 11, tax_rate: 10, rent_usd: 550, safety: 6, healthcare: 7, stability_score: 59 },
  { name: "Sofia", country: "Bulgaria", avg_temp: 11, tax_rate: 10, rent_usd: 480, safety: 7, healthcare: 6, stability_score: 59 },
  { name: "Tallinn", country: "Estonia", avg_temp: 6, tax_rate: 20, rent_usd: 800, safety: 8, healthcare: 8, stability_score: 79 },
  { name: "Riga", country: "Latvia", avg_temp: 6, tax_rate: 20, rent_usd: 650, safety: 6, healthcare: 7, stability_score: 73 },
  { name: "Vilnius", country: "Lithuania", avg_temp: 7, tax_rate: 20, rent_usd: 750, safety: 7, healthcare: 7, stability_score: 76 },
  { name: "Kyiv", country: "Ukraine", avg_temp: 8, tax_rate: 18, rent_usd: 550, safety: 4, healthcare: 6, stability_score: 15 },
  { name: "Lviv", country: "Ukraine", avg_temp: 8, tax_rate: 18, rent_usd: 420, safety: 6, healthcare: 6, stability_score: 15 },
  { name: "Moscow", country: "Russia", avg_temp: 6, tax_rate: 13, rent_usd: 1100, safety: 4, healthcare: 7, stability_score: 24 },
  { name: "Saint Petersburg", country: "Russia", avg_temp: 6, tax_rate: 13, rent_usd: 800, safety: 4, healthcare: 7, stability_score: 24 },
  { name: "Tbilisi", country: "Georgia", avg_temp: 13, tax_rate: 1, rent_usd: 550, safety: 7, healthcare: 5.8, stability_score: 49 },
  { name: "Batumi", country: "Georgia", avg_temp: 19, tax_rate: 1, rent_usd: 420, safety: 7, healthcare: 4.2, stability_score: 49 },
  { name: "Yerevan", country: "Armenia", avg_temp: 13, tax_rate: 20, rent_usd: 450, safety: 7, healthcare: 5.3, stability_score: 39 },
  { name: "Baku", country: "Azerbaijan", avg_temp: 15, tax_rate: 20, rent_usd: 650, safety: 7, healthcare: 6.2, stability_score: 24 },
  { name: "Almaty", country: "Kazakhstan", avg_temp: 11, tax_rate: 10, rent_usd: 550, safety: 6, healthcare: 6, stability_score: 49 },
  { name: "Astana", country: "Kazakhstan", avg_temp: 5, tax_rate: 10, rent_usd: 500, safety: 7, healthcare: 6, stability_score: 49 },
  { name: "Tashkent", country: "Uzbekistan", avg_temp: 15, tax_rate: 12, rent_usd: 350, safety: 6, healthcare: 6, stability_score: 39 },
  { name: "Bangkok", country: "Thailand", avg_temp: 29, tax_rate: 15, rent_usd: 650, safety: 6, healthcare: 8, stability_score: 32 },
  { name: "Chiang Mai", country: "Thailand", avg_temp: 26, tax_rate: 15, rent_usd: 420, safety: 7, healthcare: 7, stability_score: 32 },
  { name: "Phuket", country: "Thailand", avg_temp: 28, tax_rate: 15, rent_usd: 520, safety: 6, healthcare: 7, stability_score: 32 },
  { name: "Singapore", country: "Singapore", avg_temp: 27, tax_rate: 22, rent_usd: 2800, safety: 9, healthcare: 9, stability_score: 96 },
  { name: "Kuala Lumpur", country: "Malaysia", avg_temp: 27, tax_rate: 24, rent_usd: 550, safety: 6, healthcare: 8, stability_score: 43 },
  { name: "Penang", country: "Malaysia", avg_temp: 27, tax_rate: 24, rent_usd: 480, safety: 7, healthcare: 7, stability_score: 43 },
  { name: "Jakarta", country: "Indonesia", avg_temp: 27, tax_rate: 25, rent_usd: 550, safety: 5, healthcare: 5, stability_score: 29 },
  { name: "Bali", country: "Indonesia", avg_temp: 27, tax_rate: 25, rent_usd: 550, safety: 6, healthcare: 5, stability_score: 29 },
  { name: "Surabaya", country: "Indonesia", avg_temp: 28, tax_rate: 25, rent_usd: 380, safety: 5, healthcare: 5, stability_score: 29 },
  { name: "Ho Chi Minh City", country: "Vietnam", avg_temp: 28, tax_rate: 20, rent_usd: 500, safety: 5, healthcare: 6, stability_score: 49 },
  { name: "Hanoi", country: "Vietnam", avg_temp: 24, tax_rate: 20, rent_usd: 450, safety: 6, healthcare: 6, stability_score: 49 },
  { name: "Manila", country: "Philippines", avg_temp: 27, tax_rate: 25, rent_usd: 450, safety: 4, healthcare: 6, stability_score: 29 },
  { name: "Cebu", country: "Philippines", avg_temp: 28, tax_rate: 25, rent_usd: 380, safety: 5, healthcare: 6, stability_score: 29 },
  { name: "Taipei", country: "Taiwan", avg_temp: 23, tax_rate: 20, rent_usd: 750, safety: 8, healthcare: 8, stability_score: 83 },
  { name: "Kaohsiung", country: "Taiwan", avg_temp: 25, tax_rate: 20, rent_usd: 520, safety: 7, healthcare: 8, stability_score: 83 },
  { name: "Tokyo", country: "Japan", avg_temp: 16, tax_rate: 33, rent_usd: 1200, safety: 8, healthcare: 9, stability_score: 85 },
  { name: "Osaka", country: "Japan", avg_temp: 16, tax_rate: 33, rent_usd: 850, safety: 8, healthcare: 8, stability_score: 85 },
  { name: "Kyoto", country: "Japan", avg_temp: 15, tax_rate: 33, rent_usd: 720, safety: 8, healthcare: 8, stability_score: 85 },
  { name: "Fukuoka", country: "Japan", avg_temp: 17, tax_rate: 33, rent_usd: 680, safety: 8, healthcare: 8, stability_score: 85 },
  { name: "Sapporo", country: "Japan", avg_temp: 9, tax_rate: 33, rent_usd: 550, safety: 8, healthcare: 8, stability_score: 85 },
  { name: "Sydney", country: "Australia", avg_temp: 18, tax_rate: 39, rent_usd: 2100, safety: 7, healthcare: 8, stability_score: 83 },
  { name: "Melbourne", country: "Australia", avg_temp: 15, tax_rate: 39, rent_usd: 1650, safety: 7, healthcare: 8, stability_score: 83 },
  { name: "Brisbane", country: "Australia", avg_temp: 21, tax_rate: 39, rent_usd: 1500, safety: 6, healthcare: 8, stability_score: 83 },
  { name: "Perth", country: "Australia", avg_temp: 18, tax_rate: 39, rent_usd: 1400, safety: 7, healthcare: 8, stability_score: 83 },
  { name: "Adelaide", country: "Australia", avg_temp: 17, tax_rate: 39, rent_usd: 1200, safety: 7, healthcare: 8, stability_score: 83 },
  { name: "Auckland", country: "New Zealand", avg_temp: 15, tax_rate: 33, rent_usd: 1900, safety: 6, healthcare: 8, stability_score: 92 },
  { name: "Wellington", country: "New Zealand", avg_temp: 13, tax_rate: 33, rent_usd: 1700, safety: 7, healthcare: 8, stability_score: 92 },
  { name: "Christchurch", country: "New Zealand", avg_temp: 12, tax_rate: 33, rent_usd: 1300, safety: 7, healthcare: 8, stability_score: 92 },
  { name: "Seoul", country: "South Korea", avg_temp: 13, tax_rate: 35, rent_usd: 950, safety: 8, healthcare: 9, stability_score: 73 },
  { name: "Busan", country: "South Korea", avg_temp: 15, tax_rate: 35, rent_usd: 650, safety: 7, healthcare: 8, stability_score: 73 },
  { name: "Beijing", country: "China", avg_temp: 13, tax_rate: 25, rent_usd: 950, safety: 6, healthcare: 7, stability_score: 32 },
  { name: "Shanghai", country: "China", avg_temp: 17, tax_rate: 25, rent_usd: 1400, safety: 6, healthcare: 8, stability_score: 32 },
  { name: "Shenzhen", country: "China", avg_temp: 23, tax_rate: 25, rent_usd: 900, safety: 7, healthcare: 8, stability_score: 32 },
  { name: "Guangzhou", country: "China", avg_temp: 23, tax_rate: 25, rent_usd: 650, safety: 5, healthcare: 8, stability_score: 32 },
  { name: "Chengdu", country: "China", avg_temp: 17, tax_rate: 25, rent_usd: 450, safety: 7, healthcare: 7, stability_score: 32 },
  { name: "Hangzhou", country: "China", avg_temp: 17, tax_rate: 25, rent_usd: 720, safety: 7, healthcare: 8, stability_score: 32 },
  { name: "XiAn", country: "China", avg_temp: 14, tax_rate: 25, rent_usd: 400, safety: 7, healthcare: 7, stability_score: 32 },
  { name: "Hong Kong", country: "Hong Kong", avg_temp: 23, tax_rate: 15, rent_usd: 2200, safety: 7, healthcare: 8, stability_score: 68 },
  { name: "Macau", country: "Macau", avg_temp: 23, tax_rate: 12, rent_usd: 1400, safety: 7, healthcare: 8, stability_score: 83 },
  { name: "Ulaanbaatar", country: "Mongolia", avg_temp: 0, tax_rate: 10, rent_usd: 450, safety: 6, healthcare: 6, stability_score: 73 },
  { name: "Kathmandu", country: "Nepal", avg_temp: 15, tax_rate: 30, rent_usd: 280, safety: 4, healthcare: 5, stability_score: 39 },
  { name: "Colombo", country: "Sri Lanka", avg_temp: 27, tax_rate: 24, rent_usd: 380, safety: 5, healthcare: 6, stability_score: 32 },
]

const DISPLAY: Record<string, { continent: string; flag: string }> = {
  "Dubai|United Arab Emirates": { continent: "Middle East", flag: "🇦🇪" },
  "Abu Dhabi|United Arab Emirates": { continent: "Middle East", flag: "🇦🇪" },
  "Doha|Qatar": { continent: "Middle East", flag: "🇶🇦" },
  "Manama|Bahrain": { continent: "Middle East", flag: "🇧🇭" },
  "Kuwait City|Kuwait": { continent: "Middle East", flag: "🇰🇼" },
  "Muscat|Oman": { continent: "Middle East", flag: "🇴🇲" },
  "Riyadh|Saudi Arabia": { continent: "Middle East", flag: "🇸🇦" },
  "Jeddah|Saudi Arabia": { continent: "Middle East", flag: "🇸🇦" },
  "Tel Aviv|Israel": { continent: "Middle East", flag: "🇮🇱" },
  "Jerusalem|Israel": { continent: "Middle East", flag: "🇮🇱" },
  "Beirut|Lebanon": { continent: "Middle East", flag: "🇱🇧" },
  "Amman|Jordan": { continent: "Middle East", flag: "🇯🇴" },
  "Cairo|Egypt": { continent: "Africa", flag: "🇪🇬" },
  "Casablanca|Morocco": { continent: "Africa", flag: "🇲🇦" },
  "Marrakech|Morocco": { continent: "Africa", flag: "🇲🇦" },
  "Tunis|Tunisia": { continent: "Africa", flag: "🇹🇳" },
  "Lagos|Nigeria": { continent: "Africa", flag: "🇳🇬" },
  "Nairobi|Kenya": { continent: "Africa", flag: "🇰🇪" },
  "Johannesburg|South Africa": { continent: "Africa", flag: "🇿🇦" },
  "Cape Town|South Africa": { continent: "Africa", flag: "🇿🇦" },
  "Durban|South Africa": { continent: "Africa", flag: "🇿🇦" },
  "Dar es Salaam|Tanzania": { continent: "Africa", flag: "🇹🇿" },
  "Addis Ababa|Ethiopia": { continent: "Africa", flag: "🇪🇹" },
  "Panama City|Panama": { continent: "Americas", flag: "🇵🇦" },
  "San Jose|Costa Rica": { continent: "Americas", flag: "🇨🇷" },
  "Guatemala City|Guatemala": { continent: "Americas", flag: "🇬🇹" },
  "San Salvador|El Salvador": { continent: "Americas", flag: "🇸🇻" },
  "Tegucigalpa|Honduras": { continent: "Americas", flag: "🇭🇳" },
  "Managua|Nicaragua": { continent: "Americas", flag: "🇳🇮" },
  "San Juan|Puerto Rico": { continent: "Americas", flag: "🇵🇷" },
  "Kingston|Jamaica": { continent: "Americas", flag: "🇯🇲" },
  "Havana|Cuba": { continent: "Americas", flag: "🇨🇺" },
  "Santo Domingo|Dominican Republic": { continent: "Americas", flag: "🇩🇴" },
  "Mexico City|Mexico": { continent: "Americas", flag: "🇲🇽" },
  "Guadalajara|Mexico": { continent: "Americas", flag: "🇲🇽" },
  "Monterrey|Mexico": { continent: "Americas", flag: "🇲🇽" },
  "Cancun|Mexico": { continent: "Americas", flag: "🇲🇽" },
  "Playa del Carmen|Mexico": { continent: "Americas", flag: "🇲🇽" },
  "Merida|Mexico": { continent: "Americas", flag: "🇲🇽" },
  "Bogota|Colombia": { continent: "Americas", flag: "🇨🇴" },
  "Medellin|Colombia": { continent: "Americas", flag: "🇨🇴" },
  "Cali|Colombia": { continent: "Americas", flag: "🇨🇴" },
  "Cartagena|Colombia": { continent: "Americas", flag: "🇨🇴" },
  "Lima|Peru": { continent: "Americas", flag: "🇵🇪" },
  "Cusco|Peru": { continent: "Americas", flag: "🇵🇪" },
  "Quito|Ecuador": { continent: "Americas", flag: "🇪🇨" },
  "Guayaquil|Ecuador": { continent: "Americas", flag: "🇪🇨" },
  "La Paz|Bolivia": { continent: "Americas", flag: "🇧🇴" },
  "Santa Cruz de la Sierra|Bolivia": { continent: "Americas", flag: "🇧🇴" },
  "Santiago|Chile": { continent: "Americas", flag: "🇨🇱" },
  "Valparaiso|Chile": { continent: "Americas", flag: "🇨🇱" },
  "Buenos Aires|Argentina": { continent: "Americas", flag: "🇦🇷" },
  "Cordoba|Argentina": { continent: "Americas", flag: "🇦🇷" },
  "Mendoza|Argentina": { continent: "Americas", flag: "🇦🇷" },
  "Montevideo|Uruguay": { continent: "Americas", flag: "🇺🇾" },
  "Asuncion|Paraguay": { continent: "Americas", flag: "🇵🇾" },
  "Sao Paulo|Brazil": { continent: "Americas", flag: "🇧🇷" },
  "Rio de Janeiro|Brazil": { continent: "Americas", flag: "🇧🇷" },
  "Brasilia|Brazil": { continent: "Americas", flag: "🇧🇷" },
  "Belo Horizonte|Brazil": { continent: "Americas", flag: "🇧🇷" },
  "Curitiba|Brazil": { continent: "Americas", flag: "🇧🇷" },
  "Porto Alegre|Brazil": { continent: "Americas", flag: "🇧🇷" },
  "New York|United States": { continent: "Americas", flag: "🇺🇸" },
  "Los Angeles|United States": { continent: "Americas", flag: "🇺🇸" },
  "San Francisco|United States": { continent: "Americas", flag: "🇺🇸" },
  "Miami|United States": { continent: "Americas", flag: "🇺🇸" },
  "Chicago|United States": { continent: "Americas", flag: "🇺🇸" },
  "Austin|United States": { continent: "Americas", flag: "🇺🇸" },
  "Seattle|United States": { continent: "Americas", flag: "🇺🇸" },
  "Boston|United States": { continent: "Americas", flag: "🇺🇸" },
  "Washington DC|United States": { continent: "Americas", flag: "🇺🇸" },
  "Atlanta|United States": { continent: "Americas", flag: "🇺🇸" },
  "Las Vegas|United States": { continent: "Americas", flag: "🇺🇸" },
  "Nashville|United States": { continent: "Americas", flag: "🇺🇸" },
  "Honolulu|United States": { continent: "Americas", flag: "🇺🇸" },
  "Toronto|Canada": { continent: "Americas", flag: "🇨🇦" },
  "Vancouver|Canada": { continent: "Americas", flag: "🇨🇦" },
  "Montreal|Canada": { continent: "Americas", flag: "🇨🇦" },
  "Calgary|Canada": { continent: "Americas", flag: "🇨🇦" },
  "Ottawa|Canada": { continent: "Americas", flag: "🇨🇦" },
  "Quebec City|Canada": { continent: "Americas", flag: "🇨🇦" },
  "Edmonton|Canada": { continent: "Americas", flag: "🇨🇦" },
  "London|United Kingdom": { continent: "Europe", flag: "🇬🇧" },
  "Manchester|United Kingdom": { continent: "Europe", flag: "🇬🇧" },
  "Edinburgh|United Kingdom": { continent: "Europe", flag: "🇬🇧" },
  "Birmingham|United Kingdom": { continent: "Europe", flag: "🇬🇧" },
  "Glasgow|United Kingdom": { continent: "Europe", flag: "🇬🇧" },
  "Dublin|Ireland": { continent: "Europe", flag: "🇮🇪" },
  "Cork|Ireland": { continent: "Europe", flag: "🇮🇪" },
  "Paris|France": { continent: "Europe", flag: "🇫🇷" },
  "Lyon|France": { continent: "Europe", flag: "🇫🇷" },
  "Marseille|France": { continent: "Europe", flag: "🇫🇷" },
  "Nice|France": { continent: "Europe", flag: "🇫🇷" },
  "Toulouse|France": { continent: "Europe", flag: "🇫🇷" },
  "Berlin|Germany": { continent: "Europe", flag: "🇩🇪" },
  "Munich|Germany": { continent: "Europe", flag: "🇩🇪" },
  "Hamburg|Germany": { continent: "Europe", flag: "🇩🇪" },
  "Frankfurt|Germany": { continent: "Europe", flag: "🇩🇪" },
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
  "Stockholm|Sweden": { continent: "Europe", flag: "🇸🇪" },
  "Gothenburg|Sweden": { continent: "Europe", flag: "🇸🇪" },
  "Oslo|Norway": { continent: "Europe", flag: "🇳🇴" },
  "Bergen|Norway": { continent: "Europe", flag: "🇳🇴" },
  "Helsinki|Finland": { continent: "Europe", flag: "🇫🇮" },
  "Tampere|Finland": { continent: "Europe", flag: "🇫🇮" },
  "Reykjavik|Iceland": { continent: "Europe", flag: "🇮🇸" },
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
  "Thessaloniki|Greece": { continent: "Europe", flag: "🇬🇷" },
  "Limassol|Cyprus": { continent: "Europe", flag: "🇨🇾" },
  "Warsaw|Poland": { continent: "Europe", flag: "🇵🇱" },
  "Krakow|Poland": { continent: "Europe", flag: "🇵🇱" },
  "Wroclaw|Poland": { continent: "Europe", flag: "🇵🇱" },
  "Prague|Czech Republic": { continent: "Europe", flag: "🇨🇿" },
  "Budapest|Hungary": { continent: "Europe", flag: "🇭🇺" },
  "Ljubljana|Slovenia": { continent: "Europe", flag: "🇸🇮" },
  "Zagreb|Croatia": { continent: "Europe", flag: "🇭🇷" },
  "Split|Croatia": { continent: "Europe", flag: "🇭🇷" },
  "Belgrade|Serbia": { continent: "Europe", flag: "🇷🇸" },
  "Bucharest|Romania": { continent: "Europe", flag: "🇷🇴" },
  "Sofia|Bulgaria": { continent: "Europe", flag: "🇧🇬" },
  "Tallinn|Estonia": { continent: "Europe", flag: "🇪🇪" },
  "Riga|Latvia": { continent: "Europe", flag: "🇱🇻" },
  "Vilnius|Lithuania": { continent: "Europe", flag: "🇱🇹" },
  "Kyiv|Ukraine": { continent: "Europe", flag: "🇺🇦" },
  "Lviv|Ukraine": { continent: "Europe", flag: "🇺🇦" },
  "Moscow|Russia": { continent: "Europe", flag: "🇷🇺" },
  "Saint Petersburg|Russia": { continent: "Europe", flag: "🇷🇺" },
  "Tbilisi|Georgia": { continent: "Asia", flag: "🇬🇪" },
  "Batumi|Georgia": { continent: "Asia", flag: "🇬🇪" },
  "Yerevan|Armenia": { continent: "Asia", flag: "🇦🇲" },
  "Baku|Azerbaijan": { continent: "Asia", flag: "🇦🇿" },
  "Almaty|Kazakhstan": { continent: "Asia", flag: "🇰🇿" },
  "Astana|Kazakhstan": { continent: "Asia", flag: "🇰🇿" },
  "Tashkent|Uzbekistan": { continent: "Asia", flag: "🇺🇿" },
  "Bangkok|Thailand": { continent: "Asia", flag: "🇹🇭" },
  "Chiang Mai|Thailand": { continent: "Asia", flag: "🇹🇭" },
  "Phuket|Thailand": { continent: "Asia", flag: "🇹🇭" },
  "Singapore|Singapore": { continent: "Asia", flag: "🇸🇬" },
  "Kuala Lumpur|Malaysia": { continent: "Asia", flag: "🇲🇾" },
  "Penang|Malaysia": { continent: "Asia", flag: "🇲🇾" },
  "Jakarta|Indonesia": { continent: "Asia", flag: "🇮🇩" },
  "Bali|Indonesia": { continent: "Asia", flag: "🇮🇩" },
  "Surabaya|Indonesia": { continent: "Asia", flag: "🇮🇩" },
  "Ho Chi Minh City|Vietnam": { continent: "Asia", flag: "🇻🇳" },
  "Hanoi|Vietnam": { continent: "Asia", flag: "🇻🇳" },
  "Manila|Philippines": { continent: "Asia", flag: "🇵🇭" },
  "Cebu|Philippines": { continent: "Asia", flag: "🇵🇭" },
  "Taipei|Taiwan": { continent: "Asia", flag: "🇹🇼" },
  "Kaohsiung|Taiwan": { continent: "Asia", flag: "🇹🇼" },
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
  "Beijing|China": { continent: "Asia", flag: "🇨🇳" },
  "Shanghai|China": { continent: "Asia", flag: "🇨🇳" },
  "Shenzhen|China": { continent: "Asia", flag: "🇨🇳" },
  "Guangzhou|China": { continent: "Asia", flag: "🇨🇳" },
  "Chengdu|China": { continent: "Asia", flag: "🇨🇳" },
  "Hangzhou|China": { continent: "Asia", flag: "🇨🇳" },
  "XiAn|China": { continent: "Asia", flag: "🇨🇳" },
  "Hong Kong|Hong Kong": { continent: "Asia", flag: "🇭🇰" },
  "Macau|Macau": { continent: "Asia", flag: "🇲🇴" },
  "Ulaanbaatar|Mongolia": { continent: "Asia", flag: "🇲🇳" },
  "Kathmandu|Nepal": { continent: "Asia", flag: "🇳🇵" },
  "Colombo|Sri Lanka": { continent: "Asia", flag: "🇱🇰" },
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

type OpenAIRecommendationResponse = {
  cities?: Array<Partial<CityResult>>
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

function rankSurvivorsForUser(body: AnalyzeRequest, count: number): ScoreCityResult[] {
  const priorities = normPrioritiesFromBody(body)
  return rankCities(CITIES, { monthlyBudget: body.monthlyBudget, priorities })
    .filter((r) => !r.eliminated)
    .slice(0, count)
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
    visa: "Check nomad, work, or residency options.",
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
    tags: list(partial.tags, base.tags),
  }
}

function finalizeNarratives(
  baseCities: CityResult[],
  narratives: Array<Partial<CityResult>> | undefined
): CityResult[] {
  if (!narratives?.length) return baseCities
  const byKey = new Map(
    narratives.map((n) => [`${text(n.name, "")}|${text(n.country, "")}`, n])
  )
  return baseCities.map((base) => {
    const partial = byKey.get(`${base.name}|${base.country}`)
    return partial ? mergeNarrative(base, partial) : base
  })
}

function formatUserContext(body: AnalyzeRequest, priorities: UserPriorities): string {
  return [
    `Target monthly living budget: $${body.monthlyBudget.toLocaleString()} ${body.currency}/month`,
    `Lifestyle: ${body.lifestyle.length ? body.lifestyle.join(", ") : "No specific lifestyle selected"}`,
    "Priorities, 1-5:",
    `- Low taxes: ${priorities.tax} (${priorityLabel(priorities.tax)})`,
    `- Affordable housing: ${priorities.housing} (${priorityLabel(priorities.housing)})`,
    `- Climate: ${priorities.climate} (${priorityLabel(priorities.climate)})`,
    `- Healthcare: ${priorities.health} (${priorityLabel(priorities.health)})`,
    `- Long-term stability: ${priorities.stability} (${priorityLabel(priorities.stability)})`,
    `- Safety: ${priorities.safety} (${priorityLabel(priorities.safety)})`,
    `- Expat community: ${priorities.expat_community} (${priorityLabel(priorities.expat_community)})`,
    `- Visa and residency ease: ${priorities.visa_residency} (${priorityLabel(priorities.visa_residency)})`,
  ].join("\n")
}

function formatNarrativePrompt(
  body: AnalyzeRequest,
  priorities: UserPriorities,
  cities: CityResult[]
): string {
  return [
    `Write personalized retirement relocation narratives for exactly these ${cities.length} cities.`,
    "These cities are ALREADY ranked by our deterministic scoring engine — do NOT reorder, rescore, or substitute cities.",
    "For each city return pros (2-4 bullets), cons (1-3 bullets), aiInsight (one short paragraph), a practical visa summary, and lifestyle tags.",
    "Focus on retirement-relevant reasoning tied to the user's priorities below.",
    "",
    formatUserContext(body, priorities),
    "",
    "Cities (fixed order):",
    ...cities.map((c, i) => `${i + 1}. ${c.name}, ${c.country} (match score ${c.score})`),
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
              required: ["name", "country", "pros", "cons", "tags", "visa", "aiInsight"],
              properties: {
                name: { type: "string" },
                country: { type: "string" },
                pros: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
                cons: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
                tags: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
                visa: { type: "string" },
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
    max_tokens: cities.length > 6 ? 6000 : 2500,
    stream,
    messages: [
      {
        role: "system",
        content:
          "You are LiveWhere's retirement relocation writer. Return only narrative fields for the pre-selected cities. Never change rankings or invent numeric scores.",
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
  baseByKey: Map<string, CityResult>,
  seen: Set<string>,
  handlers: RecommendStreamHandlers
): CityResult[] {
  const emitted: CityResult[] = []
  const peeled = peelCompleteObjectsFromJsonArray(buffer)
  for (const raw of peeled) {
    const partial = raw as Partial<CityResult>
    const name = typeof partial.name === "string" ? partial.name.trim() : ""
    if (!name) continue
    const country = typeof partial.country === "string" ? partial.country.trim() : "Unknown"
    const key = `${name}|${country}`
    if (seen.has(key)) continue
    const base = baseByKey.get(key)
    if (!base) continue
    seen.add(key)
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

  const content = await readOpenAIStream(res.body, (delta) => {
    accumulated += delta
    handlers.onDelta?.(delta)
    for (const city of emitNarrativesFromBuffer(accumulated, baseByKey, seen, handlers)) {
      streamed.push(city)
    }
  })

  if (!content.trim()) {
    return finalizeNarratives(baseCities, undefined)
  }

  const finalJson = extractOpenAIJson({ choices: [{ message: { content } }] })
  const narratives = finalJson?.cities
  if (narratives && narratives.length >= resultCount) {
    return finalizeNarratives(baseCities, narratives.slice(0, resultCount))
  }

  if (streamed.length >= resultCount) {
    const streamedByKey = new Map(streamed.map((c) => [`${c.name}|${c.country}`, c]))
    return baseCities.map((base) => streamedByKey.get(`${base.name}|${base.country}`) ?? base)
  }

  emitNarrativesFromBuffer(content, baseByKey, seen, handlers)
  if (streamed.length >= resultCount) {
    const streamedByKey = new Map(streamed.map((c) => [`${c.name}|${c.country}`, c]))
    return baseCities.map((base) => streamedByKey.get(`${base.name}|${base.country}`) ?? base)
  }

  return finalizeNarratives(baseCities, undefined)
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
