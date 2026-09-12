function splitEnvList(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
}

export function founderTestEmails(): string[] {
  return splitEnvList(process.env.FOUNDER_TEST_EMAILS)
}

export function founderTestUserIds(): string[] {
  return splitEnvList(process.env.FOUNDER_TEST_USER_IDS)
}

export function isExcludedTestPurchase(params: {
  sessionId: string
  livemode: boolean | null | undefined
  email?: string | null
  userId?: string | null
}): boolean {
  if (params.livemode === false) return true
  if (params.sessionId.startsWith('cs_test_')) return true

  const email = params.email?.trim().toLowerCase()
  if (email && founderTestEmails().includes(email)) return true

  const userId = params.userId?.trim().toLowerCase()
  if (userId && founderTestUserIds().includes(userId)) return true

  return false
}
