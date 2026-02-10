import { describe, it, expect } from 'vitest'
import { calculateReadiness } from './readiness'

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
