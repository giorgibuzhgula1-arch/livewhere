/** Stripe price IDs — Pro/Blueprint are one-time; Monitor is monthly subscription. */
export const STRIPE_PRICE_PRO_LIFETIME = 'price_1Ts05BD753169kynMsRn144o'
export const STRIPE_PRICE_BLUEPRINT_LIFETIME = 'price_1Tnmm9D753169kynXgWRatgT'
export const STRIPE_PRICE_MONITOR_MONTHLY = 'price_1Tnmp3D753169kyn4dzXG9hq'

/** Pro → Blueprint upgrade (pay difference). */
export const BLUEPRINT_UPGRADE_CENTS = 7_000

export type CheckoutType = 'pro' | 'blueprint' | 'blueprint_upgrade' | 'monitor'

export const BLUEPRINT_MONITOR_TRIAL_DAYS = 365
