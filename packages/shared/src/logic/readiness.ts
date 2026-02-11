import type { DailyLog } from '../schemas/dailyLog'

/**
 * Calculates the Readiness Score based on the PDD formula.
 *
 * Formula: (Sleep + Stress + Soreness) / 3 * (100 - Fatigue%)
 *
 * @param log - The daily log entry containing subjective stats
 * @returns The calculated readiness score (0-100 usually, but depends on inputs)
 */
export function calculateReadiness(
  log: Pick<DailyLog, 'sleepQuality' | 'stressLevel' | 'soreness' | 'fatigue'>
): number {
  const { sleepQuality, stressLevel, soreness, fatigue } = log

  // Average of the 1-10 markers
  const baseScore = (sleepQuality + stressLevel + soreness) / 3

  // Fatigue multiplier (100 - fatigue%)
  // If fatigue is 0, multiplier is 1 (no reduction)
  // If fatigue is 100, multiplier is 0 (total reduction)
  const fatigueMultiplier = (100 - fatigue) / 100

  // Final score
  // Example: (8 + 8 + 8) / 3 = 8
  // Fatigue 20% -> 0.8
  // Result = 6.4 (which might need normalization to 100 scale?
  // The prompt formula implies strictly this.
  // if inputs are 10, 10, 10 and fatigue 0 -> 10.
  // So the score is out of 10.

  const score = baseScore * fatigueMultiplier

  return Number(score.toFixed(2))
}

/**
 * Calculates the readiness factor multiplier based on the readiness score.
 * This factor is used to adjust macro targets and training intensity.
 *
 * Formula: Clamp((readinessScore / 10) * 1.2, 0.8, 1.2)
 * - Score of 10 = 1.2x multiplier (20% increase)
 * - Score of 5 = 0.6x multiplier (clamped to 0.8 = 20% decrease)
 * - Score of 8.33+ = 1.0x multiplier (baseline)
 *
 * @param readinessScore - The calculated readiness score (0-10 scale)
 * @returns Multiplier factor (0.8 - 1.2)
 */
export function calculateReadinessFactor(readinessScore: number): number {
  const factor = (readinessScore / 10) * 1.2
  return Math.max(0.8, Math.min(1.2, factor))
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
