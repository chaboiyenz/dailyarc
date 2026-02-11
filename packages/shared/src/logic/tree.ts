/**
 * The Calisthenics Progression Tree
 *
 * This module defines the exercise progression system used in DailyArc.
 * Each exercise has a level, prerequisites, and mastery criteria.
 */

export interface ExerciseNode {
  /** Unique identifier for the exercise */
  id: string
  /** Display name of the exercise */
  name: string
  /** Progression logical depth (visual layer) */
  level: number
  /** Recommended number of sets */
  sets: number
  /** Recommended number of reps per set */
  reps: number
  /** Brief description of the exercise form */
  description: string
  /** Category/muscle group */
  category: 'push' | 'pull' | 'legs' | 'core'
  /** Prerequisites (exercise IDs that must be mastered first) */
  prerequisites: string[]
}

/**
 * The Push-up Progression Arc
 * Graph-based dependency tree.
 */
export const CALISTHENICS_TREE: ExerciseNode[] = [
  {
    id: 'wall-pu',
    name: 'Wall Pushups',
    level: 1,
    sets: 3,
    reps: 20,
    description: 'Stand arm-length from wall, push away.',
    category: 'push',
    prerequisites: [],
  },
  {
    id: 'incline-pu',
    name: 'Incline Pushups',
    level: 2,
    sets: 3,
    reps: 15,
    description: 'Hands on elevated surface, full ROM.',
    category: 'push',
    prerequisites: ['wall-pu'],
  },
  {
    id: 'knee-pu',
    name: 'Knee Pushups',
    level: 3,
    sets: 3,
    reps: 15,
    description: 'Standard pushup position on knees.',
    category: 'push',
    prerequisites: ['incline-pu'],
  },
  {
    id: 'standard-pu',
    name: 'Standard Pushups',
    level: 4,
    sets: 4,
    reps: 12,
    description: 'Full pushup with strict form.',
    category: 'push',
    prerequisites: ['knee-pu'], // Hard gate
  },
  {
    id: 'diamond-pu',
    name: 'Diamond Pushups',
    level: 5,
    sets: 4,
    reps: 10,
    description: 'Hands together forming a diamond.',
    category: 'push',
    prerequisites: ['standard-pu'], // Must master Standard first
  },
  {
    id: 'archer-pu',
    name: 'Archer Pushups',
    level: 6,
    sets: 3,
    reps: 8,
    description: 'Wide stance, shift weight side to side.',
    category: 'push',
    prerequisites: ['standard-pu'], // Branching path: can be done after Standard
  },
  {
    id: 'pseudo-planche',
    name: 'Pseudo Planche',
    level: 7,
    sets: 3,
    reps: 8,
    description: 'Hands by waist, lean forward.',
    category: 'push',
    prerequisites: ['diamond-pu'],
  },
  {
    id: 'one-arm-pu',
    name: 'One-Arm Pushup',
    level: 8,
    sets: 3,
    reps: 5,
    description: 'Single arm pushup - the pinnacle.',
    category: 'push',
    prerequisites: ['archer-pu', 'pseudo-planche'], // Dual dependency example
  },
]

/**
 * Check if an exercise is unlocked based on user's completed exercises.
 * @param exerciseId - The ID of the exercise to check
 * @param completedExerciseIds - Array of completed exercise IDs
 * @returns True if the exercise is unlocked (prerequisites met)
 */
export function isExerciseUnlocked(exerciseId: string, completedExerciseIds: string[]): boolean {
  const exercise = CALISTHENICS_TREE.find(ex => ex.id === exerciseId)
  if (!exercise) return false

  // If no prerequisites, it's always unlocked
  if (exercise.prerequisites.length === 0) return true

  // Check if all prerequisites are completed
  return exercise.prerequisites.every(prereqId => completedExerciseIds.includes(prereqId))
}

/**
 * Get all unlocked exercises for a user (Available to train)
 * @param completedExerciseIds - Array of completed exercise IDs
 * @returns Array of unlocked exercise nodes
 */
export function getUnlockedExercises(completedExerciseIds: string[]): ExerciseNode[] {
  return CALISTHENICS_TREE.filter(exercise => {
    // If already completed, it's technically "unlocked" but maybe we want "next available"?
    // For now, return everything that is accessible.
    return isExerciseUnlocked(exercise.id, completedExerciseIds)
  })
}

/**
 * Get the "Next Up" exercises (Unlocked but NOT completed)
 * @param completedExerciseIds - Array of completed exercise IDs
 */
export function getNextProgressions(completedExerciseIds: string[]): ExerciseNode[] {
  return CALISTHENICS_TREE.filter(
    ex => !completedExerciseIds.includes(ex.id) && isExerciseUnlocked(ex.id, completedExerciseIds)
  )
}

/**
 * Get the user's current highest level attained
 */
export function getMaxLevel(completedExerciseIds: string[]): number {
  let maxLevel = 0

  completedExerciseIds.forEach(id => {
    const node = CALISTHENICS_TREE.find(n => n.id === id)
    if (node && node.level > maxLevel) {
      maxLevel = node.level
    }
  })

  return maxLevel
}

/**
 * Get the current exercise based on completed level
 * @param completedLevel - Number of completed exercises (0 = none completed)
 * @returns The exercise the user is currently working on
 * @deprecated Use getNextProgressions instead
 */
export function getCurrentExercise(completedLevel: number): ExerciseNode | null {
  // Rough approximation for legacy compatibility
  if (completedLevel >= CALISTHENICS_TREE.length) return null
  return CALISTHENICS_TREE[completedLevel]
}

/**
 * Calculate progression percentage
 * @param completedLevel - Number of completed exercises
 * @returns Percentage of tree completion (0-100)
 */
export function getProgressionPercentage(completedLevel: number): number {
  return Math.round((completedLevel / CALISTHENICS_TREE.length) * 100)
}
