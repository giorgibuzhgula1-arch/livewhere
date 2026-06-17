/**
 * Visa reference data for LiveWhere's Visa Analysis.
 *
 * Figures are practical 2026 estimates for remote workers / retirees and
 * are NOT legal advice — always confirm with official immigration sources.
 */

export type VisaDifficulty = 'Easy' | 'Moderate' | 'Hard'
export type VisaType = 'Digital Nomad Visa' | 'Tourist Visa' | 'Residency'

export interface VisaOption {
  name: string
  type: VisaType
  difficulty: VisaDifficulty
  /** Human-readable processing time, e.g. "2–4 months". */
  processingTime: string
  /** Human-readable cost, e.g. "$180". */
  cost: string
  /** Minimum monthly income requirement in USD, or null if none. */
  minIncomeMonthly: number | null
  /** Human-readable duration / validity, e.g. "1 year, renewable". */
  duration: string
  requirements: string[]
}

export interface CountryVisaInfo {
  country: string
  /** 0–100 — higher means easier, more accessible visa pathways for remote workers. */
  visaScore: number
  summary: string
  options: VisaOption[]
}

const VISA_DATA: CountryVisaInfo[] = [
  {
    country: 'Portugal',
    visaScore: 78,
    summary:
      'A well-established D8 digital nomad visa with a clear residency path, though paperwork takes patience.',
    options: [
      {
        name: 'D8 Digital Nomad Visa',
        type: 'Digital Nomad Visa',
        difficulty: 'Moderate',
        processingTime: '2–4 months',
        cost: '$90–$180',
        minIncomeMonthly: 3500,
        duration: '1 year, renewable up to 5',
        requirements: [
          'Proof of remote income (~4× Portuguese minimum wage)',
          'Last 3 months of bank statements',
          'Valid health insurance',
          'Clean criminal record (apostilled)',
          'Proof of accommodation in Portugal',
        ],
      },
      {
        name: 'D7 Passive Income Visa',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–5 months',
        cost: '$90–$180',
        minIncomeMonthly: 1000,
        duration: '2 years, renewable',
        requirements: [
          'Stable passive or remote income',
          'Proof of savings',
          'Health insurance',
          'Portuguese tax number (NIF) and bank account',
        ],
      },
      {
        name: 'Schengen Tourist Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'Visa-free for many',
        cost: '$0–$90',
        minIncomeMonthly: null,
        duration: '90 days in any 180',
        requirements: ['Valid passport', 'Onward travel', 'Proof of funds for the stay'],
      },
    ],
  },
  {
    country: 'Georgia',
    visaScore: 95,
    summary:
      'One of the easiest places on earth for remote workers — most nationalities stay visa-free for a full year.',
    options: [
      {
        name: 'Visa-Free Stay',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'Instant at border',
        cost: '$0',
        minIncomeMonthly: null,
        duration: '365 days',
        requirements: ['Valid passport from an eligible country (US, EU, UK + 90 more)'],
      },
      {
        name: 'Remotely from Georgia',
        type: 'Digital Nomad Visa',
        difficulty: 'Easy',
        processingTime: '~10 days',
        cost: '$0',
        minIncomeMonthly: 2000,
        duration: '1 year',
        requirements: [
          'Proof of remote employment or freelance income (~$2,000/mo)',
          'Health insurance for 6 months',
          'Self-declared health and travel agreement',
        ],
      },
      {
        name: 'Short-Term Residence Permit',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '1–2 months',
        cost: '$90–$300',
        minIncomeMonthly: 1600,
        duration: '6–12 months, renewable',
        requirements: ['Proof of income or local business', 'Local address', 'Bank statements'],
      },
    ],
  },
  {
    country: 'Thailand',
    visaScore: 62,
    summary:
      'Great lifestyle and a powerful 10-year LTR visa, but the long-stay options have high financial bars.',
    options: [
      {
        name: 'LTR (Long-Term Resident) Visa',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '1–3 months',
        cost: '~$1,400 (50,000 THB)',
        minIncomeMonthly: 6700,
        duration: 'Up to 10 years',
        requirements: [
          'Income ~$80,000/yr OR significant savings/assets',
          'Health insurance or $100k deposit',
          'Employment with a stable company',
        ],
      },
      {
        name: 'Thailand LTR Visa (Wealthy Pensioner)',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '1–2 months',
        cost: '$200',
        minIncomeMonthly: null,
        duration: '10 years, renewable',
        requirements: [
          'Age 50+',
          '$80,000 in assets OR $40,000 annual income OR $40,000 deposit in Thai bank',
          'Health insurance with $50,000 coverage',
        ],
      },
      {
        name: 'Destination Thailand Visa (DTV)',
        type: 'Digital Nomad Visa',
        difficulty: 'Moderate',
        processingTime: '2–4 weeks',
        cost: '~$280 (10,000 THB)',
        minIncomeMonthly: 2000,
        duration: '5 years (180-day stays)',
        requirements: [
          'Proof of remote work or freelance activity',
          '~$13,500 in savings (500,000 THB)',
          'Valid passport and supporting documents',
        ],
      },
      {
        name: 'Tourist Visa / Exemption',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'Instant–2 weeks',
        cost: '$0–$40',
        minIncomeMonthly: null,
        duration: '30–60 days, extendable',
        requirements: ['Valid passport', 'Onward ticket', 'Proof of funds'],
      },
    ],
  },
  {
    country: 'Mexico',
    visaScore: 80,
    summary:
      'The go-to for US remote workers — same time zones and a well-trodden temporary residency path.',
    options: [
      {
        name: 'Temporary Resident Visa',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–6 weeks',
        cost: '$150–$450',
        minIncomeMonthly: 2600,
        duration: '1 year, renewable to 4',
        requirements: [
          'Monthly income ~$2,600 (last 6 months) OR ~$43k savings',
          'Apply at a Mexican consulate abroad',
          'Valid passport and photos',
        ],
      },
      {
        name: 'Tourist Visa (FMM)',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'On arrival',
        cost: '$0–$40',
        minIncomeMonthly: null,
        duration: 'Up to 180 days',
        requirements: ['Valid passport', 'Completed entry form'],
      },
    ],
  },
  {
    country: 'Spain',
    visaScore: 74,
    summary:
      'A 2023 digital nomad visa with a relatively low income bar and an attractive flat-tax option.',
    options: [
      {
        name: 'Digital Nomad Visa',
        type: 'Digital Nomad Visa',
        difficulty: 'Moderate',
        processingTime: '3–8 weeks',
        cost: '$80–$200',
        minIncomeMonthly: 2800,
        duration: '1 year, renewable up to 5',
        requirements: [
          'Remote work for non-Spanish companies',
          'Income ~200% of Spanish minimum wage',
          'Proof of 3+ years experience or relevant degree',
          'Health insurance and clean criminal record',
        ],
      },
      {
        name: 'Non-Lucrative Visa',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '1–3 months',
        cost: '$80–$160',
        minIncomeMonthly: 2650,
        duration: '1 year, renewable',
        requirements: ['Proof of passive income/savings', 'Private health insurance', 'No work in Spain'],
      },
      {
        name: 'Schengen Tourist Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'Visa-free for many',
        cost: '$0–$90',
        minIncomeMonthly: null,
        duration: '90 days in any 180',
        requirements: ['Valid passport', 'Proof of funds', 'Onward travel'],
      },
    ],
  },
  {
    country: 'Estonia',
    visaScore: 72,
    summary:
      'The original digital nomad visa, backed by the world-leading e-Residency program for online businesses.',
    options: [
      {
        name: 'Digital Nomad Visa',
        type: 'Digital Nomad Visa',
        difficulty: 'Moderate',
        processingTime: '15–30 days',
        cost: '$100–$120',
        minIncomeMonthly: 4500,
        duration: 'Up to 1 year',
        requirements: [
          'Remote work for a foreign employer or own company',
          'Income ~$4,500/mo (last 6 months)',
          'Valid passport and health insurance',
        ],
      },
      {
        name: 'e-Residency + Residence Permit',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '1–3 months',
        cost: '$120–$400',
        minIncomeMonthly: 2000,
        duration: '1 year, renewable',
        requirements: ['Registered Estonian company', 'Business activity and income', 'Local contact/address'],
      },
      {
        name: 'Schengen Tourist Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'Visa-free for many',
        cost: '$0–$90',
        minIncomeMonthly: null,
        duration: '90 days in any 180',
        requirements: ['Valid passport', 'Proof of funds'],
      },
    ],
  },
  {
    country: 'United Arab Emirates',
    visaScore: 70,
    summary:
      'Zero income tax and a 1-year remote work visa — compelling for high earners who can meet the income bar.',
    options: [
      {
        name: 'Virtual Work (Remote Work) Visa',
        type: 'Digital Nomad Visa',
        difficulty: 'Moderate',
        processingTime: '2–4 weeks',
        cost: '~$287 + fees',
        minIncomeMonthly: 5000,
        duration: '1 year, renewable',
        requirements: [
          'Proof of employment or company ownership',
          'Income of at least $5,000/mo',
          'Last month payslip + 3 months bank statements',
          'Valid passport and health insurance',
        ],
      },
      {
        name: 'Retirement Visa',
        type: 'Residency',
        difficulty: 'Easy',
        processingTime: '1–2 months',
        cost: '$550',
        minIncomeMonthly: null,
        duration: '5 years, renewable',
        requirements: [
          'Age 55+',
          'Property worth $545,000 OR savings $272,000 OR monthly income $5,450',
          'Health insurance',
        ],
      },
      {
        name: 'Tourist Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'On arrival / e-visa',
        cost: '$0–$110',
        minIncomeMonthly: null,
        duration: '30–90 days',
        requirements: ['Valid passport', 'Onward ticket', 'Proof of funds'],
      },
    ],
  },
  {
    country: 'Colombia',
    visaScore: 82,
    summary:
      'A low income threshold and US-friendly time zone make Colombia one of the most accessible nomad visas.',
    options: [
      {
        name: 'V Digital Nomad Visa',
        type: 'Digital Nomad Visa',
        difficulty: 'Easy',
        processingTime: '2–4 weeks',
        cost: '$170–$230',
        minIncomeMonthly: 685,
        duration: 'Up to 2 years',
        requirements: [
          'Proof of remote work or freelance income (~$685/mo)',
          'Health insurance covering Colombia',
          'Motivation letter and valid passport',
        ],
      },
      {
        name: 'Migrant (M) Visa',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '1–2 months',
        cost: '$230–$400',
        minIncomeMonthly: 1000,
        duration: 'Up to 3 years',
        requirements: ['Qualifying income, investment, or ties', 'Health insurance', 'Supporting documents'],
      },
      {
        name: 'Pensionado/Rentista Visa',
        type: 'Residency',
        difficulty: 'Easy',
        processingTime: '1–2 months',
        cost: '$270',
        minIncomeMonthly: 750,
        duration: '3 years, renewable',
        requirements: [
          'Proof of pension or passive income at 3× Colombian minimum wage (~$750/mo)',
          'Health insurance',
        ],
      },
      {
        name: 'Tourist Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'On arrival',
        cost: '$0',
        minIncomeMonthly: null,
        duration: '90 days, extendable to 180',
        requirements: ['Valid passport', 'Onward ticket', 'Proof of funds'],
      },
    ],
  },
  {
    country: 'Costa Rica',
    visaScore: 84,
    summary:
      'A popular pensionado path with a low monthly income bar and straightforward permanent residency for retirees.',
    options: [
      {
        name: 'Pensionado Visa',
        type: 'Residency',
        difficulty: 'Easy',
        processingTime: '3–6 months',
        cost: '$200–$300',
        minIncomeMonthly: 1000,
        duration: 'Permanent, renewable',
        requirements: [
          'Proof of pension income of at least $1,000/mo',
          'Health insurance',
          'Clean criminal record',
          'Local bank account',
        ],
      },
      {
        name: 'Tourist Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'On arrival',
        cost: '$0',
        minIncomeMonthly: null,
        duration: '90 days, extendable',
        requirements: ['Valid passport', 'Onward ticket', 'Proof of funds'],
      },
    ],
  },
  {
    country: 'Cyprus',
    visaScore: 72,
    summary:
      'Category F residency suits retirees with overseas income who want EU Mediterranean living without local employment.',
    options: [
      {
        name: 'Category F Residency',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–4 months',
        cost: '$500',
        minIncomeMonthly: 1300,
        duration: '1 year, renewable',
        requirements: [
          'Proof of overseas income',
          'Health insurance',
          'Clean criminal record',
          'Local bank account',
        ],
      },
      {
        name: 'Schengen Tourist Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'Visa-free for many',
        cost: '$0–$90',
        minIncomeMonthly: null,
        duration: '90 days in any 180',
        requirements: ['Valid passport', 'Proof of funds', 'Onward travel'],
      },
    ],
  },
  {
    country: 'France',
    visaScore: 66,
    summary:
      'The long-stay visiteur visa offers a formal residency route for retirees with sufficient savings and no intent to work locally.',
    options: [
      {
        name: 'Long Stay Visa (Visiteur)',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '2–4 months',
        cost: '$100',
        minIncomeMonthly: 1800,
        duration: '1 year, renewable',
        requirements: [
          'Proof of sufficient resources',
          'Health insurance',
          'No work in France allowed',
        ],
      },
      {
        name: 'Schengen Tourist Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'Visa-free for many',
        cost: '$0–$90',
        minIncomeMonthly: null,
        duration: '90 days in any 180',
        requirements: ['Valid passport', 'Proof of funds', 'Onward travel'],
      },
    ],
  },
  {
    country: 'Greece',
    visaScore: 74,
    summary:
      'Greece pairs a digital nomad visa with a financial-independence residency path for retirees living on overseas income.',
    options: [
      {
        name: 'Digital Nomad Visa',
        type: 'Digital Nomad Visa',
        difficulty: 'Moderate',
        processingTime: '2–4 weeks',
        cost: '$75–$150',
        minIncomeMonthly: 3500,
        duration: '1 year, renewable up to 2',
        requirements: [
          'Proof of remote employment or freelance income',
          'Valid passport and health insurance',
          'Clean criminal record',
        ],
      },
      {
        name: 'Financial Independence Visa',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–3 months',
        cost: '$75',
        minIncomeMonthly: 2000,
        duration: '2 years, renewable',
        requirements: [
          'Proof of income from abroad',
          'Health insurance',
          'Clean criminal record',
        ],
      },
      {
        name: 'Schengen Tourist Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'Visa-free for many',
        cost: '$0–$90',
        minIncomeMonthly: null,
        duration: '90 days in any 180',
        requirements: ['Valid passport', 'Proof of funds', 'Onward travel'],
      },
    ],
  },
  {
    country: 'Italy',
    visaScore: 68,
    summary:
      'Elective residency suits retirees with stable passive income who want to live in Italy without working locally.',
    options: [
      {
        name: 'Elective Residency Visa',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '2–4 months',
        cost: '$50–$100',
        minIncomeMonthly: 2200,
        duration: '1 year, renewable',
        requirements: [
          'Proof of sufficient passive income',
          'Private health insurance',
          'Suitable accommodation',
          'No work allowed',
        ],
      },
      {
        name: 'Schengen Tourist Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'Visa-free for many',
        cost: '$0–$90',
        minIncomeMonthly: null,
        duration: '90 days in any 180',
        requirements: ['Valid passport', 'Proof of funds', 'Onward travel'],
      },
    ],
  },
  {
    country: 'Malaysia',
    visaScore: 62,
    summary:
      'MM2H is a long-stay programme for retirees and financially independent applicants with significant deposit requirements.',
    options: [
      {
        name: 'Malaysia My Second Home (MM2H)',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '3–6 months',
        cost: '$1,500',
        minIncomeMonthly: 2400,
        duration: '5 years, renewable',
        requirements: [
          '$150,000 fixed deposit in Malaysian bank',
          'Proof of liquid assets of $350,000',
          'Health insurance',
          'Age 35+',
        ],
      },
      {
        name: 'Tourist Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'On arrival / e-visa',
        cost: '$0–$30',
        minIncomeMonthly: null,
        duration: '30–90 days',
        requirements: ['Valid passport', 'Onward ticket', 'Proof of funds'],
      },
    ],
  },
  {
    country: 'Malta',
    visaScore: 70,
    summary:
      'Malta’s retirement programme offers indefinite residency for applicants who meet property and income thresholds.',
    options: [
      {
        name: 'Retirement Programme',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '3–6 months',
        cost: '$6,000 one-time',
        minIncomeMonthly: 1200,
        duration: 'Indefinite, renewable',
        requirements: [
          'EU/non-EU programme options',
          'Property purchase or rent minimum',
          'Health insurance',
        ],
      },
      {
        name: 'Schengen Tourist Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'Visa-free for many',
        cost: '$0–$90',
        minIncomeMonthly: null,
        duration: '90 days in any 180',
        requirements: ['Valid passport', 'Proof of funds', 'Onward travel'],
      },
    ],
  },
  {
    country: 'Panama',
    visaScore: 86,
    summary:
      'The pensionado visa is one of the most accessible retirement residency paths in the Americas with a low pension floor.',
    options: [
      {
        name: 'Pensionado Visa',
        type: 'Residency',
        difficulty: 'Easy',
        processingTime: '2–3 months',
        cost: '$300–$500',
        minIncomeMonthly: 1000,
        duration: 'Permanent',
        requirements: [
          'Proof of lifetime pension or annuity of at least $1,000/mo',
          'Health certificate',
          'Clean criminal record',
        ],
      },
      {
        name: 'Tourist Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'On arrival',
        cost: '$0',
        minIncomeMonthly: null,
        duration: '90–180 days',
        requirements: ['Valid passport', 'Onward ticket', 'Proof of funds'],
      },
    ],
  },
  {
    country: 'Uruguay',
    visaScore: 76,
    summary:
      'The rentista visa offers a renewable residency path for retirees and passive-income holders with a moderate income bar.',
    options: [
      {
        name: 'Rentista Visa',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '3–6 months',
        cost: '$200',
        minIncomeMonthly: 1500,
        duration: '2 years, renewable',
        requirements: [
          'Proof of regular passive income',
          'Health insurance',
          'Clean criminal record',
          'Local bank account',
        ],
      },
      {
        name: 'Tourist Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'On arrival',
        cost: '$0',
        minIncomeMonthly: null,
        duration: '90 days, extendable',
        requirements: ['Valid passport', 'Onward ticket', 'Proof of funds'],
      },
    ],
  },
]

