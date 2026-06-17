const PRO_PRICE = 19
const LIFETIME_PRICE = 149
const DEFAULT_COMMISSION_RATE = 0.4

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount)
}

export function affiliateWelcomeEmailContent(params: {
  name: string
  referralUrl: string
  commissionRate?: number
}): { subject: string; html: string; text: string } {
  const firstName = params.name.trim().split(/\s+/)[0] || 'there'
  const rate = params.commissionRate ?? DEFAULT_COMMISSION_RATE
  const ratePercent = Math.round(rate * 100)
  const proCommission = formatUsd(PRO_PRICE * rate)
  const lifetimeCommission = formatUsd(LIFETIME_PRICE * rate)

  const subject = 'Your LiveWhere affiliate link is ready'

  const text = `Hi ${firstName},

Welcome to the LiveWhere affiliate program.

Your unique referral link:
${params.referralUrl}

Commission: ${ratePercent}% on every paid signup attributed to your link.

What you can earn (examples):
- Pro plan ($${PRO_PRICE}/mo): ${proCommission} per conversion
- Lifetime plan ($${LIFETIME_PRICE} one-time): ${lifetimeCommission} per conversion

How it works:
1. Share your link on social, in your newsletter, or with your audience.
2. When someone visits LiveWhere through your link and later purchases, you earn ${ratePercent}%.
3. We track clicks and conversions automatically — no coupon codes needed.

Tips:
- Use your link in bio posts, YouTube descriptions, and email footers.
- Mention LiveWhere helps people find the best cities for remote work and retiree life.

Questions? Reply to this email — we're happy to help.

— The LiveWhere team
https://livewhere.io`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:system-ui,-apple-system,sans-serif;color:#f0ede8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#12121a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c8f05a;font-weight:600;">LiveWhere Affiliates</p>
          <h1 style="margin:0 0 20px;font-size:24px;font-weight:700;color:#f0ede8;">Hi ${firstName}, you're in</h1>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:rgba(240,237,232,0.75);">
            Share your personal link. When someone signs up through it and purchases, you earn <strong style="color:#c8f05a;">${ratePercent}% commission</strong>.
          </p>
          <p style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:rgba(240,237,232,0.45);">Your referral link</p>
          <p style="margin:0 0 28px;padding:14px 16px;background:rgba(200,240,90,0.08);border:1px solid rgba(200,240,90,0.25);border-radius:10px;font-size:14px;word-break:break-all;">
            <a href="${params.referralUrl}" style="color:#c8f05a;text-decoration:none;">${params.referralUrl}</a>
          </p>
          <h2 style="margin:0 0 12px;font-size:16px;color:#f0ede8;">What you can earn</h2>
          <ul style="margin:0 0 24px;padding-left:20px;font-size:14px;line-height:1.7;color:rgba(240,237,232,0.75);">
            <li>Pro ($${PRO_PRICE}/mo) → <strong style="color:#f0ede8;">${proCommission}</strong> per sale</li>
            <li>Lifetime ($${LIFETIME_PRICE}) → <strong style="color:#f0ede8;">${lifetimeCommission}</strong> per sale</li>
          </ul>
          <h2 style="margin:0 0 12px;font-size:16px;color:#f0ede8;">How it works</h2>
          <ol style="margin:0 0 28px;padding-left:20px;font-size:14px;line-height:1.7;color:rgba(240,237,232,0.75);">
            <li>Share your link anywhere your audience lives.</li>
            <li>We save your code when they visit — no manual tracking.</li>
            <li>You earn ${ratePercent}% when they purchase Pro or Lifetime.</li>
          </ol>
          <p style="margin:0;font-size:13px;color:rgba(240,237,232,0.45);">Questions? Reply to this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  return { subject, html, text }
}
