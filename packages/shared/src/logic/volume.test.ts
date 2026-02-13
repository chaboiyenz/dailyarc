import { describe, it, expect } from 'vitest'
import { calculateVolume, calculateRelativeStrength, estimate1RM } from './volume'

describe('Volume Logic', () => {
  it('calculates total volume correctly', () => {
    const sets: any[] = [
      { reps: 5, weight: 100 },
      { reps: 5, weight: 100 },
      { reps: 5, weight: 100 },
    ]
    expect(calculateVolume(sets)).toBe(1500)
  })

  it('calculates volume as 0 for bodyweight exercises (no weight)', () => {
    const sets: any[] = [{ reps: 10 }, { reps: 10 }]
    expect(calculateVolume(sets)).toBe(0)
  })

  it('handles mixed weighted and bodyweight sets', () => {
    const sets: any[] = [
      { reps: 5, weight: 20 },
      { reps: 10 }, // 0 weight
    ]
    expect(calculateVolume(sets)).toBe(100)
  })

  it('calculates relative strength', () => {
    expect(calculateRelativeStrength(150, 75)).toBe(2.0)
    expect(calculateRelativeStrength(100, 100)).toBe(1.0)
    expect(calculateRelativeStrength(0, 75)).toBe(0)
    expect(calculateRelativeStrength(100, 0)).toBe(0) // Avoid Infinity
  })

  it('estimates 1RM using Epley formula', () => {
    // 100kg for 1 rep = 100
    expect(estimate1RM(100, 1)).toBe(100)
    // 100kg for 0 reps = 0
    expect(estimate1RM(100, 0)).toBe(0)
    // 100kg for 30 reps = 200 (100 * (1 + 1))
    expect(estimate1RM(100, 30)).toBe(200)
    // 100kg for 15 reps = 150 (100 * 1.5)
    expect(estimate1RM(100, 15)).toBe(150)
  })
})
