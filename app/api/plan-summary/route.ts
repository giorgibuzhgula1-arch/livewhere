import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { AnalyzeRequest, CityResult } from '@/lib/types'

export const dynamic = 'force-dynamic'

const OPENAI_MODEL = 'gpt-4o-mini'
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions'

function buildPrompt(
  planName: string,
  quizInput: AnalyzeRequest,
  cityResults: CityResult[],
): string {
  const top = cityResults.slice(0, 5)
  const p = quizInput.priorities
  const lifestyle = quizInput.lifestyle?.length ? quizInput.lifestyle.join(', ') : 'not specified'

  const cityLines = top
    .map(
      (c, i) =>
        `${i + 1}. ${c.name}, ${c.country} — match ${c.score}/100, ~$${Math.round(c.monthlyCost).toLocaleString()}/mo, tax ${c.taxRate}%, healthcare ${c.scores?.health ?? '—'}/100`,
    )
    .join('\n')

  return `Write exactly 2-3 sentences summarizing why this saved retirement plan fits the user's preferences. Mention budget, climate/lifestyle, healthcare, and taxes where relevant. Be specific to the cities and numbers below. Plain text only — no markdown, bullets, or headings.

Plan name: ${planName}
Monthly budget: ${quizInput.monthlyBudget.toLocaleString()} ${quizInput.currency}
Lifestyle: ${lifestyle}
Priority emphasis (1-5): tax ${p.tax}, housing ${p.housing}, health ${p.health}, safety ${p.safety}, climate ${p.climate}

Top matches:
${cityLines || 'No cities provided'}`
}

async function authenticateUser(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.slice(7)
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  return user?.id ?? null
}

export async function POST(req: NextRequest) {
  const userId = await authenticateUser(req)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const record = body && typeof body === 'object' ? (body as Record<string, unknown>) : null
  const planId = typeof record?.planId === 'string' ? record.planId : null
  const planName = typeof record?.planName === 'string' ? record.planName.trim() : ''
  const quizInput = record?.quizInput as AnalyzeRequest | undefined
  const cityResults = Array.isArray(record?.cityResults) ? (record.cityResults as CityResult[]) : []

  if (!planName || !quizInput || cityResults.length === 0) {
    return NextResponse.json({ error: 'planName, quizInput, and cityResults are required' }, { status: 400 })
  }

  if (planId) {
    const { data: existing } = await supabaseAdmin
      .from('saved_retirement_plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.7,
        max_tokens: 220,
        messages: [
          {
            role: 'system',
            content:
              'You write concise retirement plan summaries for LiveWhere users. Use only the data provided. Respond with plain text only — 2 or 3 complete sentences.',
          },
          {
            role: 'user',
            content: buildPrompt(planName, quizInput, cityResults),
          },
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('OpenAI plan-summary failed:', res.status, errText)
      return NextResponse.json({ error: 'AI summary failed' }, { status: 502 })
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[]
    }
    const summary = data.choices?.[0]?.message?.content?.trim()
    if (!summary) {
      return NextResponse.json({ error: 'Empty AI response' }, { status: 502 })
    }

    if (planId) {
      const { error: updateError } = await supabaseAdmin
        .from('saved_retirement_plans')
        .update({ ai_summary: summary, updated_at: new Date().toISOString() })
        .eq('id', planId)
        .eq('user_id', userId)

      if (updateError) {
        console.error('plan-summary update failed:', updateError.message)
        return NextResponse.json({ error: 'Could not save summary' }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true, summary })
  } catch (err) {
    console.error('plan-summary error:', err)
    return NextResponse.json({ error: 'AI summary failed' }, { status: 500 })
  }
}
