const body = {
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

const port = process.env.PORT || '3001'
const res = await fetch(`http://localhost:${port}/api/analyze`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

console.log('HTTP', res.status)
const text = await res.text()
console.log(text)

if (text.includes('"type":"error"')) {
  console.error('FAIL: analyze returned error event')
  process.exit(1)
}
if (!text.includes('"type":"done"')) {
  console.error('FAIL: analyze did not return done event')
  process.exit(1)
}
console.log('PASS: recommendations generated successfully')
