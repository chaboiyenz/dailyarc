import { z } from 'zod'
import { ExerciseTypeEnum } from './exercise'

/**
 * Timestamp type - represents a Firestore Timestamp
 * Using z.any() to keep the shared package Firebase-agnostic
 */
export type FirestoreTimestamp = {
  seconds: number
  nanoseconds: number
}

/**
 * Schema for a single set within a workout
 */
export const WorkoutSetSchema = z.object({
  /** Number of reps completed */
  reps: z.number().int().min(0),
  /** Rate of Perceived Exertion (1-10 scale) */
  rpe: z.number().min(1).max(10),
  /** Optional notes for this specific set */
  notes: z.string().optional(),
  /** Weight used in kg (optional, for weighted calisthenics or lifting) */
  weight: z.number().min(0).optional(),
  /** Cardio: Distance in km */
  distance: z.number().min(0).optional(),
  /** Cardio: Duration in seconds */
  duration: z.number().min(0).optional(),
  /** Cardio: Heart Rate Zone (1-5) */
  zone: z.number().min(1).max(5).optional(),
})

export type WorkoutSet = z.infer<typeof WorkoutSetSchema>

/**
 * Schema for a complete workout session
 * Document ID format: {userId}_{YYYY-MM-DD}_{timestamp}
 */
export const WorkoutSessionSchema = z.object({
  /** Document ID (for convenience) */
  id: z.string(),
  /** User ID who performed the workout */
  userId: z.string(),
  /** Exercise ID from the tech tree */
  exerciseId: z.string(),
  /** Exercise name (denormalized for easier display) */
  exerciseName: z.string(),
  /** Exercise level in the progression tree */
  level: z.number().int().min(1),
  /** Date of the workout session (Firestore Timestamp) */
  date: z.any(),
  /** Array of sets performed */
  sets: z.array(WorkoutSetSchema).min(1),
  /** Type of exercise (CALISTHENICS vs WEIGHTLIFTING) */
  exerciseType: ExerciseTypeEnum.default('CALISTHENICS'),
  /** Total volume (sum of all reps) */
  totalReps: z.number().int().min(0),
  /** Total volume load (sets * reps * weight) */
  totalVolume: z.number().min(0).default(0),
  /** Cardio: Total Distance (km) */
  totalDistance: z.number().min(0).default(0),
  /** Cardio: Total Duration (seconds) */
  totalDuration: z.number().min(0).default(0),
  /** Average RPE across all sets */
  avgRpe: z.number().min(1).max(10),
  /** Whether this session resulted in mastery/completion */
  completed: z.boolean().default(false),
  /** Optional video URL from Firebase Storage */
  videoUrl: z.string().url().optional(),
  /** Timestamp when created (Firestore Timestamp) */
  createdAt: z.any(),
  /** Timestamp when last updated (Firestore Timestamp) */
  updatedAt: z.any(),
})

export type WorkoutSession = z.infer<typeof WorkoutSessionSchema>

/**
 * Input schema for creating a new workout session (before Firestore fields)
 */
export const CreateWorkoutInputSchema = z.object({
  exerciseId: z.string(),
  exerciseName: z.string(),
  level: z.number().int().min(1),

  sets: z.array(WorkoutSetSchema).min(1),
  totalVolume: z.number().min(0).default(0),
  totalDistance: z.number().min(0).default(0),
  totalDuration: z.number().min(0).default(0),
  exerciseType: ExerciseTypeEnum.default('CALISTHENICS'),
})

export type CreateWorkoutInput = z.infer<typeof CreateWorkoutInputSchema>
