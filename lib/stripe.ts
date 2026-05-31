import Stripe from 'stripe'

// Trim to defend against trailing spaces/newlines accidentally pasted into the
// Vercel env value, which otherwise cause an opaque "Invalid API Key" at call time.
const secretKey = process.env.STRIPE_SECRET_KEY?.trim()

if (!secretKey) {
  console.error('STRIPE_SECRET_KEY is missing or empty')
}

export const stripe = new Stripe(secretKey ?? '', {
  apiVersion: '2024-06-20',
})
