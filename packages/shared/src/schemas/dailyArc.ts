import { z } from 'zod'
import { ReadinessInputSchema } from './readiness'

/**
 * DailyArcEntrySchema — Phase 2 Daily Readiness Record
 *
 * Stored in Firestore at /dailyArcs/{userId_YYYY-MM-DD}.
 * The composite ID prevents duplicate entries for the same day.
 *
 * Contains the raw slider inputs (1-5), the calculated RF (0.8-1.2),
 * and the training recommendation derived from the RF.
 */
export const DailyArcEntrySchema = z.object({
  id: z.string().describe('Composite key: userId_YYYY-MM-DD'),
  userId: z.string(),
  date: z.any(), // Firestore Timestamp

  // Raw biometric inputs (1-5 scale each)
  readinessInput: ReadinessInputSchema,

  // Calculated values
  readinessFactor: z.number().min(0.8).max(1.2),
  readinessAverage: z.number().min(1).max(5),
  recommendation: z.enum(['REST', 'LIGHT', 'MODERATE', 'INTENSE']),

  // Optional soreness zone tags
  sorenessZones: z.array(z.string()).default([]),
  notes: z.string().default(''),

  // Manual bio-metrics (optional, from survey)
  bioMetrics: z
    .object({
      sleepQuality: z.number().min(1).max(100).optional(),
      restingHR: z.number().positive().optional(),
      avgHR: z.number().positive().optional(), // Optional metric from wearable or manual entry
      avgHRSource: z.enum(['wearable', 'manual']).optional(), // Indicates source of avgHR data
      bodyBattery: z.number().min(1).max(100).optional(), // Energy level / mapped from energy slider
    })
    .optional(),

  createdAt: z.any().optional(), // Firestore Timestamp
})

export type DailyArcEntry = z.infer<typeof DailyArcEntrySchema>
