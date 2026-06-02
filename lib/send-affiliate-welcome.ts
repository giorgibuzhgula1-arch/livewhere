import { Resend } from 'resend'
import { affiliateWelcomeEmailContent } from '@/lib/emails/affiliate-welcome'

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return null
  return new Resend(apiKey)
}

function getFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    'LiveWhere <onboarding@resend.dev>'
  )
}

export async function sendAffiliateWelcomeEmail(params: {
  to: string
  name: string
  referralUrl: string
  commissionRate?: number
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const resend = getResendClient()
  if (!resend) {
    return { ok: false, error: 'RESEND_API_KEY is not configured' }
  }

  const { subject, html, text } = affiliateWelcomeEmailContent({
    name: params.name,
    referralUrl: params.referralUrl,
    commissionRate: params.commissionRate,
  })

  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to: params.to,
    subject,
    html,
    text,
  })

  if (error) {
    console.error('Resend affiliate welcome failed:', error)
    return { ok: false, error: error.message || 'Failed to send email' }
  }

  return { ok: true, id: data?.id ?? '' }
}
