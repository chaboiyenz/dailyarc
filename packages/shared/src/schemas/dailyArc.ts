import { z } from 'zod'

/**
 * DailyArcEntrySchema — Placeholder for Phase 2.
 *
 * This will hold the daily readiness / training-arc data
 * computed from a DailyLog using the PDD formula:
 *   Readiness = (Sleep + Stress + Soreness) / 3 × (100 − Fatigue%)
 *
 * It represents one "arc day" entry tied to a user.
 */
export const DailyArcEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.any(), // Firestore Timestamp
  readinessScore: z.number().min(0).max(10),
  recommendation: z.enum(['REST', 'LIGHT', 'MODERATE', 'INTENSE']).optional(),
  // Raw input data from readiness check
  sleepHours: z.number().min(0).max(12).optional(),
  stressLevel: z.number().min(1).max(10).optional(),
  soreness: z.array(z.string()).optional(),
  createdAt: z.any().optional(), // Firestore Timestamp
})

export type DailyArcEntry = z.infer<typeof DailyArcEntrySchema>
