/**
 * Isolation test for GET /api/analyze/snapshot (paywall v2 step 2).
 * Usage: npx tsx scripts/test-analyze-snapshot.ts
 */
import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

function loadEnvLocal() {
  const text = readFileSync('.env.local', 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const QUIZ = {
  monthlyBudget: 2500,
  currency: 'USD',
  priorities: {
    tax: 3,
    housing: 3,
    climate: 3,
    health: 3,
    stability: 3,
    safety: 3,
    expat_community: 3,
    visa_residency: 3,
  },
  lifestyle: [],
}

const CITIES = Array.from({ length: 12 }, (_, i) => ({
  name: `Test City ${i + 1}`,
  country: 'Portugal',
  continent: 'Europe',
  flag: '🇵🇹',
  score: 90 - i,
  taxRate: 20,
  monthlyRent: 800,
  monthlyCost: 1400,
  takeHomeMonthly: 2500,
  monthlySavings: 1100,
  pros: ['test'],
  cons: ['test'],
  tags: ['test'],
  visa: 'test',
  healthcare: 'test',
  scores: { tax: 50, housing: 50, climate: 50, health: 50, stability: 50, safety: 50 },
  aiInsight: 'test',
  locked: false,
}))

async function signInToken(
  url: string,
  anon: string,
  email: string,
  password: string,
): Promise<string> {
  const browser = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const signedIn = await browser.auth.signInWithPassword({ email, password })
  assert(signedIn.data.session?.access_token, `signIn failed: ${signedIn.error?.message}`)
  return signedIn.data.session.access_token
}

async function getSnapshot(token: string | null, searchId?: string) {
  const port = process.env.PORT || '3000'
  const qs = searchId ? `?searchId=${encodeURIComponent(searchId)}` : ''
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`http://localhost:${port}/api/analyze/snapshot${qs}`, { headers })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, body }
}

async function main() {
  loadEnvLocal()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  assert(url && anon && service, 'missing supabase env')

  const admin = createClient(url, service)
  const stamp = Date.now()
  const password = `Tmp-${stamp}-Aa1!`
  const ids: string[] = []
  const snapshotId = randomUUID()

  const makeUser = async (label: string) => {
    const email = `snap-${label}-${stamp}@example.com`
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    assert(created.data.user?.id, `createUser ${label}: ${created.error?.message}`)
    ids.push(created.data.user.id)
    return { id: created.data.user.id, email }
  }

  try {
    const paidWith = await makeUser('paid-with')
    const paidWithout = await makeUser('paid-without')
    const freeUser = await makeUser('free')

    for (const [id, plan] of [
      [paidWith.id, 'pro'],
      [paidWithout.id, 'pro'],
      [freeUser.id, 'free'],
    ] as const) {
      const { error } = await admin.from('profiles').upsert({ id, plan })
      assert(!error, `profile upsert ${id}: ${error?.message}`)
    }

    const { error: snapErr } = await admin.from('analyze_search_snapshots').insert({
      id: snapshotId,
      user_id: paidWith.id,
      quiz_input: QUIZ,
      cities: CITIES,
    })
    assert(!snapErr, `insert snapshot: ${snapErr?.message}`)

    const paidWithToken = await signInToken(url, anon, paidWith.email, password)
    const paidWithoutToken = await signInToken(url, anon, paidWithout.email, password)
    const freeToken = await signInToken(url, anon, freeUser.email, password)

    const byId = await getSnapshot(paidWithToken, snapshotId)
    const latest = await getSnapshot(paidWithToken)
    const noSnap = await getSnapshot(paidWithoutToken)
    const free = await getSnapshot(freeToken)
    const anonReq = await getSnapshot(null)

    const summarize = (label: string, r: { status: number; body: Record<string, unknown> }) => {
      const snap = r.body.snapshot as { searchId?: string; cities?: unknown[] } | null | undefined
      return {
        label,
        status: r.status,
        error: r.body.error ?? null,
        snapshot: snap
          ? { searchId: snap.searchId, cityCount: Array.isArray(snap.cities) ? snap.cities.length : 0 }
          : snap === null
            ? null
            : undefined,
      }
    }

    const results = [
      summarize('paid + snapshot ?searchId=', byId),
      summarize('paid + snapshot latest', latest),
      summarize('paid + no snapshot', noSnap),
      summarize('free account', free),
      summarize('no auth', anonReq),
    ]
    console.log(JSON.stringify({ pass: true, results }, null, 2))

    assert(byId.status === 200 && (byId.body.snapshot as { searchId: string })?.searchId === snapshotId, 'paid+snapshot by id')
    assert(
      Array.isArray((byId.body.snapshot as { cities: unknown[] })?.cities) &&
        (byId.body.snapshot as { cities: unknown[] }).cities.length === 12,
      'paid+snapshot 12 cities',
    )
    assert(latest.status === 200 && (latest.body.snapshot as { searchId: string })?.searchId === snapshotId, 'paid+snapshot latest')
    assert(noSnap.status === 200 && noSnap.body.snapshot === null, 'paid no snapshot')
    assert(free.status === 403 && free.body.error === 'Paid plan required', 'free 403')
    assert(anonReq.status === 401, 'anon 401')
  } finally {
    await admin.from('analyze_search_snapshots').delete().eq('id', snapshotId)
    for (const id of ids) {
      await admin.auth.admin.deleteUser(id)
    }
  }
}

main().catch((err) => {
  console.error('FAIL', err instanceof Error ? err.message : err)
  process.exit(1)
})
