import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { AnalyzeRequest } from '@/lib/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  const body: AnalyzeRequest = await req.json()

  // Auth check (optional - allow 3 free searches via cookie)
  const authHeader = req.headers.get('Authorization')
  let userId: string | null = null
  let plan = 'free'

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (user) {
      userId = user.id
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('plan, searches_this_month')
        .eq('id', user.id)
        .single()

      plan = profile?.plan || 'free'

      if (plan === 'free' && (profile?.searches_this_month || 0) >= 3) {
        return NextResponse.json(
          { error: 'Free plan limit reached. Upgrade to Pro for unlimited searches.' },
          { status: 403 }
        )
      }
    }
  }

  const { salary, currency, priorities, lifestyle } = body

  const prompt = `You are a world-class relocation advisor and financial analyst.

A user wants to find their perfect city to live in. Here is their profile:
- Annual salary: ${salary} ${currency} (remote worker / location independent)
- Priorities (1-5 scale, 5 = most important):
  * Low taxes: ${priorities.tax}/5
  * Affordable housing: ${priorities.housing}/5
  * Good climate: ${priorities.climate}/5
  * Healthcare quality: ${priorities.health}/5
  * Nightlife & culture: ${priorities.nightlife}/5
  * Safety: ${priorities.safety}/5
- Lifestyle preferences: ${lifestyle.join(', ')}

Based on this profile, recommend exactly 8 cities from around the world (mix of continents).
For each city return a JSON object. Return ONLY a valid JSON array, no markdown, no explanation.

Each city object must have exactly these fields:
{
  "name": "City name",
  "country": "Country name",
  "continent": "Europe|Americas|Asia|Other",
  "flag": "emoji flag",
  "score": <0-100 integer, personalized match score based on user priorities>,
  "taxRate": <effective income tax % as integer>,
  "monthlyRent": <average 1-bed apartment rent in USD>,
  "monthlyCost": <total monthly living cost in USD including rent>,
  "pros": ["pro 1", "pro 2", "pro 3", "pro 4"],
  "cons": ["con 1", "con 2", "con 3"],
  "tags": ["tag1", "tag2", "tag3"],
  "visa": "visa difficulty description",
  "scores": {
    "tax": <0-100>,
    "housing": <0-100>,
    "climate": <0-100>,
    "health": <0-100>,
    "nightlife": <0-100>,
    "safety": <0-100>
  },
  "aiInsight": "2-sentence personalized insight for this specific user about why this city matches their profile"
}

Sort by score descending. Ensure geographic diversity. Be accurate with real tax rates and costs.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const raw = completion.choices[0].message.content || '[]'
    const clean = raw.replace(/```json|```/g, '').trim()
    const cities = JSON.parse(clean)

    // Add calculated fields
    const enriched = cities.map((city: any) => {
      const takeHomeYearly = Math.round(salary * (1 - city.taxRate / 100))
      const takeHomeMonthly = Math.round(takeHomeYearly / 12)
      const monthlySavings = takeHomeMonthly - city.monthlyCost
      return { ...city, takeHomeMonthly, monthlySavings }
    })

    // Save search to DB if authenticated
    if (userId) {
      await supabaseAdmin.from('searches').insert({
        user_id: userId,
        salary,
        currency,
        priorities,
        lifestyle,
        results: enriched,
      })

      await supabaseAdmin
        .from('profiles')
        .update({ searches_this_month: supabaseAdmin.rpc('increment', { x: 1 }) })
        .eq('id', userId)
    }

    return NextResponse.json({ cities: enriched })
  } catch (err) {
    console.error('OpenAI error:', err)
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 })
  }
}
