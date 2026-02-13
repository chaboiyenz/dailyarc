import { describe, it, expect } from 'vitest'
import {
  calculateReadinessFactor,
  calculateReadinessAverage,
  getRecommendation,
  calculateDynamicMacros,
  applyCnsFatigueModifier,
  getIntensityAdjustment,
} from './readiness'
import { ReadinessInputSchema } from '../schemas/readiness'

// =============================================================================
// ReadinessInputSchema validation
// =============================================================================

describe('ReadinessInputSchema', () => {
  it('accepts valid input (all metrics 1-5)', () => {
    const result = ReadinessInputSchema.safeParse({
      sleep: 3,
      soreness: 4,
      stress: 2,
      energy: 5,
    })
    expect(result.success).toBe(true)
  })

  it('rejects values below 1', () => {
    const result = ReadinessInputSchema.safeParse({
      sleep: 0,
      soreness: 3,
      stress: 3,
      energy: 3,
    })
    expect(result.success).toBe(false)
  })

  it('rejects values above 5', () => {
    const result = ReadinessInputSchema.safeParse({
      sleep: 3,
      soreness: 6,
      stress: 3,
      energy: 3,
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing fields', () => {
    const result = ReadinessInputSchema.safeParse({
      sleep: 3,
      soreness: 3,
    })
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// calculateReadinessFactor — The core PDD formula
// Formula: ((averageScore - 1) / 4) * 0.4 + 0.8
// =============================================================================

describe('calculateReadinessFactor', () => {
  it('returns 0.8 (minimum) when all metrics are 1', () => {
    const rf = calculateReadinessFactor({ sleep: 1, soreness: 1, stress: 1, energy: 1 })
    expect(rf).toBe(0.8)
  })

  it('returns 1.2 (maximum) when all metrics are 5', () => {
    const rf = calculateReadinessFactor({ sleep: 5, soreness: 5, stress: 5, energy: 5 })
    expect(rf).toBe(1.2)
  })

  it('returns 1.0 (baseline) when average is 3', () => {
    const rf = calculateReadinessFactor({ sleep: 3, soreness: 3, stress: 3, energy: 3 })
    expect(rf).toBe(1.0)
  })

  it('returns 0.9 when average is 2', () => {
    // avg = 2 → ((2-1)/4)*0.4 + 0.8 = 0.25*0.4 + 0.8 = 0.1 + 0.8 = 0.9
    const rf = calculateReadinessFactor({ sleep: 2, soreness: 2, stress: 2, energy: 2 })
    expect(rf).toBe(0.9)
  })

  it('returns 1.1 when average is 4', () => {
    // avg = 4 → ((4-1)/4)*0.4 + 0.8 = 0.75*0.4 + 0.8 = 0.3 + 0.8 = 1.1
    const rf = calculateReadinessFactor({ sleep: 4, soreness: 4, stress: 4, energy: 4 })
    expect(rf).toBe(1.1)
  })

  it('handles mixed values correctly', () => {
    // avg = (5+1+3+3)/4 = 12/4 = 3 → RF = 1.0
    const rf = calculateReadinessFactor({ sleep: 5, soreness: 1, stress: 3, energy: 3 })
    expect(rf).toBe(1.0)
  })

  it('handles another mixed case', () => {
    // avg = (4+3+2+5)/4 = 14/4 = 3.5 → ((3.5-1)/4)*0.4+0.8 = (2.5/4)*0.4+0.8 = 0.625*0.4+0.8 = 0.25+0.8 = 1.05
    const rf = calculateReadinessFactor({ sleep: 4, soreness: 3, stress: 2, energy: 5 })
    expect(rf).toBe(1.05)
  })
})

// =============================================================================
// calculateReadinessAverage
// =============================================================================

describe('calculateReadinessAverage', () => {
  it('returns 3 for all-3 input', () => {
    expect(calculateReadinessAverage({ sleep: 3, soreness: 3, stress: 3, energy: 3 })).toBe(3)
  })

  it('returns 1 for worst case', () => {
    expect(calculateReadinessAverage({ sleep: 1, soreness: 1, stress: 1, energy: 1 })).toBe(1)
  })

  it('returns 5 for best case', () => {
    expect(calculateReadinessAverage({ sleep: 5, soreness: 5, stress: 5, energy: 5 })).toBe(5)
  })

  it('averages mixed values', () => {
    // (4+3+2+5)/4 = 3.5
    expect(calculateReadinessAverage({ sleep: 4, soreness: 3, stress: 2, energy: 5 })).toBe(3.5)
  })
})

// =============================================================================
// getRecommendation
// =============================================================================

describe('getRecommendation', () => {
  it('returns REST for RF < 0.9', () => {
    expect(getRecommendation(0.8)).toBe('REST')
    expect(getRecommendation(0.85)).toBe('REST')
    expect(getRecommendation(0.89)).toBe('REST')
  })

  it('returns LIGHT for RF 0.9 to 0.99', () => {
    expect(getRecommendation(0.9)).toBe('LIGHT')
    expect(getRecommendation(0.95)).toBe('LIGHT')
    expect(getRecommendation(0.99)).toBe('LIGHT')
  })

  it('returns MODERATE for RF 1.0 to 1.09', () => {
    expect(getRecommendation(1.0)).toBe('MODERATE')
    expect(getRecommendation(1.05)).toBe('MODERATE')
    expect(getRecommendation(1.09)).toBe('MODERATE')
  })

  it('returns INTENSE for RF >= 1.1', () => {
    expect(getRecommendation(1.1)).toBe('INTENSE')
    expect(getRecommendation(1.15)).toBe('INTENSE')
    expect(getRecommendation(1.2)).toBe('INTENSE')
  })
})

// =============================================================================
// calculateDynamicMacros
// =============================================================================

describe('calculateDynamicMacros', () => {
  const baseMacros = { protein: 180, carbs: 250, fat: 70 }

  it('increases macros by 20% at maximum readiness (1.2)', () => {
    const result = calculateDynamicMacros(baseMacros, 1.2)
    expect(result).toEqual({ protein: 216, carbs: 300, fat: 84 })
  })

  it('decreases macros by 20% at minimum readiness (0.8)', () => {
    const result = calculateDynamicMacros(baseMacros, 0.8)
    expect(result).toEqual({ protein: 144, carbs: 200, fat: 56 })
  })

  it('maintains baseline at factor 1.0', () => {
    const result = calculateDynamicMacros(baseMacros, 1.0)
    expect(result).toEqual({ protein: 180, carbs: 250, fat: 70 })
  })

  it('rounds to nearest gram', () => {
    const result = calculateDynamicMacros(baseMacros, 1.05)
    expect(result).toEqual({ protein: 189, carbs: 263, fat: 74 })
  })
})

// =============================================================================
// Phase 2: CNS Fatigue & Intensity Adjustment
// =============================================================================

describe('applyCnsFatigueModifier', () => {
  it('applies CNS fatigue modifier correctly', () => {
    const baseRF = 1.0
    // No fatigue
    expect(applyCnsFatigueModifier(baseRF, [])).toBe(1.0)

    // Single RPE 8 session (-0.03)
    expect(applyCnsFatigueModifier(baseRF, [{ rpe: 8 }])).toBe(0.97)

    // RPE 9 session (-0.05)
    expect(applyCnsFatigueModifier(baseRF, [{ rpe: 9 }])).toBe(0.95)

    // RPE 10 session (-0.08)
    expect(applyCnsFatigueModifier(baseRF, [{ rpe: 10 }])).toBe(0.92)

    // Multiple sessions (RPE 8 + RPE 10 = -0.03 - 0.08 = -0.11)
    expect(applyCnsFatigueModifier(baseRF, [{ rpe: 8 }, { rpe: 10 }])).toBe(0.89)

    // Clamping checks
    expect(applyCnsFatigueModifier(0.8, [{ rpe: 10 }, { rpe: 10 }, { rpe: 10 }])).toBe(0.7) // Floor
  })
})

describe('getIntensityAdjustment', () => {
  it('gets intensity adjustment for weightlifting', () => {
    expect(getIntensityAdjustment(0.7, 'WEIGHTLIFTING').label).toBe('DELOAD')
    expect(getIntensityAdjustment(1.2, 'WEIGHTLIFTING').label).toBe('MAX_EFFORT')
  })

  it('gets intensity adjustment for calisthenics', () => {
    expect(getIntensityAdjustment(0.7, 'CALISTHENICS').levelDelta).toBe(-2)
    expect(getIntensityAdjustment(1.2, 'CALISTHENICS').levelDelta).toBe(1)
  })
})
