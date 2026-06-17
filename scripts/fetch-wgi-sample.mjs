/** Fetch WGI Political Stability percentile ranks via World Bank API (PV.EST → percentile). */
const COUNTRY_ISO = {
  'United States': 'US', Canada: 'CA', 'United Kingdom': 'GB', Germany: 'DE', France: 'FR',
  Italy: 'IT', Spain: 'ES', Portugal: 'PT', Netherlands: 'NL', Belgium: 'BE', Switzerland: 'CH',
  Austria: 'AT', Sweden: 'SE', Norway: 'NO', Denmark: 'DK', Finland: 'FI', Ireland: 'IE', Iceland: 'IS',
  Luxembourg: 'LU', Greece: 'GR', Cyprus: 'CY', Japan: 'JP', 'South Korea': 'KR', Singapore: 'SG',
  Australia: 'AU', 'New Zealand': 'NZ', Israel: 'IL', 'United Arab Emirates': 'AE', Qatar: 'QA',
  Kuwait: 'KW', Bahrain: 'BH', Oman: 'OM', 'Saudi Arabia': 'SA', 'Hong Kong': 'HK', Taiwan: 'TW',
  Macau: 'MO', Chile: 'CL', Uruguay: 'UY', Croatia: 'HR', 'Czech Republic': 'CZ', Estonia: 'EE',
  Slovenia: 'SI', Poland: 'PL', 'Puerto Rico': 'PR', Mexico: 'MX', Brazil: 'BR', Argentina: 'AR',
  Colombia: 'CO', Peru: 'PE', Ecuador: 'EC', Panama: 'PA', 'Costa Rica': 'CR', Cuba: 'CU',
  Jamaica: 'JM', 'Dominican Republic': 'DO', Guatemala: 'GT', Honduras: 'HN', 'El Salvador': 'SV',
  Nicaragua: 'NI', Bolivia: 'BO', Paraguay: 'PY', China: 'CN', Malaysia: 'MY', Thailand: 'TH',
  Russia: 'RU', Kazakhstan: 'KZ', Azerbaijan: 'AZ', Georgia: 'GE', Serbia: 'RS', Romania: 'RO',
  Bulgaria: 'BG', Hungary: 'HU', Latvia: 'LV', Lithuania: 'LT', 'South Africa': 'ZA', Mongolia: 'MN',
  Armenia: 'AM', Ukraine: 'UA', Vietnam: 'VN', Indonesia: 'ID', Philippines: 'PH', Egypt: 'EG',
  Morocco: 'MA', Tunisia: 'TN', Jordan: 'JO', Lebanon: 'LB', 'Sri Lanka': 'LK', Uzbekistan: 'UZ',
  Kenya: 'KE', Tanzania: 'TZ', Nigeria: 'NG', Nepal: 'NP', Ethiopia: 'ET',
}

async function fetchEstimates() {
  const codes = [...new Set(Object.values(COUNTRY_ISO))].join(';')
  const url = `https://api.worldbank.org/v2/country/${codes}/indicator/PV.EST?format=json&date=2022:2023&per_page=500`
  const res = await fetch(url)
  const json = await res.json()
  const rows = json[1] ?? []
  const byIso = new Map()
  for (const r of rows) {
    if (r.value == null) continue
    const prev = byIso.get(r.countryiso3code)
    if (!prev || r.date > prev.date) byIso.set(r.countryiso3code, { value: r.value, date: r.date })
  }
  return byIso
}

function estimatesToPercentiles(byIso) {
  const vals = [...byIso.values()].map((v) => v.value).sort((a, b) => a - b)
  const pct = new Map()
  for (const [iso, { value }] of byIso) {
    const rank = vals.filter((v) => v < value).length
    pct.set(iso, Math.round((rank / (vals.length - 1)) * 100))
  }
  return pct
}

const byIso = await fetchEstimates()
const pct = estimatesToPercentiles(byIso)
console.log('Fetched', byIso.size, 'countries')
for (const [country, iso] of Object.entries(COUNTRY_ISO).slice(0, 15)) {
  console.log(country, iso, 'est', byIso.get(iso)?.value, 'pct', pct.get(iso))
}
console.log('Georgia', pct.get('GE'), 'Lebanon', pct.get('LB'), 'UAE', pct.get('AE'), 'USA', pct.get('US'))
