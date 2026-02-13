import { z } from 'zod'

/**
 * ReadinessInputSchema — Phase 2 Readiness Check
 *
 * Validates the four biometric metrics collected from the daily
 * readiness check. Each metric is on a 1-5 scale:
 *   1 = worst / 5 = best
 *
 * The average of these four values is fed into the Readiness Factor
 * formula defined in the PDD (Epic 1).
 */
export const ReadinessInputSchema = z.object({
  sleep: z.number().min(1).max(5).describe('Sleep quality: 1 = terrible, 5 = excellent'),
  soreness: z.number().min(1).max(5).describe('Muscle soreness: 1 = extreme, 5 = none'),
  stress: z.number().min(1).max(5).describe('Stress level: 1 = very high, 5 = very low'),
  energy: z.number().min(1).max(5).describe('Energy level: 1 = exhausted, 5 = fully charged'),
})

export type ReadinessInput = z.infer<typeof ReadinessInputSchema>

/**
 * ReadinessFormSchema — Extended schema for the form with optional bioMetrics
 * Used for form validation with react-hook-form
 */
export const ReadinessFormSchema = z.object({
  sleep: z.number().min(1).max(5),
  soreness: z.number().min(1).max(5),
  stress: z.number().min(1).max(5),
  energy: z.number().min(1).max(5),
  sleepQuality: z.number().min(1).max(100),
  restingHR: z.number().min(40).max(120).optional().nullable(),
})

export type ReadinessForm = z.infer<typeof ReadinessFormSchema>
