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
  {
    country: 'Argentina',
    visaScore: 72,
    summary:
      'Rentista residency suits retirees with stable passive income from pensions, rentals, or investments outside Argentina.',
    options: [
      {
        name: 'Rentista Residency',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–4 months',
        cost: '$200–$400',
        minIncomeMonthly: 1500,
        duration: '1 year, renewable',
        requirements: [
          'Proof of passive income from abroad (pension, dividends, rent)',
          'Apostilled criminal record and birth certificate',
          'Health insurance or proof of coverage',
          'Official source: https://www.cancilleria.gob.ar/en/services/visa/residencia-temporaria',
        ],
      },
      {
        name: 'Tourist Visa / Visa-Free Entry',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'On arrival',
        cost: '$0–$150',
        minIncomeMonthly: null,
        duration: '90 days, extendable',
        requirements: ['Valid passport', 'Return ticket', 'Proof of funds'],
      },
    ],
  },
  {
    country: 'Australia',
    visaScore: 58,
    summary:
      'No dedicated retiree residency for most nationalities — long-stay visitor visas and parent streams are the practical paths.',
    options: [
      {
        name: 'Visitor Visa (Subclass 600) — Longer Stay',
        type: 'Tourist Visa',
        difficulty: 'Moderate',
        processingTime: '1–3 months',
        cost: '$190–$470',
        minIncomeMonthly: null,
        duration: 'Up to 12 months per grant',
        requirements: [
          'Genuine temporary stay with strong ties to home country',
          'Proof of savings and health insurance',
          'Meet health and character requirements',
          'Official source: https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600',
        ],
      },
      {
        name: 'Parent Visa (Contributory)',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: 'Several years',
        cost: '$48,000+ contribution',
        minIncomeMonthly: null,
        duration: 'Permanent (long queue)',
        requirements: [
          'Eligible child who is an Australian citizen or permanent resident',
          'Balance of family test and assurance of support',
          'Health and character checks',
          'Official source: https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/parent-143',
        ],
      },
    ],
  },
  {
    country: 'Austria',
    visaScore: 60,
    summary:
      'Settlement permits for financially independent persons suit retirees with substantial savings and no local employment.',
    options: [
      {
        name: 'Settlement Permit — Gainful Employment Excepted',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '3–6 months',
        cost: '$150–$300',
        minIncomeMonthly: 2200,
        duration: '1 year, renewable',
        requirements: [
          'Proof of stable income, pension, or assets',
          'German language A1 (varies by province)',
          'Comprehensive health insurance',
          'Official source: https://www.migration.gv.at/en/types-of-immigration/permanent-immigration/',
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
    country: 'Bahrain',
    visaScore: 68,
    summary:
      'Golden Residency and retirement-style permits reward retirees who meet property, savings, or pension thresholds.',
    options: [
      {
        name: 'Golden Residency Visa',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '4–8 weeks',
        cost: '$280–$560',
        minIncomeMonthly: 4000,
        duration: '5–10 years, renewable',
        requirements: [
          'Retired 55+ with pension/income OR property/investment thresholds',
          'Health insurance',
          'Clean criminal record',
          'Official source: https://www.evisa.gov.bh/',
        ],
      },
      {
        name: 'Tourist / eVisa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: '1–5 days',
        cost: '$0–$55',
        minIncomeMonthly: null,
        duration: '14–90 days',
        requirements: ['Valid passport', 'Onward ticket', 'Proof of funds'],
      },
    ],
  },
  {
    country: 'Belgium',
    visaScore: 58,
    summary:
      'Belgium offers limited retiree-specific routes — most long-stayers use financially independent or family reunion permits.',
    options: [
      {
        name: 'Type D Long-Stay — Private Reasons',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '2–4 months',
        cost: '$200–$400',
        minIncomeMonthly: 2000,
        duration: '1 year, renewable',
        requirements: [
          'Proof of sufficient means without working in Belgium',
          'Health insurance covering Belgium',
          'Suitable accommodation',
          'Official source: https://www.belgium.be/en/coming_to_belgium/residence_permit',
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
    country: 'Chile',
    visaScore: 70,
    summary:
      'Rentista and jubilado visas are established paths for retirees with overseas pension or passive income.',
    options: [
      {
        name: 'Rentista / Jubilado Visa',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–4 months',
        cost: '$150–$300',
        minIncomeMonthly: 1500,
        duration: '1 year, renewable to permanent',
        requirements: [
          'Proof of pension or passive income from abroad',
          'Apostilled documents and criminal record',
          'Health insurance',
          'Official source: https://www.chile.gob.cl/chile/en/visas-and-permits/',
        ],
      },
      {
        name: 'Tourist Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'On arrival',
        cost: '$0–$50',
        minIncomeMonthly: null,
        duration: '90 days, extendable',
        requirements: ['Valid passport', 'Proof of funds', 'Onward ticket'],
      },
    ],
  },
  {
    country: 'Croatia',
    visaScore: 74,
    summary:
      'A digital nomad visa plus temporary stay options make Croatia accessible for retirees with remote income or EU ties.',
    options: [
      {
        name: 'Digital Nomad Residence',
        type: 'Digital Nomad Visa',
        difficulty: 'Moderate',
        processingTime: '2–4 weeks',
        cost: '$80–$150',
        minIncomeMonthly: 3200,
        duration: 'Up to 1 year (not renewable in-country)',
        requirements: [
          'Remote work for non-Croatian employer',
          'Proof of income and health insurance',
          'Valid passport',
          'Official source: https://mup.gov.hr/aliens-281621/digital-nomad/281624',
        ],
      },
      {
        name: 'Temporary Stay (Financial Means)',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '1–2 months',
        cost: '$80–$200',
        minIncomeMonthly: 1300,
        duration: '1 year, renewable',
        requirements: [
          'Proof of sufficient funds or pension',
          'Health insurance',
          'Local address registration',
          'Official source: https://mup.gov.hr/aliens-281621/temporary-stay/281622',
        ],
      },
    ],
  },
  {
    country: 'Czech Republic',
    visaScore: 66,
    summary:
      'Long-term visas for business or other purposes can suit financially independent retirees with documented income.',
    options: [
      {
        name: 'Long-Term Visa — Other Purposes',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–4 months',
        cost: '$100–$250',
        minIncomeMonthly: 1800,
        duration: 'Up to 1 year, renewable',
        requirements: [
          'Proof of funds (~3× living minimum) and accommodation',
          'Health insurance',
          'Criminal record extract',
          'Official source: https://www.mzv.cz/jnp/en/information_for_aliens/long_term_visa/index.html',
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
    country: 'Denmark',
    visaScore: 52,
    summary:
      'Denmark has strict requirements — independent means permits exist but are difficult for non-EU retirees.',
    options: [
      {
        name: 'Residence Permit — Self-Support',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '3–6 months',
        cost: '$300–$600',
        minIncomeMonthly: 2800,
        duration: '1–2 years, renewable',
        requirements: [
          'Substantial savings or documented passive income',
          'No reliance on Danish public funds',
          'Health insurance',
          'Official source: https://www.nyidanmark.dk/en-GB/You-want-to-apply',
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
    country: 'Dominican Republic',
    visaScore: 76,
    summary:
      'Pensionado and rentista residency are popular retiree routes with relatively low income floors.',
    options: [
      {
        name: 'Pensionado Residency',
        type: 'Residency',
        difficulty: 'Easy',
        processingTime: '2–4 months',
        cost: '$200–$500',
        minIncomeMonthly: 1500,
        duration: '1 year, renewable',
        requirements: [
          'Proof of pension income of at least $1,500/mo',
          'Health certificate and background check',
          'Apostilled documents',
          'Official source: https://www.godominicanrepublic.com/visas-and-legal-requirements/',
        ],
      },
      {
        name: 'Rentista Residency',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–4 months',
        cost: '$200–$500',
        minIncomeMonthly: 2000,
        duration: '1 year, renewable',
        requirements: [
          'Proof of passive income or remote earnings from abroad',
          'Health insurance',
          'Local bank account',
          'Official source: https://www.godominicanrepublic.com/visas-and-legal-requirements/',
        ],
      },
    ],
  },
  {
    country: 'Ecuador',
    visaScore: 80,
    summary:
      'Ecuador’s pensioner visa is one of the most affordable retiree residencies in Latin America.',
    options: [
      {
        name: 'Pensioner (Jubilado) Visa',
        type: 'Residency',
        difficulty: 'Easy',
        processingTime: '2–4 months',
        cost: '$450–$700',
        minIncomeMonthly: 800,
        duration: '2 years, renewable to permanent',
        requirements: [
          'Pension or passive income of at least $800/mo (2026 estimate)',
          'Criminal background check',
          'Health insurance or public enrollment path',
          'Official source: https://www.gob.ec/mremh/tramites/concesion-visa-residencia-temporal-pensionista',
        ],
      },
      {
        name: 'Rentista Visa',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–4 months',
        cost: '$450–$700',
        minIncomeMonthly: 1200,
        duration: '2 years, renewable',
        requirements: [
          'Stable income from investments or remote sources',
          'Proof of funds and health coverage',
          'Official source: https://www.gob.ec/mremh/tramites/concesion-visa-residencia-temporal-rentista',
        ],
      },
    ],
  },
  {
    country: 'Germany',
    visaScore: 55,
    summary:
      'Germany allows residence for financially independent persons, but the bar is high and local work is prohibited.',
    options: [
      {
        name: 'Residence Permit — Gainful Employment Prohibited',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '3–6 months',
        cost: '$100–$300',
        minIncomeMonthly: 2500,
        duration: '1–3 years, renewable',
        requirements: [
          'Proof of pension, savings, or passive income',
          'Health insurance valid in Germany',
          'Suitable housing',
          'Official source: https://www.germany.info/us-en/service/visa/residence-907320',
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
    country: 'Indonesia',
    visaScore: 70,
    summary:
      'Second Home and retirement KITAS options suit affluent retirees willing to meet deposit or income thresholds.',
    options: [
      {
        name: 'Second Home Visa (KITAS)',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–4 weeks',
        cost: '$300–$600',
        minIncomeMonthly: 2000,
        duration: '1–5 years, renewable',
        requirements: [
          'Proof of $130,000+ in savings OR $2,000/mo income (program rules vary)',
          'Valid passport and sponsor/agent',
          'Health insurance',
          'Official source: https://www.imigrasi.go.id/en/second-home-visa/',
        ],
      },
      {
        name: 'Retirement KITAS (Age 55+)',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '1–2 months',
        cost: '$400–$800',
        minIncomeMonthly: 1500,
        duration: '1 year, renewable',
        requirements: [
          'Age 55+ with pension or passive income',
          'Local sponsor and lease agreement',
          'Health insurance',
          'Official source: https://www.imigrasi.go.id/en/',
        ],
      },
    ],
  },
  {
    country: 'Israel',
    visaScore: 48,
    summary:
      'Israel has no classic retiree visa — B/2 visitor stays and aliyah pathways dominate for long-term living.',
    options: [
      {
        name: 'B/2 Visitor Visa (Extended Stay)',
        type: 'Tourist Visa',
        difficulty: 'Moderate',
        processingTime: '2–8 weeks',
        cost: '$50–$200',
        minIncomeMonthly: null,
        duration: 'Up to 90 days per entry; extensions discretionary',
        requirements: [
          'Proof of funds and health insurance',
          'Clear travel purpose',
          'No automatic work rights',
          'Official source: https://www.gov.il/en/departments/guides/visa_information',
        ],
      },
      {
        name: 'A/1 Temporary Resident (Eligible Diaspora)',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '3–12 months',
        cost: '$200–$500',
        minIncomeMonthly: null,
        duration: 'Up to 3 years',
        requirements: [
          'Eligible under Law of Return or special categories',
          'Documentation per Population Authority',
          'Official source: https://www.gov.il/en/departments/population_and_immigration_authority',
        ],
      },
    ],
  },
  {
    country: 'Japan',
    visaScore: 52,
    summary:
      'Japan has no dedicated retiree visa — long-term resident status, family sponsorship, or extended visitor stays are the practical paths for older relocators.',
    options: [
      {
        name: 'Long-Term Resident Visa',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '2–4 months',
        cost: '$30–$80',
        minIncomeMonthly: 2500,
        duration: '1–3 years, renewable',
        requirements: [
          'Granted when no other status applies — strong ties, stable pension or passive income',
          'Certificate of Eligibility from regional immigration office',
          'Japanese guarantor or documented support network often required',
          'Comprehensive health insurance and clean criminal record',
          'Official source: https://www.moj.go.jp/isa/index.html',
        ],
      },
      {
        name: 'Spouse / Family Stay Visa',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '1–3 months',
        cost: '$30–$80',
        minIncomeMonthly: null,
        duration: '1–5 years, renewable',
        requirements: [
          'Spouse of Japanese national/permanent resident OR dependent of eligible resident',
          'Proof of relationship and cohabitation/support',
          'Sponsor’s stable income and tax records in Japan',
          'Certificate of Eligibility from immigration',
          'Official source: https://www.moj.go.jp/isa/index.html',
        ],
      },
      {
        name: 'Temporary Visitor Visa (with extensions)',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'Visa-free for many / 1–2 weeks if visa required',
        cost: '$0–$30',
        minIncomeMonthly: null,
        duration: '90 days; extensions possible in limited cases',
        requirements: [
          'Valid passport and proof of funds for initial stay',
          'Return or onward ticket',
          'Extension requests at immigration — not guaranteed; often need compelling reason',
          'Official source: https://www.moj.go.jp/isa/index.html',
        ],
      },
    ],
  },
  {
    country: 'Latvia',
    visaScore: 64,
    summary:
      'Temporary residence for financially independent persons suits retirees with steady overseas income.',
    options: [
      {
        name: 'Temporary Residence — Financially Independent',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–4 months',
        cost: '$100–$250',
        minIncomeMonthly: 1500,
        duration: '1 year, renewable',
        requirements: [
          'Proof of stable passive income or pension',
          'Health insurance',
          'Criminal record certificate',
          'Official source: https://www.pmlp.gov.lv/en/residence-permit',
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
    country: 'Lithuania',
    visaScore: 68,
    summary:
      'Lithuania offers temporary residence for financially independent applicants and a startup-friendly nomad ecosystem.',
    options: [
      {
        name: 'Temporary Residence — Sufficient Means',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–4 months',
        cost: '$120–$280',
        minIncomeMonthly: 1400,
        duration: '1 year, renewable',
        requirements: [
          'Proof of income or assets meeting minimum living standard',
          'Health insurance',
          'Accommodation in Lithuania',
          'Official source: https://www.migracija.lt/en/',
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
    country: 'Luxembourg',
    visaScore: 56,
    summary:
      'Private reasons residence permits are possible for wealthy retirees but require substantial means.',
    options: [
      {
        name: 'Type D — Private Reasons / Independent Means',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '3–6 months',
        cost: '$200–$500',
        minIncomeMonthly: 3000,
        duration: '1 year, renewable',
        requirements: [
          'Proof of sufficient resources without local employment',
          'Health insurance covering Luxembourg',
          'Housing and integration conditions',
          'Official source: https://guichet.public.lu/en/citoyens/immigration.html',
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
    country: 'Morocco',
    visaScore: 62,
    summary:
      'Morocco allows renewable residence for retirees who can show stable overseas income and local ties.',
    options: [
      {
        name: 'Residence Permit (Retiree / Independent Means)',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–4 months',
        cost: '$100–$300',
        minIncomeMonthly: 1200,
        duration: '1 year, renewable',
        requirements: [
          'Proof of pension or foreign income',
          'Medical certificate and police clearance',
          'Rental contract or property',
          'Official source: https://www.consulat.ma/en/visa-and-travel',
        ],
      },
      {
        name: 'Tourist Visa / Visa-Free Entry',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'On arrival / e-visa',
        cost: '$0–$90',
        minIncomeMonthly: null,
        duration: '90 days',
        requirements: ['Valid passport', 'Return ticket', 'Proof of funds'],
      },
    ],
  },
  {
    country: 'Netherlands',
    visaScore: 54,
    summary:
      'The Netherlands rarely grants retiree residency — independent means and DAFT (US entrepreneurs) are niche options.',
    options: [
      {
        name: 'Residence — Financially Independent',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '3–6 months',
        cost: '$200–$400',
        minIncomeMonthly: 2800,
        duration: '1 year, renewable',
        requirements: [
          'Substantial savings or passive income',
          'No burden on Dutch welfare system',
          'Health insurance (basisverzekering)',
          'Official source: https://ind.nl/en/residence-permits',
        ],
      },
      {
        name: 'DAFT Treaty Residence (US Citizens)',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–4 months',
        cost: '$300–$600',
        minIncomeMonthly: null,
        duration: '1 year, renewable',
        requirements: [
          'US nationality with Dutch business activity',
          'Sufficient personal capital in Dutch business',
          'Official source: https://ind.nl/en/daft',
        ],
      },
    ],
  },
  {
    country: 'New Zealand',
    visaScore: 60,
    summary:
      'Visitor visas allow extended stays for retirees; parent retirement visas require family ties and investment.',
    options: [
      {
        name: 'Visitor Visa — Longer Stay',
        type: 'Tourist Visa',
        difficulty: 'Moderate',
        processingTime: '1–3 months',
        cost: '$190–$350',
        minIncomeMonthly: null,
        duration: 'Up to 9 months in an 18-month period',
        requirements: [
          'Genuine visitor intent and onward travel',
          'Proof of funds and health insurance',
          'Meet character requirements',
          'Official source: https://www.immigration.govt.nz/new-zealand-visas/visas/visa/visitor-visa',
        ],
      },
      {
        name: 'Parent Retirement Resident Visa',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '6–12 months',
        cost: '$3,500+ fees; $1M+ investment',
        minIncomeMonthly: null,
        duration: '4 years, then permanent',
        requirements: [
          'Adult child who is NZ citizen/resident',
          'Guaranteed minimum income or settlement funds',
          'Health and character checks',
          'Official source: https://www.immigration.govt.nz/new-zealand-visas/visas/visa/parent-retirement-resident-visa',
        ],
      },
    ],
  },
  {
    country: 'Norway',
    visaScore: 50,
    summary:
      'Norway restricts non-EU residency — independent means permits exist but require strong finances.',
    options: [
      {
        name: 'Residence Permit — Strong Ties / Sufficient Funds',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '3–8 months',
        cost: '$300–$600',
        minIncomeMonthly: 3000,
        duration: '1 year, renewable',
        requirements: [
          'Documented savings or pension well above Norwegian minimum',
          'No reliance on public benefits',
          'Health insurance',
          'Official source: https://www.udi.no/en/want-to-apply/',
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
    country: 'Oman',
    visaScore: 66,
    summary:
      'Oman’s retirement residence suits older expats who meet property, income, or savings criteria.',
    options: [
      {
        name: 'Retirement Residence',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '4–8 weeks',
        cost: '$260–$520',
        minIncomeMonthly: 2000,
        duration: '2 years, renewable',
        requirements: [
          'Age 55+ with pension/income OR property investment thresholds',
          'Health insurance',
          'Clean criminal record',
          'Official source: https://evisa.rop.gov.om/',
        ],
      },
      {
        name: 'Tourist / Visit Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: '1–5 days',
        cost: '$0–$50',
        minIncomeMonthly: null,
        duration: '10–30 days, extendable',
        requirements: ['Valid passport', 'Hotel booking', 'Return ticket'],
      },
    ],
  },
  {
    country: 'Peru',
    visaScore: 74,
    summary:
      'Peru’s rentista visa is a straightforward path for retirees with foreign pension or investment income.',
    options: [
      {
        name: 'Rentista Visa',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–4 months',
        cost: '$200–$400',
        minIncomeMonthly: 1000,
        duration: '1 year, renewable',
        requirements: [
          'Proof of permanent passive income from abroad',
          'Interpol clearance and apostilled documents',
          'Health insurance or local coverage plan',
          'Official source: https://www.gob.pe/2386-solicitar-visa-de-residencia-rentista',
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
        requirements: ['Valid passport', 'Proof of funds', 'Onward ticket'],
      },
    ],
  },
  {
    country: 'Philippines',
    visaScore: 78,
    summary:
      'The SRRV is one of Asia’s best-known retiree programmes with multiple deposit tiers by age.',
    options: [
      {
        name: 'Special Resident Retiree’s Visa (SRRV)',
        type: 'Residency',
        difficulty: 'Easy',
        processingTime: '1–3 months',
        cost: '$1,400–$3,000 fees',
        minIncomeMonthly: 800,
        duration: 'Indefinite while deposit maintained',
        requirements: [
          'Age 35+ (50+ for lower deposit tiers)',
          'Deposit $10,000–$50,000 in PRA-approved bank (varies by age/pension)',
          'Pension of $800/mo for some categories',
          'Official source: https://pra.gov.ph/special-resident-retirees-visa/',
        ],
      },
      {
        name: 'Tourist Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'On arrival / e-visa',
        cost: '$0–$35',
        minIncomeMonthly: null,
        duration: '30 days, extendable',
        requirements: ['Valid passport', 'Return ticket', 'Proof of funds'],
      },
    ],
  },
  {
    country: 'Poland',
    visaScore: 64,
    summary:
      'Temporary residence based on stable foreign income suits retirees and remote earners with Polish ties.',
    options: [
      {
        name: 'Temporary Residence — Stable Income',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–4 months',
        cost: '$80–$200',
        minIncomeMonthly: 1500,
        duration: '1–3 years, renewable',
        requirements: [
          'Proof of stable income or pension from abroad',
          'Health insurance and accommodation',
          'Criminal record certificate',
          'Official source: https://www.gov.pl/web/diplomacy/visas-and-residence-permits',
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
    country: 'Qatar',
    visaScore: 64,
    summary:
      'Qatar offers property-linked and family residency options; dedicated retiree routes are limited but growing.',
    options: [
      {
        name: 'Property Owner Residency',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '4–8 weeks',
        cost: '$500–$1,000',
        minIncomeMonthly: null,
        duration: 'Linked to property ownership, renewable',
        requirements: [
          'Ownership of qualifying property in designated zones',
          'Clean criminal record',
          'Health insurance',
          'Official source: https://www.moi.gov.qa/',
        ],
      },
      {
        name: 'Family / Retirement Sponsorship',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–6 weeks',
        cost: '$200–$500',
        minIncomeMonthly: 3000,
        duration: '1 year, renewable',
        requirements: [
          'Eligible sponsor or qualifying income',
          'Medical checks',
          'Official source: https://www.moi.gov.qa/',
        ],
      },
    ],
  },
  {
    country: 'Singapore',
    visaScore: 52,
    summary:
      'Singapore has no simple retiree visa — long-term visit passes and global investor routes target wealthier applicants.',
    options: [
      {
        name: 'Long-Term Visit Pass (LTVP)',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '1–3 months',
        cost: '$60–$300',
        minIncomeMonthly: null,
        duration: 'Up to 2 years, renewable',
        requirements: [
          'Singapore citizen or PR sponsor (often family)',
          'Sponsor income and commitment to support',
          'Medical insurance',
          'Official source: https://www.ica.gov.sg/reside/LTVP',
        ],
      },
      {
        name: 'Global Investor Programme',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '6–12 months',
        cost: '$10,000+ fees; $2.5M+ investment',
        minIncomeMonthly: null,
        duration: 'Permanent residence pathway',
        requirements: [
          'Substantial business or investment track record',
          'Significant capital deployment in Singapore',
          'Official source: https://www.edb.gov.sg/en/setting-up/global-investor-programme.html',
        ],
      },
    ],
  },
  {
    country: 'Slovenia',
    visaScore: 66,
    summary:
      'Temporary residence for sufficient means allows retirees to live in Slovenia on overseas income.',
    options: [
      {
        name: 'Temporary Residence — Sufficient Means',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–4 months',
        cost: '$100–$250',
        minIncomeMonthly: 1400,
        duration: '1 year, renewable',
        requirements: [
          'Proof of pension or passive income',
          'Health insurance',
          'Registered address in Slovenia',
          'Official source: https://www.gov.si/en/topics/entry-and-residence/',
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
    country: 'South Africa',
    visaScore: 58,
    summary:
      'Retired persons’ visas require proof of pension or assets — a formal but established retiree category.',
    options: [
      {
        name: 'Retired Person Visa',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '2–4 months',
        cost: '$150–$350',
        minIncomeMonthly: 1500,
        duration: 'Up to 4 years, renewable',
        requirements: [
          'Proof of pension or irrevocable annuity',
          'Minimum lump sum or monthly income thresholds',
          'Medical and radiological reports',
          'Official source: https://www.dha.gov.za/index.php/immigration-services',
        ],
      },
      {
        name: 'Tourist Visa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: 'On arrival / e-visa',
        cost: '$0–$50',
        minIncomeMonthly: null,
        duration: '90 days',
        requirements: ['Valid passport', 'Return ticket', 'Proof of funds'],
      },
    ],
  },
  {
    country: 'South Korea',
    visaScore: 56,
    summary:
      'Korea’s F-2 long-term residency and digital nomad-style permits cover some retirees with income or ties.',
    options: [
      {
        name: 'F-2 Residence (Points-Based)',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '2–4 months',
        cost: '$100–$250',
        minIncomeMonthly: 2000,
        duration: '1–3 years, renewable',
        requirements: [
          'Points for age, income, education, Korean language',
          'Stable income or assets',
          'Criminal record certificate',
          'Official source: https://www.visa.go.kr/',
        ],
      },
      {
        name: 'Workation (Digital Nomad) Visa',
        type: 'Digital Nomad Visa',
        difficulty: 'Moderate',
        processingTime: '2–4 weeks',
        cost: '$45–$100',
        minIncomeMonthly: 6500,
        duration: '1–2 years',
        requirements: [
          'Remote work for foreign employer',
          'Income proof and health insurance',
          'Valid passport',
          'Official source: https://www.visa.go.kr/',
        ],
      },
    ],
  },
  {
    country: 'Switzerland',
    visaScore: 48,
    summary:
      'Swiss residence for financially independent persons is possible but expensive and canton-specific.',
    options: [
      {
        name: 'Residence Permit — Financially Independent',
        type: 'Residency',
        difficulty: 'Hard',
        processingTime: '3–8 months',
        cost: '$500–$2,000',
        minIncomeMonthly: 4000,
        duration: '1 year, renewable (L permit)',
        requirements: [
          'Substantial assets or pension income',
          'Health insurance (Swiss mandatory)',
          'Cantonal approval; no local employment',
          'Official source: https://www.sem.admin.ch/sem/en/home/themen.html',
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
    country: 'Vietnam',
    visaScore: 68,
    summary:
      'Temporary residence cards for retirees with investment or pension income support long stays in Vietnam.',
    options: [
      {
        name: 'Temporary Residence Card (Retiree / Investment)',
        type: 'Residency',
        difficulty: 'Moderate',
        processingTime: '1–2 months',
        cost: '$100–$300',
        minIncomeMonthly: 2000,
        duration: '1–3 years, renewable',
        requirements: [
          'Proof of pension or foreign income OR qualifying investment',
          'Temporary residence book and health check',
          'Sponsor or legal entity in some categories',
          'Official source: https://evisa.xuatnhapcanh.gov.vn/',
        ],
      },
      {
        name: 'Tourist / eVisa',
        type: 'Tourist Visa',
        difficulty: 'Easy',
        processingTime: '3–5 days',
        cost: '$25–$50',
        minIncomeMonthly: null,
        duration: '30–90 days, extendable',
        requirements: ['Valid passport', 'Proof of funds', 'Return ticket'],
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
  /** True when the only viable paths require a spouse/family sponsor the user did not indicate. */
  requiresFamilySponsor?: boolean
}

/**
 * Explicit quiz signals for a qualifying spouse/family sponsor in the destination.
 * The general `family` lifestyle tag (relocating with household) does NOT count.
 */
const FAMILY_SPONSOR_SIGNAL_TAGS = ['family_sponsor_in_destination', 'spouse_in_destination'] as const

function hasFamilySponsorSignal(lifestyle?: string[]): boolean {
  if (!lifestyle?.length) return false
  return FAMILY_SPONSOR_SIGNAL_TAGS.some((tag) => lifestyle.includes(tag))
}

function isFamilyContingentVisa(option: VisaOption): boolean {
  const name = option.name.toLowerCase()
  if (/\bspouse\b/.test(name)) return true
  if (/\bfamily\b/.test(name) && /\bsponsor|stay|reunion|\//.test(name)) return true

  return option.requirements.some((req) =>
    /spouse of|dependent of eligible|qualifying spouse|family sponsor|citizen or pr sponsor/i.test(
      req,
    ),
  )
}

function sortVisaOptions(options: VisaOption[]): VisaOption[] {
  return [...options].sort((a, b) => {
    const typeDiff = TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type]
    if (typeDiff !== 0) return typeDiff
    return DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty]
  })
}

function filterAffordable(options: VisaOption[], monthlyBudget?: number): VisaOption[] {
  if (typeof monthlyBudget !== 'number') return []
  return options.filter((o) => o.minIncomeMonthly == null || monthlyBudget >= o.minIncomeMonthly)
}

/**
 * Rule-based recommendation: pick the best long-stay option the user
 * qualifies for given their monthly budget (vs minIncomeMonthly threshold).
 * Family/spouse-contingent visas are excluded unless the quiz includes an
 * explicit sponsor-tie signal; when only family paths exist, the reason
 * states the eligibility requirement prominently.
 */
export function recommendVisa(
  info: CountryVisaInfo,
  monthlyBudget?: number,
  lifestyle?: string[]
): VisaRecommendation | null {
  if (!info.options.length) return null

  const longStay = info.options.filter((o) => o.type !== 'Tourist Visa')
  const pool = longStay.length ? longStay : info.options

  const familySignal = hasFamilySponsorSignal(lifestyle)
  const nonFamilyPool = pool.filter((o) => !isFamilyContingentVisa(o))
  const familyOnlyFallback = !familySignal && nonFamilyPool.length === 0
  const candidatePool = familySignal ? pool : nonFamilyPool.length > 0 ? nonFamilyPool : pool

  const sorted = sortVisaOptions(candidatePool)
  const affordable = filterAffordable(sorted, monthlyBudget)
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

  const familyEligibilityPrefix = familyOnlyFallback
    ? `Requires a qualifying spouse or family sponsor in ${info.country}. `
    : ''

  let reason: string
  if (qualifies && chosen.minIncomeMonthly != null) {
    reason = `${familyEligibilityPrefix}Based on ${budgetText}, you comfortably meet the ${chosen.name}'s ~$${chosen.minIncomeMonthly.toLocaleString()}/mo requirement. It's a ${chosen.difficulty.toLowerCase()} application valid for ${chosen.duration.toLowerCase()}.${lifestyleHint}`
  } else if (qualifies) {
    reason = `${familyEligibilityPrefix}The ${chosen.name} has no fixed income floor and is a ${chosen.difficulty.toLowerCase()} path valid for ${chosen.duration.toLowerCase()} — a strong starting point for ${budgetText}.${lifestyleHint}`
  } else {
    const gap = chosen.minIncomeMonthly!
    reason = `${familyEligibilityPrefix}The ${chosen.name} typically expects ~$${gap.toLocaleString()}/mo, which is above ${budgetText}. Consider a tourist-visa stay first, or boost documented income before applying.${lifestyleHint}`
  }

  return {
    option: chosen,
    qualifies,
    reason,
    requiresFamilySponsor: familyOnlyFallback,
  }
}

export { VISA_DATA }
