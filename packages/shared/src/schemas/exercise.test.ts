import { describe, it, expect } from 'vitest'
import { ExerciseTypeEnum, SkillNodeSchema, ProgressionSchema } from './exercise'

describe('Exercise Schema', () => {
  it('validates ExerciseType enum', () => {
    expect(ExerciseTypeEnum.parse('CALISTHENICS')).toBe('CALISTHENICS')
    expect(ExerciseTypeEnum.parse('WEIGHTLIFTING')).toBe('WEIGHTLIFTING')
    expect(() => ExerciseTypeEnum.parse('INVALID')).toThrow()
  })

  it('validates SkillNode with cross-prerequisites', () => {
    const node = {
      id: 'test-node',
      name: 'Test Node',
      level: 1,
      sets: 3,
      reps: 10,
      description: 'Test description',
      category: 'legs',
      exerciseType: 'WEIGHTLIFTING',
      prerequisites: [],
      crossPrerequisites: [{ exerciseId: 'other-node', metric: '1rm_bw_ratio', threshold: 1.5 }],
    }
    const result = SkillNodeSchema.safeParse(node)
    expect(result.success).toBe(true)
  })

  it('validates discriminated union for progression', () => {
    const calisthenicsProg = {
      type: 'CALISTHENICS',
      currentVariationId: 'pushups',
      mastered: true,
    }
    const weightliftingProg = {
      type: 'WEIGHTLIFTING',
      estimatedOneRepMax: 100,
      volumeLoad: 5000,
      bestWeight: 100,
    }

    expect(ProgressionSchema.safeParse(calisthenicsProg).success).toBe(true)
    expect(ProgressionSchema.safeParse(weightliftingProg).success).toBe(true)
  })
})
