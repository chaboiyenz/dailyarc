import { WorkoutSet } from '../schemas/workout'

/**
 * Calculates the total volume (tonnage) of a workout session.
 * Volume = sum(reps * weight) for all sets.
 * If weight is missing, it counts as 0 for tonnage purposes (bodyweight only).
 */
export function calculateVolume(sets: WorkoutSet[]): number {
  return sets.reduce((total, set) => {
    const weight = set.weight || 0
    return total + set.reps * weight
  }, 0)
}

/**
 * Convenience function to calculate volume from raw numbers.
 */
export function calculateVolumeFromArgs(reps: number, weight: number): number {
  return reps * weight
}

/**
 * Calculates Relative Strength (Strength-to-Weight Ratio).
 * PDD Formula: 1RM / Bodyweight
 */
export function calculateRelativeStrength(oneRepMax: number, bodyWeight: number): number {
  if (bodyWeight === 0) return 0
  return Number((oneRepMax / bodyWeight).toFixed(2))
}

/**
 * Estimates 1 Rep Max using the Epley Formula.
 * 1RM = Weight * (1 + Reps / 30)
 *
 * Note: Epley is most accurate for reps between 6 and 15.
 * For very low reps (1-5), it might overestimate slightly vs Brzycki.
 * For high reps (>15), reliability drops.
 */
export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  if (reps === 0) return 0
  if (weight === 0) return 0 // Can't estimate 1RM from bodyweight reps purely with this formula

  return Math.round(weight * (1 + reps / 30))
}
