import type { ReadinessInput } from '../schemas/readiness'
import { ExerciseType } from '../schemas/exercise'

// =============================================================================
// Phase 2: Readiness Factor (RF) — The Bio-Feedback Engine
// =============================================================================
//
// All four metrics are on a 1-5 scale (1 = worst, 5 = best).
// The RF maps the average to [0.8, 1.2] using a linear formula:
//
//   RF = ((averageScore - 1) / 4) * 0.4 + 0.8
//
// This means:
//   avg = 1  →  RF = 0.80  (20% reduction — deload / rest)
//   avg = 3  →  RF = 1.00  (baseline — standard session)
//   avg = 5  →  RF = 1.20  (20% boost — go hard)
// =============================================================================

/**
 * Calculates the Readiness Factor (RF) from raw slider inputs.
 *
 * This is the PRIMARY Phase 2 pure function. The UI calls this
 * on every slider change so the user sees the multiplier "dancing"
 * in real time before they hit submit.
 *
 * Formula: ((averageScore - 1) / 4) * 0.4 + 0.8
 *
 * @param input - The four biometric metrics, each 1-5
 * @returns Readiness Factor between 0.8 and 1.2
 */
export function calculateReadinessFactor(input: ReadinessInput): number {
  const avg = (input.sleep + input.soreness + input.stress + input.energy) / 4
  const rf = ((avg - 1) / 4) * 0.4 + 0.8
  return Number(rf.toFixed(2))
}

/**
 * Returns the average of the four readiness metrics.
 * Useful for displaying a single "readiness score" on 1-5.
 */
export function calculateReadinessAverage(input: ReadinessInput): number {
  const avg = (input.sleep + input.soreness + input.stress + input.energy) / 4
  return Number(avg.toFixed(2))
}

/**
 * Maps the Readiness Factor to a training recommendation.
 *
 *   RF < 0.90  → REST
 *   RF < 1.00  → LIGHT
 *   RF < 1.10  → MODERATE
 *   RF >= 1.10 → INTENSE
 */
export function getRecommendation(rf: number): 'REST' | 'LIGHT' | 'MODERATE' | 'INTENSE' {
  if (rf < 0.9) return 'REST'
  if (rf < 1.0) return 'LIGHT'
  if (rf < 1.1) return 'MODERATE'
  return 'INTENSE'
}

/**
 * Calculates dynamic macro targets adjusted by readiness factor.
 * Higher readiness = higher macro targets, lower readiness = lower targets.
 *
 * @param baseMacros - The baseline macro targets (protein, carbs, fat in grams)
 * @param readinessFactor - The readiness multiplier (0.8 - 1.2)
 * @returns Adjusted macro targets rounded to nearest gram
 */
export function calculateDynamicMacros(
  baseMacros: { protein: number; carbs: number; fat: number },
  readinessFactor: number
): { protein: number; carbs: number; fat: number } {
  return {
    protein: Math.round(baseMacros.protein * readinessFactor),
    carbs: Math.round(baseMacros.carbs * readinessFactor),
    fat: Math.round(baseMacros.fat * readinessFactor),
  }
}

/**
 * Applies CNS fatigue penalty based on heavy sessions in the last 72 hours.
 * - RPE 8+: -0.03
 * - RPE 9+: -0.05 (cumulative)
 * - RPE 10: -0.08 (cumulative)
 *
 * @param baseRF - The calculated readiness factor from biometrics
 * @param recentSessions - Array of sessions from last 72h with their top RPE
 */
export function applyCnsFatigueModifier(baseRF: number, recentSessions: { rpe: number }[]): number {
  let penalty = 0

  recentSessions.forEach(session => {
    if (session.rpe >= 8) penalty += 0.03
    if (session.rpe >= 9) penalty += 0.02
    if (session.rpe >= 10) penalty += 0.03
  })

  // Apply penalty and clamp between 0.70 and 1.20
  // (Base RF is 0.8-1.2, but fatigue can drag it lower)
  const finalRF = Math.max(0.7, Math.min(1.2, baseRF - penalty))
  return Number(finalRF.toFixed(2))
}

export type IntensityAdjustment = {
  percentage?: number // For WEIGHTLIFTING (e.g., 85% of 1RM)
  levelDelta?: number // For CALISTHENICS (e.g., -1 level)
  label: 'DELOAD' | 'LIGHT' | 'MODERATE' | 'INTENSE' | 'MAX_EFFORT'
}

/**
 * Returns specific training guidance based on Readiness Factor and Mode.
 */
export function getIntensityAdjustment(
  rf: number,
  exerciseType: ExerciseType
): IntensityAdjustment {
  switch (exerciseType) {
    case 'WEIGHTLIFTING':
      if (rf < 0.8) return { percentage: 60, levelDelta: -2, label: 'DELOAD' }
      if (rf < 0.95) return { percentage: 75, levelDelta: -1, label: 'LIGHT' }
      if (rf < 1.05) return { percentage: 85, levelDelta: 0, label: 'MODERATE' }
      if (rf < 1.15) return { percentage: 92, levelDelta: 0, label: 'INTENSE' }
      return { percentage: 100, levelDelta: +1, label: 'MAX_EFFORT' }

    case 'CARDIO':
      if (rf < 0.8) return { levelDelta: 0, label: 'DELOAD' }
      if (rf < 0.95) return { levelDelta: 0, label: 'LIGHT' }
      if (rf < 1.05) return { levelDelta: 0, label: 'MODERATE' }
      if (rf < 1.15) return { levelDelta: 0, label: 'INTENSE' }
      return { levelDelta: 0, label: 'MAX_EFFORT' }

    default: // CALISTHENICS
      if (rf < 0.8) return { levelDelta: -2, label: 'DELOAD' }
      if (rf < 0.95) return { levelDelta: -1, label: 'LIGHT' }
      if (rf < 1.05) return { levelDelta: 0, label: 'MODERATE' }
      if (rf < 1.15) return { levelDelta: 0, label: 'INTENSE' }
      return { levelDelta: +1, label: 'MAX_EFFORT' }
  }
}
