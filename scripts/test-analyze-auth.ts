/**
 * Verifies analyze auth cookie/Bearer resolution without a manual browser.
 * Usage: npx tsx scripts/test-analyze-auth.ts
 */
import { readFileSync } from 'fs'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { serialize } from 'cookie'
import { supabaseAuthStorageKey } from '../lib/supabase/cookie-options'
import {
  combineCookieChunks,
  createSupabaseSsrCookieMethods,
  parseCookieHeader,
  parseSupabaseSessionFromCookies,
} from '../lib/supabase/session-cookie'

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

const fakeSession = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  expires_in: 3600,
  token_type: 'bearer',
  user: { id: 'user-1' },
}
const fakeJson = JSON.stringify(fakeSession)
const storageKey = 'sb-mxbcwekatnwlcyyiynxu-auth-token'

function testParser() {
  const fromRaw = parseSupabaseSessionFromCookies(
    [{ name: storageKey, value: fakeJson }],
    storageKey,
  )
  assert(fromRaw?.access_token === 'test-access-token', 'raw JSON cookie should parse')

  const encoded = encodeURIComponent(fakeJson)
  const fromEncoded = parseSupabaseSessionFromCookies(
    [{ name: storageKey, value: encoded }],
    storageKey,
  )
  assert(fromEncoded?.access_token === 'test-access-token', 'URI-encoded cookie should parse')

  const header = serialize(storageKey, fakeJson)
  const fromHeader = parseSupabaseSessionFromCookies(parseCookieHeader(header), storageKey)
  assert(fromHeader?.access_token === 'test-access-token', 'serialized Cookie header should parse')

  const chunk0 = fakeJson.slice(0, 40)
  const chunk1 = fakeJson.slice(40)
  const fromChunks = parseSupabaseSessionFromCookies(
    [
      { name: `${storageKey}.0`, value: chunk0 },
      { name: `${storageKey}.1`, value: chunk1 },
    ],
    storageKey,
  )
  assert(fromChunks?.access_token === 'test-access-token', 'chunked cookies should parse')

  const stalePlusChunks = parseSupabaseSessionFromCookies(
    [
      { name: storageKey, value: '{}' },
      { name: `${storageKey}.0`, value: chunk0 },
      { name: `${storageKey}.1`, value: chunk1 },
    ],
    storageKey,
  )
  assert(
    stalePlusChunks?.access_token === 'test-access-token',
    'valid chunks should win over stale unchunked leftover',
  )

  const combined = combineCookieChunks([{ name: storageKey, value: encoded }], storageKey)
  assert(combined?.startsWith('{'), 'combineCookieChunks should return decoded JSON')

  const b64 = `base64-${Buffer.from(fakeJson, 'utf8').toString('base64')}`
  const fromB64 = parseSupabaseSessionFromCookies(
    [{ name: storageKey, value: b64 }],
    storageKey,
  )
  assert(fromB64?.access_token === 'test-access-token', 'base64- prefixed cookie should parse')

  console.log('PASS parser')
}

const ANALYZE_BODY = {
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

async function main() {
  testParser()
  loadEnvLocal()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY
  assert(url && anon && service, 'missing supabase env')

  const authStorageKey = supabaseAuthStorageKey(url)
  const admin = createClient(url, service)
  const password = `Tmp-${Date.now()}-Aa1!`
  const email = `analyze-auth-${Date.now()}@example.com`

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  assert(created.data.user?.id, `createUser failed: ${created.error?.message}`)
  const userId = created.data.user.id

  try {
    const browser = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const signedIn = await browser.auth.signInWithPassword({ email, password })
    assert(signedIn.data.session?.access_token, `signIn failed: ${signedIn.error?.message}`)
    const session = signedIn.data.session
    const sessionJson = JSON.stringify(session)

    const encodedStore = [{ name: authStorageKey, value: encodeURIComponent(sessionJson) }]
    const supabaseFromEncoded = createServerClient(url, anon, {
      cookieOptions: { name: authStorageKey },
      cookies: createSupabaseSsrCookieMethods({ getAll: () => encodedStore }),
    })
    const encodedUser = await supabaseFromEncoded.auth.getUser()
    assert(
      encodedUser.data.user?.id === userId,
      `createServerClient getUser failed on URI-encoded cookie: ${encodedUser.error?.message ?? 'no user'}`,
    )
    console.log('PASS createServerClient getUser (URI-encoded cookie)')

    const rawStore = [{ name: authStorageKey, value: sessionJson }]
    const supabaseFromRaw = createServerClient(url, anon, {
      cookieOptions: { name: authStorageKey },
      cookies: createSupabaseSsrCookieMethods({ getAll: () => rawStore }),
    })
    const rawUser = await supabaseFromRaw.auth.getUser()
    assert(
      rawUser.data.user?.id === userId,
      `createServerClient getUser failed on raw JSON cookie: ${rawUser.error?.message ?? 'no user'}`,
    )
    console.log('PASS createServerClient getUser (raw JSON cookie)')

    const cookieHeader = serialize(authStorageKey, sessionJson)
    const port = process.env.PORT || '3000'
    const res = await fetch(`http://localhost:${port}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookieHeader,
      },
      body: JSON.stringify(ANALYZE_BODY),
    })
    const text = await res.text()
    assert(res.status === 200, `analyze HTTP ${res.status}: ${text.slice(0, 300)}`)
    assert(text.includes('"type":"done"'), 'analyze missing done event')

    const searchIdMatch = text.match(/"searchId"\s*:\s*"([0-9a-f-]+)"/i)
    await new Promise((r) => setTimeout(r, 2500))

    const { data: profile } = await admin
      .from('profiles')
      .select('searches_today, search_day')
      .eq('id', userId)
      .maybeSingle()
    const today = new Date().toISOString().slice(0, 10)
    const profileHit =
      profile?.search_day === today && (profile?.searches_today ?? 0) >= 1
    const { data: searchRows } = await admin
      .from('searches')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    assert(
      profileHit || (searchRows && searchRows.length > 0),
      `expected logged-in search record, profile=${JSON.stringify(profile)} searches=${searchRows?.length ?? 0}`,
    )
    console.log('PASS HTTP cookie-only analyze attached userId')

    if (searchIdMatch) {
      const { data: snap } = await admin
        .from('analyze_search_snapshots')
        .select('user_id')
        .eq('id', searchIdMatch[1])
        .maybeSingle()
      assert(snap?.user_id === userId, `snapshot user_id ${snap?.user_id} != ${userId}`)
      console.log('PASS snapshot user_id populated')
    } else {
      console.log('SKIP snapshot check (no searchId in done event)')
    }

    const bearerUser = await admin.auth.getUser(session.access_token)
    assert(bearerUser.data.user?.id === userId, `Bearer token getUser failed: ${bearerUser.error?.message}`)
    console.log('PASS Bearer token validates with admin getUser')
  } finally {
    await admin.auth.admin.deleteUser(userId)
  }
}

main()
  .then(() => {
    console.log('ALL PASS')
  })
  .catch((err) => {
    console.error('FAIL', err instanceof Error ? err.message : err)
    process.exit(1)
  })
