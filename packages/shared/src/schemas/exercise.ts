import { z } from 'zod'

// =============================================================================
// Exercise Type System — The foundation for the Hybrid Iron + Arc ecosystem
// =============================================================================

export const ExerciseTypeEnum = z.enum(['CALISTHENICS', 'WEIGHTLIFTING', 'CARDIO'])
export type ExerciseType = z.infer<typeof ExerciseTypeEnum>

export const ExerciseCategoryEnum = z.enum(['push', 'pull', 'legs', 'core', 'iron', 'cardio'])
export type ExerciseCategory = z.infer<typeof ExerciseCategoryEnum>

// -- Progression Schemas (discriminated union on `type`) ----------------------

export const CalisthenicsProgressionSchema = z.object({
  type: z.literal('CALISTHENICS'),
  currentVariationId: z.string(),
  mastered: z.boolean().default(false),
})

export const WeightliftingProgressionSchema = z.object({
  type: z.literal('WEIGHTLIFTING'),
  estimatedOneRepMax: z.number().min(0),
  volumeLoad: z.number().min(0),
  bestWeight: z.number().min(0).default(0),
})

export const CardioProgressionSchema = z.object({
  type: z.literal('CARDIO'),
  bestDistance: z.number().min(0).optional(), // in km
  bestDuration: z.number().min(0).optional(), // in seconds
  bestPace: z.number().min(0).optional(), // seconds per km
})

export const ProgressionSchema = z.discriminatedUnion('type', [
  CalisthenicsProgressionSchema,
  WeightliftingProgressionSchema,
  CardioProgressionSchema,
])

export type Progression = z.infer<typeof ProgressionSchema>

// -- Cross-Modality Prerequisite ----------------------------------------------

export const CrossPrerequisiteSchema = z.object({
  exerciseId: z.string(),
  metric: z.enum(['1rm_bw_ratio', 'volume_load', 'mastered']),
  threshold: z.number(),
})

export type CrossPrerequisite = z.infer<typeof CrossPrerequisiteSchema>

// -- Unified Skill Node -------------------------------------------------------

export const SkillNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().int().min(1),
  sets: z.number().int().min(1),
  reps: z.number().int().min(1),
  description: z.string(),
  category: ExerciseCategoryEnum,
  exerciseType: ExerciseTypeEnum,
  prerequisites: z.array(z.string()),
  crossPrerequisites: z.array(CrossPrerequisiteSchema).default([]),
  // Weightlifting/Calisthenics specific
  targetBwRatio: z.number().optional(),
  // Cardio specific
  distance: z.number().optional(), // Target distance in km
  duration: z.number().optional(), // Target duration in seconds
  zone: z.number().min(1).max(5).optional(), // Target Heart Rate Zone (1-5)
})

export type SkillNode = z.infer<typeof SkillNodeSchema>
