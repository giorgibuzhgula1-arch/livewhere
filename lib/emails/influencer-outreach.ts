const PRO_PRICE = 19
const LIFETIME_PRICE = 149
const COMMISSION_RATE = 0.4

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}

export const INFLUENCER_OUTREACH_SUBJECT =
  'Partnership opportunity — LiveWhere.io (40% commission)'

export function influencerOutreachEmailContent(params: {
  channelName: string
  niche: string
  referralUrl: string
}): { subject: string; html: string; text: string } {
  const ratePercent = Math.round(COMMISSION_RATE * 100)
  const proCommission = formatUsd(PRO_PRICE * COMMISSION_RATE)
  const lifetimeCommission = formatUsd(LIFETIME_PRICE * COMMISSION_RATE)
  const nicheLabel = params.niche.trim() || 'your audience'

  const text = `Hi ${params.channelName} team,

I've been following channels in the ${nicheLabel} space and thought ${params.channelName} would be a great fit for a partnership with LiveWhere.

LiveWhere.io helps remote workers and digital nomads discover the best cities for their budget — with AI-powered cost-of-living analysis, visa difficulty, tax insights, and personalized city rankings.

We'd love to partner with you on an affiliate basis:

• ${ratePercent}% commission on every paid signup from your link
• Pro plan ($${PRO_PRICE}/mo): ${proCommission} per conversion
• Lifetime plan ($${LIFETIME_PRICE}): ${lifetimeCommission} per conversion
• 30-day referral tracking — no coupon codes needed

Your unique partner link:
${params.referralUrl}

If this sounds interesting, share the link in a video description, pinned comment, or newsletter — we handle tracking and payouts automatically.

Happy to answer any questions. Just reply to this email.

Best,
The LiveWhere team
https://livewhere.io`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:system-ui,-apple-system,sans-serif;color:#f0ede8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#12121a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c8f05a;font-weight:600;">Partnership</p>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f0ede8;">Hi ${params.channelName} team</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.65;color:rgba(240,237,232,0.75);">
            I've been following creators in the <strong style="color:#f0ede8;">${nicheLabel}</strong> niche and think your channel is a strong match for LiveWhere.io — we help remote workers and digital nomads find the best cities for their budget with AI-powered rankings, visa scores, and real cost-of-living data.
          </p>
          <h2 style="margin:0 0 12px;font-size:16px;color:#f0ede8;">${ratePercent}% affiliate commission</h2>
          <ul style="margin:0 0 20px;padding-left:20px;font-size:14px;line-height:1.7;color:rgba(240,237,232,0.75);">
            <li>Pro ($${PRO_PRICE}/mo) → <strong style="color:#f0ede8;">${proCommission}</strong> per sale</li>
            <li>Lifetime ($${LIFETIME_PRICE}) → <strong style="color:#f0ede8;">${lifetimeCommission}</strong> per sale</li>
            <li>30-day referral tracking — share one link, we handle the rest</li>
          </ul>
          <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:rgba(240,237,232,0.45);">Your partner link</p>
          <p style="margin:0 0 24px;padding:14px 16px;background:rgba(200,240,90,0.08);border:1px solid rgba(200,240,90,0.25);border-radius:10px;font-size:14px;word-break:break-all;">
            <a href="${params.referralUrl}" style="color:#c8f05a;text-decoration:none;">${params.referralUrl}</a>
          </p>
          <p style="margin:0;font-size:14px;line-height:1.6;color:rgba(240,237,232,0.55);">Reply if you'd like more details — we'd love to collaborate.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject: INFLUENCER_OUTREACH_SUBJECT, html, text }
}
