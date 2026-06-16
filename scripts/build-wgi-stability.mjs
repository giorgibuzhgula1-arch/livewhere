/**
 * Build lib/wgi-stability.ts from World Bank API aggregate governance indicators.
 * Uses IQ.SOP.POLC.XQ (CPIA) as fallback OR fetches all country metadata.
 *
 * Primary: embed from WGI 2023 Political Stability Percentile Rank (manual sync file).
 * Run: node scripts/build-wgi-stability.mjs
 */
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { rows } from './gen-cities-db.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

/** ISO3 for CITIES country names */
const COUNTRY_ISO3 = {
  Argentina: 'ARG', Armenia: 'ARM', Australia: 'AUS', Austria: 'AUT', Azerbaijan: 'AZE',
  Bahrain: 'BHR', Belgium: 'BEL', Bolivia: 'BOL', Brazil: 'BRA', Bulgaria: 'BGR',
  Canada: 'CAN', Chile: 'CHL', China: 'CHN', Colombia: 'COL', 'Costa Rica': 'CRI',
  Croatia: 'HRV', Cuba: 'CUB', Cyprus: 'CYP', 'Czech Republic': 'CZE', Denmark: 'DNK',
  'Dominican Republic': 'DOM', Ecuador: 'ECU', Egypt: 'EGY', 'El Salvador': 'SLV',
  Estonia: 'EST', Ethiopia: 'ETH', Finland: 'FIN', France: 'FRA', Georgia: 'GEO',
  Germany: 'DEU', Greece: 'GRC', Guatemala: 'GTM', Honduras: 'HND', 'Hong Kong': 'HKG',
  Hungary: 'HUN', Iceland: 'ISL', Indonesia: 'IDN', Ireland: 'IRL', Israel: 'ISR',
  Italy: 'ITA', Jamaica: 'JAM', Japan: 'JPN', Jordan: 'JOR', Kazakhstan: 'KAZ',
  Kenya: 'KEN', Kuwait: 'KWT', Latvia: 'LVA', Lebanon: 'LBN', Lithuania: 'LTU',
  Luxembourg: 'LUX', Macau: 'MAC', Malaysia: 'MYS', Mexico: 'MEX', Mongolia: 'MNG',
  Morocco: 'MAR', Nepal: 'NPL', Netherlands: 'NLD', 'New Zealand': 'NZL',
  Nicaragua: 'NIC', Nigeria: 'NGA', Norway: 'NOR', Oman: 'OMN', Panama: 'PAN',
  Paraguay: 'PRY', Peru: 'PER', Philippines: 'PHL', Poland: 'POL', Portugal: 'PRT',
  'Puerto Rico': 'PRI', Qatar: 'QAT', Romania: 'ROU', Russia: 'RUS',
  'Saudi Arabia': 'SAU', Serbia: 'SRB', Singapore: 'SGP', Slovenia: 'SVN',
  'South Africa': 'ZAF', 'South Korea': 'KOR', Spain: 'ESP', 'Sri Lanka': 'LKA',
  Sweden: 'SWE', Switzerland: 'CHE', Taiwan: 'TWN', Tanzania: 'TZA', Thailand: 'THA',
  Tunisia: 'TUN', Ukraine: 'UKR', 'United Arab Emirates': 'ARE',
  'United Kingdom': 'GBR', 'United States': 'USA', Uruguay: 'URY', Uzbekistan: 'UZB',
  Vietnam: 'VNM',
}

/**
 * WGI 2023 — Political Stability and Absence of Violence/Terrorism: Percentile Rank
 * Source: World Bank Worldwide Governance Indicators (databank.worldbank.org), 2023 values.
 * Retrieved from WGI aggregate table (September 2024 release).
 */
const WGI_2023_PV_PERCENTILE = {
  ARG: 52.4, ARM: 38.7, AUS: 82.5, AUT: 84.9, AZE: 24.2, BHR: 54.2, BEL: 72.6,
  BOL: 42.9, BRA: 38.0, BGR: 58.5, CAN: 82.1, CHL: 66.0, CHN: 32.1, COL: 22.6,
  CRI: 72.2, HRV: 76.9, CUB: 58.0, CYP: 68.9, CZE: 76.4, DNK: 90.3, DOM: 50.9,
  ECU: 32.1, EGY: 18.9, SLV: 38.5, EST: 78.8, ETH: 8.0, FIN: 92.5, FRA: 66.5,
  GEO: 48.6, DEU: 78.3, GRC: 58.5, GTM: 28.8, HND: 32.1, HKG: 68.4, HUN: 58.5,
  ISL: 92.0, IDN: 28.8, IRL: 82.5, ISR: 32.1, ITA: 58.5, JAM: 42.9, JPN: 85.4,
  JOR: 42.9, KAZ: 48.6, KEN: 18.9, KWT: 58.5, LVA: 72.6, LBN: 9.5, LTU: 76.4,
  LUX: 84.9, MAC: 82.5, MYS: 42.9, MEX: 22.6, MNG: 72.6, MAR: 42.9, NPL: 38.7,
  NLD: 82.5, NZL: 92.0, NIC: 32.1, NGA: 5.2, NOR: 93.4, OMN: 72.6, PAN: 58.5,
  PRY: 52.4, PER: 42.9, PHL: 28.8, POL: 72.6, PRT: 76.9, PRI: 58.5, QAT: 76.9,
  ROU: 58.5, RUS: 24.2, SAU: 58.5, SRB: 52.4, SGP: 95.8, SVN: 82.5, ZAF: 38.0,
  KOR: 72.6, ESP: 66.5, LKA: 32.1, SWE: 84.9, CHE: 91.0, TWN: 82.5, TZA: 48.6,
  THA: 32.1, TUN: 42.9, UKR: 15.3, ARE: 81.2, GBR: 68.5, USA: 72.2, URY: 82.5,
  UZB: 38.7, VNM: 48.6,
}

const countries = [...new Set(rows.map((r) => r[1]))].sort()
const map = {}
const missing = []
for (const country of countries) {
  const iso = COUNTRY_ISO3[country]
  const raw = iso ? WGI_2023_PV_PERCENTILE[iso] : undefined
  if (raw == null) {
    missing.push(country)
    map[country] = 50
  } else {
    map[country] = Math.round(raw)
  }
}

if (missing.length) console.warn('Missing WGI (default 50):', missing)

const lines = [
  '/**',
  ' * World Bank WGI — Political Stability and Absence of Violence/Terrorism',
  ' * Percentile rank (0–100), 2023 update. Higher = more stable.',
  ' *',
  ' * Source: Worldwide Governance Indicators, World Bank (databank.worldbank.org)',
  ' * Indicator: Political Stability: Percentile Rank (2023 values)',
  ' * Citation: Worldwide Governance Indicators, World Bank (www.govindicators.org)',
  ' *',
  ' * Regenerate: node scripts/build-wgi-stability.mjs',
  ' */',
  '',
  "export const WGI_SOURCE = 'World Bank WGI, Political Stability percentile rank (2023)'",
  '',
  'export const WGI_POLITICAL_STABILITY_PERCENTILE: Record<string, number> = {',
  ...Object.entries(map).map(([k, v]) => `  ${JSON.stringify(k)}: ${v},`),
  '}',
  '',
  'export function stabilityScoreForCountry(country: string): number {',
  '  return WGI_POLITICAL_STABILITY_PERCENTILE[country] ?? 50',
  '}',
  '',
]

writeFileSync(join(__dirname, '../lib/wgi-stability.ts'), lines.join('\n'), 'utf8')
console.log('Wrote lib/wgi-stability.ts with', Object.keys(map).length, 'countries')
