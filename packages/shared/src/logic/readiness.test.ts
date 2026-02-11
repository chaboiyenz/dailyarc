import { describe, it, expect } from 'vitest'
import { calculateReadiness, calculateReadinessFactor, calculateDynamicMacros } from './readiness'

describe('calculateReadiness', () => {
  it('calculates perfect score correctly', () => {
    // 10, 10, 10, 0% fatigue -> (30)/3 * 1 = 10
    const result = calculateReadiness({
      sleepQuality: 10,
      stressLevel: 10,
      soreness: 10,
      fatigue: 0,
    })
    expect(result).toBe(10)
  })

  it('calculates worst score correctly', () => {
    // 1, 1, 1, 100% fatigue -> (3)/3 * 0 = 0
    const result = calculateReadiness({
      sleepQuality: 1,
      stressLevel: 1,
      soreness: 1,
      fatigue: 100,
    })
    expect(result).toBe(0)
  })

  it('calculates average score correctly', () => {
    // 5, 5, 5, 50% fatigue -> (15)/3 * 0.5 = 5 * 0.5 = 2.5
    const result = calculateReadiness({
      sleepQuality: 5,
      stressLevel: 5,
      soreness: 5,
      fatigue: 50,
    })
    expect(result).toBe(2.5)
  })

  it('handles mixed values', () => {
    // 8, 6, 4 -> 18/3 = 6
    // Fatigue 20% -> 0.8
    // 6 * 0.8 = 4.8
    const result = calculateReadiness({
      sleepQuality: 8,
      stressLevel: 6,
      soreness: 4,
      fatigue: 20,
    })
    expect(result).toBe(4.8)
  })
})

describe('calculateReadinessFactor', () => {
  it('returns maximum factor (1.2) for perfect score', () => {
    const result = calculateReadinessFactor(10)
    expect(result).toBe(1.2)
  })

  it('returns minimum factor (0.8) for low scores', () => {
    // Score of 6.67 or lower should clamp to 0.8
    const result = calculateReadinessFactor(5)
    expect(result).toBe(0.8)
  })

  it('returns baseline (1.0) for score around 8.33', () => {
    const result = calculateReadinessFactor(8.33)
    expect(result).toBeCloseTo(1.0, 2)
  })

  it('scales linearly between min and max', () => {
    // Score of 9 -> (9/10) * 1.2 = 1.08
    const result = calculateReadinessFactor(9)
    expect(result).toBeCloseTo(1.08, 2)
  })

  it('handles edge case of zero score', () => {
    // 0 -> 0 * 1.2 = 0, clamped to 0.8
    const result = calculateReadinessFactor(0)
    expect(result).toBe(0.8)
  })
})

describe('calculateDynamicMacros', () => {
  const baseMacros = { protein: 180, carbs: 250, fat: 70 }

  it('increases macros by 20% at maximum readiness', () => {
    const result = calculateDynamicMacros(baseMacros, 1.2)
    expect(result).toEqual({
      protein: 216,  // 180 * 1.2
      carbs: 300,    // 250 * 1.2
      fat: 84,       // 70 * 1.2
    })
  })

  it('decreases macros by 20% at minimum readiness', () => {
    const result = calculateDynamicMacros(baseMacros, 0.8)
    expect(result).toEqual({
      protein: 144,  // 180 * 0.8
      carbs: 200,    // 250 * 0.8
      fat: 56,       // 70 * 0.8
    })
  })

  it('maintains baseline macros at factor 1.0', () => {
    const result = calculateDynamicMacros(baseMacros, 1.0)
    expect(result).toEqual({
      protein: 180,
      carbs: 250,
      fat: 70,
    })
  })

  it('rounds to nearest gram', () => {
    // Test with factor that would produce decimal
    const result = calculateDynamicMacros(baseMacros, 1.05)
    expect(result).toEqual({
      protein: 189,  // 180 * 1.05 = 189
      carbs: 263,    // 250 * 1.05 = 262.5 -> 263
      fat: 74,       // 70 * 1.05 = 73.5 -> 74
    })
  })

  it('handles custom macro targets', () => {
    const customMacros = { protein: 200, carbs: 300, fat: 80 }
    const result = calculateDynamicMacros(customMacros, 1.1)
    expect(result).toEqual({
      protein: 220,  // 200 * 1.1
      carbs: 330,    // 300 * 1.1
      fat: 88,       // 80 * 1.1
    })
  })
})
