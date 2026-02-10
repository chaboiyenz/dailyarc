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
