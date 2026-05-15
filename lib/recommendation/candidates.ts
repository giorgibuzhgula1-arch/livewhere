export type Continent = 'Europe' | 'Americas' | 'Asia' | 'Other'

export type HealthcareTier = 'excellent' | 'good' | 'average' | 'poor'

export type CandidateCity = {
  name: string
  country: string
  continent: Continent
  flag: string
  lat: number
  lon: number
  numbeoQuery: string
  healthcareTier: HealthcareTier
  nightlifeHub: boolean
  visaNote: string
  tags: string[]
}

export const CANDIDATE_CITIES: CandidateCity[] = [
  { name: 'Dubai', country: 'United Arab Emirates', continent: 'Asia', flag: '🇦🇪', lat: 25.2, lon: 55.27, numbeoQuery: 'Dubai', healthcareTier: 'excellent', nightlifeHub: true, visaNote: 'Remote work / freelancer visas available; 0% personal income tax.', tags: ['Low tax', 'Warm', 'Modern'] },
  { name: 'Panama City', country: 'Panama', continent: 'Americas', flag: '🇵🇦', lat: 8.98, lon: -79.52, numbeoQuery: 'Panama City', healthcareTier: 'good', nightlifeHub: true, visaNote: 'Friendly Nations & Pensionado visas; foreign income often exempt.', tags: ['Low tax', 'Warm', 'Americas'] },
  { name: 'Tbilisi', country: 'Georgia', continent: 'Asia', flag: '🇬🇪', lat: 41.72, lon: 44.78, numbeoQuery: 'Tbilisi', healthcareTier: 'average', nightlifeHub: true, visaNote: '1-year visa-free for many passports; 1% small-business tax paths.', tags: ['Low tax', 'Budget'] },
  { name: 'Batumi', country: 'Georgia', continent: 'Asia', flag: '🇬🇪', lat: 41.62, lon: 41.64, numbeoQuery: 'Batumi', healthcareTier: 'average', nightlifeHub: false, visaNote: 'Same as Georgia; coastal resort city.', tags: ['Low tax', 'Coastal'] },
  { name: 'Asunción', country: 'Paraguay', continent: 'Americas', flag: '🇵🇾', lat: -25.26, lon: -57.58, numbeoQuery: 'Asuncion', healthcareTier: 'average', nightlifeHub: false, visaNote: 'Temporary residence with low tax on foreign income.', tags: ['Low tax', 'Budget'] },
  { name: 'Bangkok', country: 'Thailand', continent: 'Asia', flag: '🇹🇭', lat: 13.76, lon: 100.5, numbeoQuery: 'Bangkok', healthcareTier: 'excellent', nightlifeHub: true, visaNote: 'DTV / long-stay options for remote workers (2024+).', tags: ['Healthcare', 'Nightlife', 'Warm'] },
  { name: 'Chiang Mai', country: 'Thailand', continent: 'Asia', flag: '🇹🇭', lat: 18.79, lon: 98.98, numbeoQuery: 'Chiang Mai', healthcareTier: 'good', nightlifeHub: false, visaNote: 'Popular nomad base; strong private hospitals nearby.', tags: ['Budget', 'Warm', 'Nomad'] },
  { name: 'Lisbon', country: 'Portugal', continent: 'Europe', flag: '🇵🇹', lat: 38.72, lon: -9.14, numbeoQuery: 'Lisbon', healthcareTier: 'good', nightlifeHub: true, visaNote: 'D8 digital nomad visa; standard Portuguese income tax applies.', tags: ['Europe', 'Coastal'] },
  { name: 'Porto', country: 'Portugal', continent: 'Europe', flag: '🇵🇹', lat: 41.16, lon: -8.63, numbeoQuery: 'Porto', healthcareTier: 'good', nightlifeHub: false, visaNote: 'D8 visa; lower costs than Lisbon.', tags: ['Europe', 'Budget'] },
  { name: 'Valencia', country: 'Spain', continent: 'Europe', flag: '🇪🇸', lat: 39.47, lon: -0.38, numbeoQuery: 'Valencia', healthcareTier: 'good', nightlifeHub: false, visaNote: 'Non-lucrative or digital nomad visa routes.', tags: ['Europe', 'Coastal'] },
  { name: 'Barcelona', country: 'Spain', continent: 'Europe', flag: '🇪🇸', lat: 41.39, lon: 2.17, numbeoQuery: 'Barcelona', healthcareTier: 'excellent', nightlifeHub: true, visaNote: 'EU residency via visa programs; Beckham Law may apply.', tags: ['Nightlife', 'Europe'] },
  { name: 'Málaga', country: 'Spain', continent: 'Europe', flag: '🇪🇸', lat: 36.72, lon: -4.42, numbeoQuery: 'Malaga', healthcareTier: 'good', nightlifeHub: false, visaNote: 'Popular retiree & remote hub on Costa del Sol.', tags: ['Warm', 'Coastal'] },
  { name: 'Berlin', country: 'Germany', continent: 'Europe', flag: '🇩🇪', lat: 52.52, lon: 13.41, numbeoQuery: 'Berlin', healthcareTier: 'excellent', nightlifeHub: true, visaNote: 'Freelance visa possible; high income tax.', tags: ['Nightlife', 'Europe'] },
  { name: 'Munich', country: 'Germany', continent: 'Europe', flag: '🇩🇪', lat: 48.14, lon: 11.58, numbeoQuery: 'Munich', healthcareTier: 'excellent', nightlifeHub: false, visaNote: 'Strong economy; expensive housing.', tags: ['Healthcare', 'Europe'] },
  { name: 'Vienna', country: 'Austria', continent: 'Europe', flag: '🇦🇹', lat: 48.21, lon: 16.37, numbeoQuery: 'Vienna', healthcareTier: 'excellent', nightlifeHub: false, visaNote: 'Red-White-Red card for skilled workers.', tags: ['Healthcare', 'Safe'] },
  { name: 'Budapest', country: 'Hungary', continent: 'Europe', flag: '🇭🇺', lat: 47.5, lon: 19.04, numbeoQuery: 'Budapest', healthcareTier: 'good', nightlifeHub: true, visaNote: 'White Card for digital nomads.', tags: ['Budget', 'Nightlife'] },
  { name: 'Prague', country: 'Czech Republic', continent: 'Europe', flag: '🇨🇿', lat: 50.08, lon: 14.44, numbeoQuery: 'Prague', healthcareTier: 'good', nightlifeHub: true, visaNote: 'Freelance živnost visa popular with nomads.', tags: ['Nightlife', 'Europe'] },
  { name: 'Warsaw', country: 'Poland', continent: 'Europe', flag: '🇵🇱', lat: 52.23, lon: 21.01, numbeoQuery: 'Warsaw', healthcareTier: 'good', nightlifeHub: false, visaNote: 'Growing tech hub; moderate taxes.', tags: ['Europe', 'Budget'] },
  { name: 'Bucharest', country: 'Romania', continent: 'Europe', flag: '🇷🇴', lat: 44.43, lon: 26.1, numbeoQuery: 'Bucharest', healthcareTier: 'average', nightlifeHub: false, visaNote: '10% flat income tax for many earners.', tags: ['Low tax', 'Europe'] },
  { name: 'Sofia', country: 'Bulgaria', continent: 'Europe', flag: '🇧🇬', lat: 42.7, lon: 23.32, numbeoQuery: 'Sofia', healthcareTier: 'average', nightlifeHub: false, visaNote: '10% flat tax; low cost EU capital.', tags: ['Low tax', 'Budget'] },
  { name: 'Athens', country: 'Greece', continent: 'Europe', flag: '🇬🇷', lat: 37.98, lon: 23.73, numbeoQuery: 'Athens', healthcareTier: 'good', nightlifeHub: false, visaNote: '7% foreign pension regime in some cases.', tags: ['Warm', 'History'] },
  { name: 'Limassol', country: 'Cyprus', continent: 'Europe', flag: '🇨🇾', lat: 34.68, lon: 33.04, numbeoQuery: 'Limassol', healthcareTier: 'good', nightlifeHub: false, visaNote: 'Non-dom tax incentives for new residents.', tags: ['Warm', 'Coastal'] },
  { name: 'Mexico City', country: 'Mexico', continent: 'Americas', flag: '🇲🇽', lat: 19.43, lon: -99.13, numbeoQuery: 'Mexico City', healthcareTier: 'good', nightlifeHub: true, visaNote: 'Temporary resident visa; territorial aspects for foreign income.', tags: ['Nightlife', 'Americas'] },
  { name: 'Playa del Carmen', country: 'Mexico', continent: 'Americas', flag: '🇲🇽', lat: 20.63, lon: -87.07, numbeoQuery: 'Playa del Carmen', healthcareTier: 'average', nightlifeHub: true, visaNote: 'Temporary resident visa; Caribbean lifestyle.', tags: ['Warm', 'Beach'] },
  { name: 'Mérida', country: 'Mexico', continent: 'Americas', flag: '🇲🇽', lat: 20.97, lon: -89.59, numbeoQuery: 'Merida', healthcareTier: 'good', nightlifeHub: false, visaNote: 'Safe Yucatán city; growing retiree hub.', tags: ['Warm', 'Safe'] },
  { name: 'Medellín', country: 'Colombia', continent: 'Americas', flag: '🇨🇴', lat: 6.25, lon: -75.56, numbeoQuery: 'Medellin', healthcareTier: 'good', nightlifeHub: true, visaNote: 'Digital nomad visa (V visa) available.', tags: ['Spring climate', 'Nomad'] },
  { name: 'Cartagena', country: 'Colombia', continent: 'Americas', flag: '🇨🇴', lat: 10.39, lon: -75.48, numbeoQuery: 'Cartagena', healthcareTier: 'average', nightlifeHub: false, visaNote: 'Tourist-friendly; hot coastal climate.', tags: ['Warm', 'Beach'] },
  { name: 'Buenos Aires', country: 'Argentina', continent: 'Americas', flag: '🇦🇷', lat: -34.6, lon: -58.38, numbeoQuery: 'Buenos Aires', healthcareTier: 'good', nightlifeHub: true, visaNote: 'Straightforward residency for remote workers.', tags: ['Nightlife', 'Culture'] },
  { name: 'Santiago', country: 'Chile', continent: 'Americas', flag: '🇨🇱', lat: -33.45, lon: -70.67, numbeoQuery: 'Santiago', healthcareTier: 'good', nightlifeHub: false, visaNote: 'Rentista / remote worker pathways.', tags: ['Americas', 'Mountains'] },
  { name: 'San José', country: 'Costa Rica', continent: 'Americas', flag: '🇨🇷', lat: 9.93, lon: -84.08, numbeoQuery: 'San Jose', healthcareTier: 'good', nightlifeHub: false, visaNote: 'Pensionado / rentista visas; foreign income often untaxed.', tags: ['Nature', 'Stable'] },
  { name: 'Tokyo', country: 'Japan', continent: 'Asia', flag: '🇯🇵', lat: 35.68, lon: 139.69, numbeoQuery: 'Tokyo', healthcareTier: 'excellent', nightlifeHub: true, visaNote: 'Highly skilled visa; expensive housing.', tags: ['Healthcare', 'Nightlife'] },
  { name: 'Seoul', country: 'South Korea', continent: 'Asia', flag: '🇰🇷', lat: 37.57, lon: 126.98, numbeoQuery: 'Seoul', healthcareTier: 'excellent', nightlifeHub: true, visaNote: 'Digital nomad visa pilot programs.', tags: ['Healthcare', 'Nightlife'] },
  { name: 'Singapore', country: 'Singapore', continent: 'Asia', flag: '🇸🇬', lat: 1.35, lon: 103.82, numbeoQuery: 'Singapore', healthcareTier: 'excellent', nightlifeHub: false, visaNote: 'EP / ONE Pass for high earners; no territorial tax relief.', tags: ['Safe', 'Business'] },
  { name: 'Kuala Lumpur', country: 'Malaysia', continent: 'Asia', flag: '🇲🇾', lat: 3.14, lon: 101.69, numbeoQuery: 'Kuala Lumpur', healthcareTier: 'excellent', nightlifeHub: false, visaNote: 'DE Rantau nomad pass; MM2H for longer stays.', tags: ['Budget', 'Food'] },
  { name: 'Ho Chi Minh City', country: 'Vietnam', continent: 'Asia', flag: '🇻🇳', lat: 10.82, lon: 106.63, numbeoQuery: 'Ho Chi Minh City', healthcareTier: 'average', nightlifeHub: true, visaNote: 'Business visa / DN routes; low costs.', tags: ['Budget', 'Warm'] },
  { name: 'Da Nang', country: 'Vietnam', continent: 'Asia', flag: '🇻🇳', lat: 16.05, lon: 108.22, numbeoQuery: 'Da Nang', healthcareTier: 'average', nightlifeHub: false, visaNote: 'Beach city popular with remote workers.', tags: ['Warm', 'Beach'] },
  { name: 'Bali (Denpasar)', country: 'Indonesia', continent: 'Asia', flag: '🇮🇩', lat: -8.67, lon: 115.22, numbeoQuery: 'Bali', healthcareTier: 'average', nightlifeHub: true, visaNote: 'Second home / B211A routes; tax residency rules apply.', tags: ['Warm', 'Nomad'] },
  { name: 'Taipei', country: 'Taiwan', continent: 'Asia', flag: '🇹🇼', lat: 25.03, lon: 121.57, numbeoQuery: 'Taipei', healthcareTier: 'excellent', nightlifeHub: false, visaNote: 'Gold Card for skilled professionals.', tags: ['Healthcare', 'Food'] },
  { name: 'Zurich', country: 'Switzerland', continent: 'Europe', flag: '🇨🇭', lat: 47.37, lon: 8.54, numbeoQuery: 'Zurich', healthcareTier: 'excellent', nightlifeHub: false, visaNote: 'High income thresholds for permits.', tags: ['Safe', 'Healthcare'] },
  { name: 'London', country: 'United Kingdom', continent: 'Europe', flag: '🇬🇧', lat: 51.51, lon: -0.13, numbeoQuery: 'London', healthcareTier: 'excellent', nightlifeHub: true, visaNote: 'Skilled worker / global talent routes.', tags: ['Nightlife', 'Finance'] },
  { name: 'Amsterdam', country: 'Netherlands', continent: 'Europe', flag: '🇳🇱', lat: 52.37, lon: 4.9, numbeoQuery: 'Amsterdam', healthcareTier: 'good', nightlifeHub: true, visaNote: 'Dutch American Friendship treaty for US citizens.', tags: ['Nightlife', 'Europe'] },
  { name: 'Paris', country: 'France', continent: 'Europe', flag: '🇫🇷', lat: 48.86, lon: 2.35, numbeoQuery: 'Paris', healthcareTier: 'excellent', nightlifeHub: true, visaNote: 'Talent passport / visitor visa options.', tags: ['Culture', 'Europe'] },
  { name: 'Copenhagen', country: 'Denmark', continent: 'Europe', flag: '🇩🇰', lat: 55.68, lon: 12.57, numbeoQuery: 'Copenhagen', healthcareTier: 'excellent', nightlifeHub: false, visaNote: 'Pay-limit scheme for employment.', tags: ['Safe', 'Design'] },
  { name: 'Miami', country: 'United States', continent: 'Americas', flag: '🇺🇸', lat: 25.76, lon: -80.19, numbeoQuery: 'Miami', healthcareTier: 'good', nightlifeHub: true, visaNote: 'US visa required; FL has no state income tax.', tags: ['Warm', 'Nightlife'] },
  { name: 'Austin', country: 'United States', continent: 'Americas', flag: '🇺🇸', lat: 30.27, lon: -97.74, numbeoQuery: 'Austin', healthcareTier: 'good', nightlifeHub: true, visaNote: 'Tech hub; US federal + state tax.', tags: ['Tech', 'Americas'] },
  { name: 'Toronto', country: 'Canada', continent: 'Americas', flag: '🇨🇦', lat: 43.65, lon: -79.38, numbeoQuery: 'Toronto', healthcareTier: 'excellent', nightlifeHub: false, visaNote: 'Express Entry / work permits.', tags: ['Healthcare', 'Multicultural'] },
  { name: 'Montreal', country: 'Canada', continent: 'Americas', flag: '🇨🇦', lat: 45.5, lon: -73.57, numbeoQuery: 'Montreal', healthcareTier: 'excellent', nightlifeHub: true, visaNote: 'French-English bilingual hub.', tags: ['Culture', 'Americas'] },
  { name: 'Sydney', country: 'Australia', continent: 'Other', flag: '🇦🇺', lat: -33.87, lon: 151.21, numbeoQuery: 'Sydney', healthcareTier: 'excellent', nightlifeHub: true, visaNote: 'Skilled migration pathways.', tags: ['Coastal', 'Safe'] },
  { name: 'Melbourne', country: 'Australia', continent: 'Other', flag: '🇦🇺', lat: -37.81, lon: 144.96, numbeoQuery: 'Melbourne', healthcareTier: 'excellent', nightlifeHub: true, visaNote: 'Consistently top livability rankings.', tags: ['Culture', 'Coffee'] },
  { name: 'Cape Town', country: 'South Africa', continent: 'Other', flag: '🇿🇦', lat: -33.92, lon: 18.42, numbeoQuery: 'Cape Town', healthcareTier: 'good', nightlifeHub: false, visaNote: 'Remote work visa available; safety varies by area.', tags: ['Scenic', 'Wine'] },
  { name: 'Marrakech', country: 'Morocco', continent: 'Other', flag: '🇲🇦', lat: 31.63, lon: -8.0, numbeoQuery: 'Marrakech', healthcareTier: 'average', nightlifeHub: false, visaNote: 'Long-stay visas for remote workers.', tags: ['Culture', 'Warm'] },
]
