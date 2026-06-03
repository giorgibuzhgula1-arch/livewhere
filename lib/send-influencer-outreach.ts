import { influencerOutreachEmailContent } from '@/lib/emails/influencer-outreach'
import { getResendClient, getResendFromAddress } from '@/lib/resend'

export async function sendInfluencerOutreachEmail(params: {
  to: string
  firstName: string
  personalizedIntro: string
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const resend = getResendClient()
  if (!resend) {
    return { ok: false, error: 'RESEND_API_KEY is not configured' }
  }

  const { subject, html, text } = influencerOutreachEmailContent({
    firstName: params.firstName,
    personalizedIntro: params.personalizedIntro,
  })

  const customFrom = process.env.RESEND_OUTREACH_FROM?.trim()
  const baseFrom = getResendFromAddress()
  const emailMatch = baseFrom.match(/<([^>]+)>/)
  const fromEmail = emailMatch?.[1] ?? baseFrom
  const from = customFrom || `Jessica Miller <${fromEmail}>`

  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject,
    html,
    text,
    replyTo: process.env.RESEND_OUTREACH_REPLY_TO?.trim() || undefined,
  })

  if (error) {
    console.error('Resend influencer outreach failed:', error)
    return { ok: false, error: error.message || 'Failed to send email' }
  }

  return { ok: true, id: data?.id ?? '' }
}
