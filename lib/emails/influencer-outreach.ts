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

This could outperform your last sponsor.

We built LiveWhere — a tool with 18,000+ users that shows the best cities to live based on income and cost of living.

Video idea:
"Where should you live with $3,000/month?"
or
"Best countries to live on $80K salary"

Simple, highly engaging, easy to test.

We offer 40% revenue share + discounted pricing for your audience. If it hits, it can generate more than a typical brand deal.

Want access? Click here: https://livewhere.io/?ref=collab

— Jessica
Partnerships @ LiveWhere`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;line-height:1.6;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <p style="margin:0 0 16px;">Hi ${params.firstName},</p>
    <p style="margin:0 0 16px;">${escapeHtml(intro)}</p>
    <p style="margin:0 0 16px;">This could outperform your last sponsor.</p>
    <p style="margin:0 0 16px;">We built LiveWhere — a tool with 18,000+ users that shows the best cities to live based on income and cost of living.</p>
    <p style="margin:0 0 8px;">Video idea:</p>
    <p style="margin:0 0 4px;">&ldquo;Where should you live with $3,000/month?&rdquo;</p>
    <p style="margin:0 0 16px;">or<br>&ldquo;Best countries to live on $80K salary&rdquo;</p>
    <p style="margin:0 0 16px;">Simple, highly engaging, easy to test.</p>
    <p style="margin:0 0 24px;">We offer 40% revenue share + discounted pricing for your audience. If it hits, it can generate more than a typical brand deal.</p>
    <p style="margin:0 0 24px;">
      <a href="https://livewhere.io/?ref=collab" style="display:inline-block;padding:12px 20px;background:#1a1a1a;color:#ffffff;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600;">Want access? Click here</a>
    </p>
    <p style="margin:0;">— Jessica<br>Partnerships @ LiveWhere</p>
  </div>
</body>
</html>`

  return { subject: OUTREACH_EMAIL_SUBJECT, html, text }
}