const COUNTRY_ALIASES: Record<string, string> = {
  uae: 'United Arab Emirates',
  'u.a.e.': 'United Arab Emirates',
  emirates: 'United Arab Emirates',
  'united arab emirates': 'United Arab Emirates',
}

function normalize(country: string): string {
  const key = country.trim().toLowerCase()
  return COUNTRY_ALIASES[key] ?? country.trim()
}

export function getVisaInfoForCountry(country: string | undefined | null): CountryVisaInfo | null {
  if (!country) return null
  const target = normalize(country).toLowerCase()
  return VISA_DATA.find((info) => info.country.toLowerCase() === target) ?? null
}

export function visaScoreForCountry(country: string | undefined | null): number | null {
  return getVisaInfoForCountry(country)?.visaScore ?? null
}

export function difficultyColor(difficulty: VisaDifficulty): string {
  switch (difficulty) {
    case 'Easy':
      return '#c8f05a'
    case 'Moderate':
      return '#f0c85a'
    case 'Hard':
      return '#f05a8c'
  }
}

export function visaScoreColor(score: number): string {
  if (score >= 80) return '#c8f05a'
  if (score >= 65) return '#f0c85a'
  return '#f05a8c'
}

const DIFFICULTY_RANK: Record<VisaDifficulty, number> = { Easy: 0, Moderate: 1, Hard: 2 }
const TYPE_PRIORITY: Record<VisaType, number> = {
  Residency: 0,
  'Digital Nomad Visa': 1,
  'Tourist Visa': 2,
}

