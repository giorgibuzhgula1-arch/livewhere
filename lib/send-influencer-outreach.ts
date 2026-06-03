import { influencerOutreachEmailContent } from '@/lib/emails/influencer-outreach'
import { getResendClient, getResendFromAddress } from '@/lib/resend'

export async function sendInfluencerOutreachEmail(params: {
  to: string
  channelName: string
  niche: string
  referralUrl: string
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const resend = getResendClient()
  if (!resend) {
    return { ok: false, error: 'RESEND_API_KEY is not configured' }
  }

  const { subject, html, text } = influencerOutreachEmailContent({
    channelName: params.channelName,
    niche: params.niche,
    referralUrl: params.referralUrl,
  })

  const { data, error } = await resend.emails.send({
    from: getResendFromAddress(),
    to: params.to,
    subject,
    html,
    text,
  })

  if (error) {
    console.error('Resend influencer outreach failed:', error)
    return { ok: false, error: error.message || 'Failed to send email' }
  }

  return { ok: true, id: data?.id ?? '' }
}
