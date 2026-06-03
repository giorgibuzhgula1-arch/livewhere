export const OUTREACH_EMAIL_SUBJECT = 'Partnership Opportunity'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function influencerOutreachEmailContent(params: {
  firstName: string
  personalizedIntro: string
}): { subject: string; html: string; text: string } {
  const intro = params.personalizedIntro.trim()

  const text = `Hi ${params.firstName},

${intro}

My name is Jessica Miller and I help manage LiveWhere.io.

I wanted to reach out because I think LiveWhere could genuinely be useful for many people in your audience.

LiveWhere helps people discover the best cities and locations based on income, cost of living, taxes, climate, safety, healthcare, and personal lifestyle priorities.

We're currently expanding our affiliate program and would love to explore a partnership with you.

What we offer:
- 40% lifetime recurring commission on $19/month subscription sales
- 40% commission on Lifetime Plan purchases ($149)
- Free Pro access
- Personal affiliate dashboard
- Real-time tracking
- Unique affiliate link
- Automated payouts

You can learn more here: https://livewhere.io/affiliates

If you're interested, I'd be happy to create your affiliate account and send everything you need to get started.

Thank you for your time.

Best regards,
Jessica Miller
LiveWhere.io`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;line-height:1.6;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <p style="margin:0 0 16px;">Hi ${params.firstName},</p>
    <p style="margin:0 0 16px;">${escapeHtml(intro)}</p>
    <p style="margin:0 0 16px;">My name is Jessica Miller and I help manage LiveWhere.io.</p>
    <p style="margin:0 0 16px;">I wanted to reach out because I think LiveWhere could genuinely be useful for many people in your audience.</p>
    <p style="margin:0 0 16px;">LiveWhere helps people discover the best cities and locations based on income, cost of living, taxes, climate, safety, healthcare, and personal lifestyle priorities.</p>
    <p style="margin:0 0 16px;">We're currently expanding our affiliate program and would love to explore a partnership with you.</p>
    <p style="margin:0 0 8px;"><strong>What we offer:</strong></p>
    <ul style="margin:0 0 16px;padding-left:20px;">
      <li>40% lifetime recurring commission on $19/month subscription sales</li>
      <li>40% commission on Lifetime Plan purchases ($149)</li>
      <li>Free Pro access</li>
      <li>Personal affiliate dashboard</li>
      <li>Real-time tracking</li>
      <li>Unique affiliate link</li>
      <li>Automated payouts</li>
    </ul>
    <p style="margin:0 0 16px;">You can learn more here: <a href="https://livewhere.io/affiliates">https://livewhere.io/affiliates</a></p>
    <p style="margin:0 0 16px;">If you're interested, I'd be happy to create your affiliate account and send everything you need to get started.</p>
    <p style="margin:0 0 16px;">Thank you for your time.</p>
    <p style="margin:0;">Best regards,<br>Jessica Miller<br>LiveWhere.io</p>
  </div>
</body>
</html>`

  return { subject: OUTREACH_EMAIL_SUBJECT, html, text }
}
