import { influencerOutreachEmailContent } from '@/lib/emails/influencer-outreach'
import { getResendClient, getResendFromAddress } from '@/lib/resend'

type ResendSendError = {
  message?: string
  statusCode?: number
  name?: string
}

function outreachFromAddress(): string {
  const custom = process.env.RESEND_OUTREACH_FROM?.trim()
  if (custom) return custom

  const base = getResendFromAddress()
  const emailMatch = base.match(/<([^>]+)>/)
  const bareMatch = base.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  const email = emailMatch?.[1] ?? (bareMatch ? base : null)

  if (email) {
    return `Jessica from LiveWhere's Partnerships Team <${email}>`
  }

  return base
}

export function formatResendSendError(error: ResendSendError): string {
  const msg = error.message?.trim() || 'Failed to send email'
  if (
    error.statusCode === 403 &&
    /testing emails|verify a domain/i.test(msg)
  ) {
    return `${msg} Add RESEND_FROM_EMAIL in env using your verified domain (e.g. Jessica from LiveWhere's Partnerships Team <hello@livewhere.io>).`
  }
  return msg
}

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

  const from = outreachFromAddress()

  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject,
    html,
    text,
    replyTo: process.env.RESEND_OUTREACH_REPLY_TO?.trim() || undefined,
  })

  if (error) {
    const resendErr = error as ResendSendError
    console.error('Resend influencer outreach failed:', {
      to: params.to,
      from,
      statusCode: resendErr.statusCode,
      name: resendErr.name,
      message: resendErr.message,
    })
    return { ok: false, error: formatResendSendError(resendErr) }
  }

  return { ok: true, id: data?.id ?? '' }
}
