import { describe, it, expect } from 'vitest'
import { SUBSCRIPTION_TIERS, getAnnualSavings, LEGACY_TIER_MAP } from '@/lib/stripe'

describe('SUBSCRIPTION_TIERS', () => {
  it('should have 3 tiers: free, defender, coach', () => {
    expect(SUBSCRIPTION_TIERS).toHaveLength(3)
    expect(SUBSCRIPTION_TIERS.map(t => t.id)).toEqual(['free', 'defender', 'coach'])
  })

  it('free tier should have 0 price', () => {
    const free = SUBSCRIPTION_TIERS.find(t => t.id === 'free')!
    expect(free.monthlyPrice).toBe(0)
    expect(free.annualPrice).toBe(0)
  })

  it('defender tier should have Stripe price IDs', () => {
    const defender = SUBSCRIPTION_TIERS.find(t => t.id === 'defender')!
    expect(defender.stripePriceIdMonthly).toMatch(/^price_/)
    expect(defender.stripePriceIdAnnual).toMatch(/^price_/)
  })

  it('coach tier should have Stripe price IDs', () => {
    const coach = SUBSCRIPTION_TIERS.find(t => t.id === 'coach')!
    expect(coach.stripePriceIdMonthly).toMatch(/^price_/)
    expect(coach.stripePriceIdAnnual).toMatch(/^price_/)
  })
})

describe('getAnnualSavings', () => {
  it('should return 0 for free tier', () => {
    const free = SUBSCRIPTION_TIERS.find(t => t.id === 'free')!
    expect(getAnnualSavings(free)).toBe(0)
  })

  it('should return 2 months savings for defender ($29 * 12 - $290 = $58)', () => {
    const defender = SUBSCRIPTION_TIERS.find(t => t.id === 'defender')!
    expect(getAnnualSavings(defender)).toBe(58)
  })

  it('should return 2 months savings for coach ($149 * 12 - $1490 = $298)', () => {
    const coach = SUBSCRIPTION_TIERS.find(t => t.id === 'coach')!
    expect(getAnnualSavings(coach)).toBe(298)
  })
})

describe('LEGACY_TIER_MAP', () => {
  it('should map explorer to free', () => {
    expect(LEGACY_TIER_MAP['explorer']).toBe('free')
  })

  it('should map navigator to defender', () => {
    expect(LEGACY_TIER_MAP['navigator']).toBe('defender')
  })

  it('should map strategist to coach', () => {
    expect(LEGACY_TIER_MAP['strategist']).toBe('coach')
  })
})
