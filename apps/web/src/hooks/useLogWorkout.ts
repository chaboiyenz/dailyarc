import { useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  WorkoutSessionSchema,
  type WorkoutSession,
  type CreateWorkoutInput,
} from '@repo/shared'

interface LogWorkoutParams {
  userId: string
  input: CreateWorkoutInput
}

/**
 * Hook to log a completed workout session to Firestore
 * Creates a new document in the /workouts collection
 */
export function useLogWorkout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, input }: LogWorkoutParams): Promise<WorkoutSession> => {
      // Calculate derived values
      const totalReps = input.sets.reduce((sum, set) => sum + set.reps, 0)
      const avgRpe = input.sets.reduce((sum, set) => sum + set.rpe, 0) / input.sets.length

      // Generate unique document ID: {userId}_{YYYY-MM-DD}_{timestamp}
      const now = new Date()
      const dateString = now.toISOString().split('T')[0] // YYYY-MM-DD
      const timestamp = now.getTime()
      const docId = `${userId}_${dateString}_${timestamp}`

      // Build the workout session document
      const workoutData: Omit<WorkoutSession, 'id'> = {
        userId,
        exerciseId: input.exerciseId,
        exerciseName: input.exerciseName,
        level: input.level,
        date: Timestamp.fromDate(now),
        sets: input.sets,
        totalReps,
        avgRpe: Math.round(avgRpe * 10) / 10, // Round to 1 decimal
        completed: false, // User can manually mark as mastered later
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      }

      // Validate with Zod schema
      const validatedData = WorkoutSessionSchema.parse({
        ...workoutData,
        id: docId,
      })

      // Write to Firestore
      const workoutRef = doc(db, 'workouts', docId)
      await setDoc(workoutRef, {
        ...validatedData,
        id: docId,
      })

      return validatedData
    },
    onSuccess: (data) => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['workouts'] })
      queryClient.invalidateQueries({ queryKey: ['userStats'] })

      console.log('✅ Workout logged successfully:', data.id)
    },
    onError: (error) => {
      console.error('❌ Failed to log workout:', error)
    },
  })
}

/**
 * Hook to fetch user's workout history from Firestore
 * @param userId - The user ID to fetch workouts for
 * @param limit - Maximum number of workouts to fetch (default: 30)
 */
export function useWorkoutHistory(userId: string | null, limit = 30) {
  // TODO: Implement in next phase when needed for analytics
  // This will query the /workouts collection filtered by userId
  // and ordered by date descending
  return {
    data: [],
    isLoading: false,
    error: null,
  }
}