export interface VisaRecommendation {
  option: VisaOption
  qualifies: boolean
  reason: string
}

/**
 * Rule-based recommendation: pick the best long-stay option the user
 * qualifies for given their monthly budget (vs minIncomeMonthly threshold),
 * falling back to the easiest path.
 */
export function recommendVisa(
  info: CountryVisaInfo,
  monthlyBudget?: number,
  lifestyle?: string[]
): VisaRecommendation | null {
  if (!info.options.length) return null

  const longStay = info.options.filter((o) => o.type !== 'Tourist Visa')
  const pool = longStay.length ? longStay : info.options

  const sorted = [...pool].sort((a, b) => {
    const typeDiff = TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type]
    if (typeDiff !== 0) return typeDiff
    return DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty]
  })

  const affordable =
    typeof monthlyBudget === 'number'
      ? sorted.filter((o) => o.minIncomeMonthly == null || monthlyBudget >= o.minIncomeMonthly)
      : []

  const chosen = affordable[0] ?? sorted[0]
  const qualifies =
    typeof monthlyBudget !== 'number' ||
    chosen.minIncomeMonthly == null ||
    monthlyBudget >= chosen.minIncomeMonthly

  const budgetText =
    typeof monthlyBudget === 'number' ? `your ~$${monthlyBudget.toLocaleString()}/mo monthly budget` : 'your profile'

  const lifestyleHint =
    lifestyle && lifestyle.length
      ? ` Your interest in ${lifestyle.slice(0, 2).join(' and ').toLowerCase()} fits ${info.country} well.`
      : ''

  let reason: string
  if (qualifies && chosen.minIncomeMonthly != null) {
    reason = `Based on ${budgetText}, you comfortably meet the ${chosen.name}'s ~$${chosen.minIncomeMonthly.toLocaleString()}/mo requirement. It's a ${chosen.difficulty.toLowerCase()} application valid for ${chosen.duration.toLowerCase()}.${lifestyleHint}`
  } else if (qualifies) {
    reason = `The ${chosen.name} has no fixed income floor and is a ${chosen.difficulty.toLowerCase()} path valid for ${chosen.duration.toLowerCase()} — a strong starting point for ${budgetText}.${lifestyleHint}`
  } else {
    const gap = chosen.minIncomeMonthly!
    reason = `The ${chosen.name} typically expects ~$${gap.toLocaleString()}/mo, which is above ${budgetText}. Consider a tourist-visa stay first, or boost documented income before applying.${lifestyleHint}`
  }

  return { option: chosen, qualifies, reason }
}

export { VISA_DATA }
