import { describe, it, expect } from 'vitest'
import {
  CALISTHENICS_TREE,
  getNextProgressions,
  getCurrentExercise,
  isExerciseUnlocked,
  getUnlockedExercises,
  getProgressionPercentage,
} from './tree'

describe('CALISTHENICS_TREE', () => {
  it('should have 8 exercises in the progression', () => {
    expect(CALISTHENICS_TREE).toHaveLength(8)
  })

  it('should have exercises with sequential levels from 1 to 8', () => {
    CALISTHENICS_TREE.forEach((exercise, index) => {
      expect(exercise.level).toBe(index + 1)
    })
  })

  it('should have the first exercise with no prerequisites', () => {
    expect(CALISTHENICS_TREE[0].prerequisites).toHaveLength(0)
  })

  it('should have all other exercises with at least one prerequisite', () => {
    for (let i = 1; i < CALISTHENICS_TREE.length; i++) {
      expect(CALISTHENICS_TREE[i].prerequisites.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('should have valid prerequisite IDs', () => {
    const exerciseIds = CALISTHENICS_TREE.map(ex => ex.id)

    CALISTHENICS_TREE.forEach(exercise => {
      exercise.prerequisites.forEach(prereqId => {
        expect(exerciseIds).toContain(prereqId)
      })
    })
  })
})

describe('getNextProgressions', () => {
  it('should return the first exercise when level is 0', () => {
    // Determine unlocked based on IDs, not level anymore technically, but strictly:
    // If level 0, empty completed list
    const result = getNextProgressions([])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('wall-pu')
  })

  it('should return the second exercise after completing the first', () => {
    const result = getNextProgressions(['wall-pu'])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('incline-pu')
  })

  it('should return multiple options if branching exists', () => {
    // After standard pushups, both diamond and archer should be available
    const result = getNextProgressions(['wall-pu', 'incline-pu', 'knee-pu', 'standard-pu'])
    expect(result.map(r => r.id)).toContain('diamond-pu')
    expect(result.map(r => r.id)).toContain('archer-pu')
  })
})

describe('getCurrentExercise', () => {
  it('should return the first exercise when no exercises are completed', () => {
    const result = getCurrentExercise(0)
    expect(result?.id).toBe('wall-pu')
  })

  it('should return the next exercise after completing 3 exercises', () => {
    const result = getCurrentExercise(3)
    expect(result?.id).toBe('standard-pu')
  })

  it('should return null when all exercises are completed', () => {
    const result = getCurrentExercise(8)
    expect(result).toBeNull()
  })
})

describe('isExerciseUnlocked', () => {
  it('should unlock the first exercise with no completed exercises', () => {
    const result = isExerciseUnlocked('wall-pu', [])
    expect(result).toBe(true)
  })

  it('should unlock the second exercise after completing the first', () => {
    const result = isExerciseUnlocked('incline-pu', ['wall-pu'])
    expect(result).toBe(true)
  })

  it('should NOT unlock the third exercise if only first is completed', () => {
    const result = isExerciseUnlocked('knee-pu', ['wall-pu'])
    expect(result).toBe(false)
  })

  it('should unlock standard pushups after completing first 3 exercises', () => {
    const result = isExerciseUnlocked('standard-pu', ['wall-pu', 'incline-pu', 'knee-pu'])
    expect(result).toBe(true)
  })

  it('should NOT unlock diamond pushups if standard is not completed', () => {
    const result = isExerciseUnlocked('diamond-pu', ['wall-pu', 'incline-pu', 'knee-pu'])
    expect(result).toBe(false)
  })

  it('should unlock diamond pushups only after completing standard', () => {
    const result = isExerciseUnlocked('diamond-pu', [
      'wall-pu',
      'incline-pu',
      'knee-pu',
      'standard-pu',
    ])
    expect(result).toBe(true)
  })

  it('should NOT unlock one-arm pushup without completing all prerequisites', () => {
    const result = isExerciseUnlocked('one-arm-pu', [
      'wall-pu',
      'incline-pu',
      'knee-pu',
      'standard-pu',
      'diamond-pu',
      'archer-pu',
      // Missing pseudo-planche
    ])
    expect(result).toBe(false)
  })

  it('should unlock one-arm pushup after completing all 7 previous exercises', () => {
    const result = isExerciseUnlocked('one-arm-pu', [
      'wall-pu',
      'incline-pu',
      'knee-pu',
      'standard-pu',
      'diamond-pu',
      'archer-pu',
      'pseudo-planche',
    ])
    expect(result).toBe(true)
  })

  it('should return false for non-existent exercise ID', () => {
    const result = isExerciseUnlocked('fake-exercise', ['wall-pu'])
    expect(result).toBe(false)
  })
})

describe('getUnlockedExercises', () => {
  it('should return only the first exercise when nothing is completed', () => {
    const result = getUnlockedExercises([])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('wall-pu')
  })

  it('should return first two exercises after completing the first', () => {
    const result = getUnlockedExercises(['wall-pu'])
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('wall-pu')
    expect(result[1].id).toBe('incline-pu')
  })

  it('should return first 4 exercises after completing first 3', () => {
    const result = getUnlockedExercises(['wall-pu', 'incline-pu', 'knee-pu'])
    expect(result).toHaveLength(4)
    expect(result.map(ex => ex.id)).toEqual(['wall-pu', 'incline-pu', 'knee-pu', 'standard-pu'])
  })

  it('should return all 8 exercises after completing all', () => {
    const result = getUnlockedExercises([
      'wall-pu',
      'incline-pu',
      'knee-pu',
      'standard-pu',
      'diamond-pu',
      'archer-pu',
      'pseudo-planche',
      'one-arm-pu',
    ])
    expect(result).toHaveLength(8)
  })
})

describe('getProgressionPercentage', () => {
  it('should return 0% when no exercises are completed', () => {
    const result = getProgressionPercentage(0)
    expect(result).toBe(0)
  })

  it('should return 13% when 1 exercise is completed', () => {
    const result = getProgressionPercentage(1)
    expect(result).toBe(13) // 1/8 * 100 = 12.5, rounded to 13
  })

  it('should return 38% when 3 exercises are completed', () => {
    const result = getProgressionPercentage(3)
    expect(result).toBe(38) // 3/8 * 100 = 37.5, rounded to 38
  })

  it('should return 50% when 4 exercises are completed', () => {
    const result = getProgressionPercentage(4)
    expect(result).toBe(50)
  })

  it('should return 100% when all exercises are completed', () => {
    const result = getProgressionPercentage(8)
    expect(result).toBe(100)
  })

  it('should handle beyond 100% gracefully', () => {
    const result = getProgressionPercentage(10)
    expect(result).toBeGreaterThan(100)
  })
})

describe('TDD Requirement: Diamond Pushups unlock logic', () => {
  it('should suggest Diamond Pushups only after Standard Pushups mastery', () => {
    // As specified in Phase 3 TDD requirements
    const withoutStandard = isExerciseUnlocked('diamond-pu', ['wall-pu', 'incline-pu', 'knee-pu'])
    expect(withoutStandard).toBe(false)

    const withStandard = isExerciseUnlocked('diamond-pu', [
      'wall-pu',
      'incline-pu',
      'knee-pu',
      'standard-pu',
    ])
    expect(withStandard).toBe(true)
  })
})
