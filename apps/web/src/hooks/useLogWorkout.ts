import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { doc, setDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  WorkoutSessionSchema,
  type WorkoutSession,
  type CreateWorkoutInput,
  calculateVolume,
  ExerciseTypeEnum,
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
      const totalVolume = calculateVolume(input.sets)

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
        totalVolume,
        totalDistance: 0,
        totalDuration: 0,
        exerciseType: input.exerciseType || ExerciseTypeEnum.enum.CALISTHENICS,
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
    onSuccess: (data, variables) => {
      const userId = variables.userId
      console.log('[useLogWorkout] ✅ Mutation success for userId:', userId)
      console.log('[useLogWorkout] Logged workout data:', {
        id: data.id,
        exerciseId: data.exerciseId,
        exerciseName: data.exerciseName,
        userId: data.userId,
      })

      // Immediately update cache with new workout
      console.log('[useLogWorkout] 📝 Attempting to update cache optimistically...')
      try {
        const currentData = queryClient.getQueryData(['workouts', userId])
        console.log('[useLogWorkout] Current cache before update:', currentData)

        if (Array.isArray(currentData)) {
          // Prepend new workout to cache
          const updatedData = [data, ...currentData]
          queryClient.setQueryData(['workouts', userId], updatedData)
          console.log('[useLogWorkout] 📝 Cache updated optimistically with new workout')
        } else {
          // If no cache, create new array with just this workout
          queryClient.setQueryData(['workouts', userId], [data])
          console.log('[useLogWorkout] 📝 Cache created with first workout')
        }
      } catch (err) {
        console.error('[useLogWorkout] ❌ Cache update failed:', err)
      }

      // Then invalidate to trigger a refetch in background
      console.log('[useLogWorkout] 🔴 Invalidating query to trigger refetch...')
      try {
        queryClient.invalidateQueries({
          queryKey: ['workouts', userId],
          exact: true,
        })
        console.log('[useLogWorkout] ✅ Invalidate complete')
      } catch (err) {
        console.error('[useLogWorkout] ❌ Invalidate failed:', err)
      }

      // Also try explicit refetch
      console.log('[useLogWorkout] 🔵 Attempting explicit refetch...')
      queryClient
        .refetchQueries({
          queryKey: ['workouts', userId],
          exact: true,
        })
        .then(() => {
          console.log('[useLogWorkout] ✅ Explicit refetch completed')
          const cachedData = queryClient.getQueryData(['workouts', userId])
          console.log('[useLogWorkout] 📦 Cache after refetch:', {
            type: Array.isArray(cachedData) ? 'array' : typeof cachedData,
            count: Array.isArray(cachedData) ? cachedData.length : 'N/A',
            ids: Array.isArray(cachedData)
              ? cachedData.map((w: WorkoutSession) => w.exerciseId)
              : 'N/A',
            fullData: cachedData,
          })
        })
        .catch(err => {
          console.error('[useLogWorkout] ❌ Explicit refetch failed:', err)
        })

      // Invalidate broader queries too
      queryClient.invalidateQueries({ queryKey: ['userStats'] })
    },
    onError: error => {
      console.error('❌ Failed to log workout:', error)
    },
  })
}

/**
 * Hook to fetch user's workout history from Firestore
 * @param userId - The user ID to fetch workouts for
 * @param limit - Maximum number of workouts to fetch (default: 30)
 */
export function useWorkoutHistory(userId: string | null, limitCount = 30) {
  return useQuery({
    queryKey: ['workouts', userId],
    queryFn: async () => {
      if (!userId) {
        console.log('[useWorkoutHistory] ⚠️ No userId provided, returning empty')
        return []
      }

      console.log('[useWorkoutHistory] 🔍 Fetching workouts for userId:', userId)

      const workoutsRef = collection(db, 'workouts')
      // Remove orderBy('date', 'desc') to avoid needing a composite index for now.
      // We will sort in memory since we are limiting to a small number (fetching all for user then slicing might be better long term,
      // but for now let's just fetch by user).
      // Actually, if we don't sort by date in query, 'limit' might give us random 30.
      // But creating an index requires user action in Firebase Console.
      // To be safe, let's fetch more (or all) and sort client side, or just accept the index requirement.
      // Given I cannot open the console for them, I will fetch all (or a larger limit) and sort in JS.
      // Usage of 'limit' without 'orderBy' is arbitrary.

      const q = query(workoutsRef, where('userId', '==', userId))

      console.log('[useWorkoutHistory] 📡 Executing Firestore query...')
      const snapshot = await getDocs(q)
      console.log('[useWorkoutHistory] 📦 Firestore returned', snapshot.docs.length, 'documents')

      const docs = snapshot.docs.map(doc => {
        const data = doc.data() as WorkoutSession
        console.log('[useWorkoutHistory]   - Document:', {
          id: doc.id,
          exerciseId: data.exerciseId,
          exerciseName: data.exerciseName,
          date: data.date,
        })
        return data
      })

      // Sort in memory by date desc
      const sorted = docs
        .sort((a, b) => {
          // Handle Firestore Timestamp or Date
          const dateA = a.date?.seconds ? a.date.seconds * 1000 : new Date(a.date).getTime()
          const dateB = b.date?.seconds ? b.date.seconds * 1000 : new Date(b.date).getTime()
          return dateB - dateA
        })
        .slice(0, limitCount)

      console.log('[useWorkoutHistory] ✅ Returning', sorted.length, 'workouts after sort/slice')
      console.log(
        '[useWorkoutHistory] 📋 Final data:',
        sorted.map(w => ({ id: w.exerciseId, name: w.exerciseName }))
      )

      return sorted
    },
    enabled: !!userId,
    staleTime: 0, // Always refetch on invalidation (critical for real-time stage unlock)
    refetchOnWindowFocus: true, // Refetch when user switches tabs back to training
  })
}

/**
 * Hook to fetch workouts from the last 72 hours
 * Used for the Muscle Fatigue Heatmap (PDD: color-coded by last 72h volume)
 */
export function useRecentWorkouts(userId: string | null) {
  return useQuery({
    queryKey: ['recentWorkouts', userId],
    queryFn: async () => {
      if (!userId) return []

      const now = new Date()
      const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000)

      const workoutsRef = collection(db, 'workouts')
      const q = query(
        workoutsRef,
        where('userId', '==', userId),
        where('date', '>=', Timestamp.fromDate(seventyTwoHoursAgo))
      )

      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => doc.data() as WorkoutSession)
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}
