'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import {
  canSaveMorePlan,
  countSavedPlans,
  defaultPlanName,
  FREE_SAVED_PLANS_LIMIT,
  saveRetirementPlan,
  savedPlansLimit,
} from '@/lib/saved-plans'
import { fetchUserPlan, isPaidPlan, type UserPlan } from '@/lib/plan'
import type { AnalyzeRequest, CityResult } from '@/lib/types'

type Props = {
  isOpen: boolean
  onClose: () => void
  quizInput: AnalyzeRequest
  cities: CityResult[]
  maxCities?: number | null
  onAuthRequired: () => void
  onSaved?: () => void
}

export default function SavePlanModal({
  isOpen,
  onClose,
  quizInput,
  cities,
  maxCities = null,
  onAuthRequired,
  onSaved,
}: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [plan, setPlan] = useState<UserPlan>('free')
  const [savedCount, setSavedCount] = useState(0)
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setSuccess(false)
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return

      if (!user) {
        onClose()
        onAuthRequired()
        return
      }

      setLoggedIn(true)
      const [userPlan, count] = await Promise.all([fetchUserPlan(), countSavedPlans()])
      if (cancelled) return
      setPlan(userPlan)
      setSavedCount(count)
      setName(defaultPlanName(count))
    }

    void load()
    return () => { cancelled = true }
  }, [isOpen, onClose, onAuthRequired])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!loggedIn) {
      onAuthRequired()
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (!canSaveMorePlan(plan, savedCount)) {
        throw new Error(
          `Free accounts can save up to ${FREE_SAVED_PLANS_LIMIT} plans. Upgrade to Premium for unlimited saves.`,
        )
      }

      await saveRetirementPlan({
        name,
        quizInput,
        cityResults: cities,
        maxCities,
      })

      setSuccess(true)
      onSaved?.()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save plan')
    } finally {
      setLoading(false)
    }
  }

  const limit = savedPlansLimit(plan)
  const atLimit = limit != null && savedCount >= limit

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            zIndex: 350,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            style={{
              background: '#12121a',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20,
              padding: '28px 24px',
              maxWidth: 400,
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, margin: 0 }}>
                Save this plan
              </h3>
              <button
                type="button"
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: 'rgba(240,237,232,0.45)', fontSize: 18, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {success ? (
              <div>
                <p style={{ color: 'rgba(240,237,232,0.75)', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>
                  &ldquo;{name.trim()}&rdquo; saved with {cities.length} cities.
                </p>
                <Link
                  href="/plans"
                  style={{
                    display: 'inline-block',
                    background: '#c8f05a',
                    color: '#0a0a0f',
                    textDecoration: 'none',
                    padding: '12px 18px',
                    borderRadius: 10,
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  View My Plans
                </Link>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, color: 'rgba(240,237,232,0.5)', marginBottom: 16, lineHeight: 1.5 }}>
                  Store this quiz and your city matches to compare scenarios later.
                  {!isPaidPlan(plan) && (
                    <> Free: {savedCount}/{FREE_SAVED_PLANS_LIMIT} plans used.</>
                  )}
                </p>

                {atLimit && (
                  <div
                    style={{
                      background: 'rgba(240,90,140,0.1)',
                      border: '1px solid rgba(240,90,140,0.3)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      marginBottom: 14,
                      fontSize: 13,
                      color: '#f05a8c',
                    }}
                  >
                    Plan limit reached.{' '}
                    <Link href="/pricing" style={{ color: '#c8f05a' }}>
                      Upgrade to Premium
                    </Link>{' '}
                    for unlimited saves.
                  </div>
                )}

                {error && (
                  <div
                    style={{
                      background: 'rgba(240,90,140,0.1)',
                      border: '1px solid rgba(240,90,140,0.3)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      marginBottom: 14,
                      fontSize: 13,
                      color: '#f05a8c',
                    }}
                  >
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      color: 'rgba(240,237,232,0.45)',
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Plan name
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Budget Option"
                      maxLength={80}
                      required
                      disabled={atLimit}
                      style={{
                        display: 'block',
                        width: '100%',
                        marginTop: 6,
                        background: '#1a1a26',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: '#f0ede8',
                        padding: '12px 14px',
                        borderRadius: 10,
                        fontSize: 15,
                        fontFamily: "'DM Sans', sans-serif",
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={loading || atLimit}
                    style={{
                      width: '100%',
                      marginTop: 16,
                      background: '#c8f05a',
                      color: '#0a0a0f',
                      border: 'none',
                      padding: '14px',
                      borderRadius: 10,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: loading || atLimit ? 'not-allowed' : 'pointer',
                      opacity: loading || atLimit ? 0.6 : 1,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {loading ? 'Saving…' : 'Save plan'}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
