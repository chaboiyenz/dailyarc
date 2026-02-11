import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { calculateReadiness } from '@repo/shared/logic'
import type { DailyLog } from '@repo/shared'

interface ReadinessInput {
  sleepQuality: number
  stressLevel: number
  soreness: number
  fatigue: number
  sorenessZones?: string[]
  notes?: string
}

interface SubmitReadinessParams {
  userId: string
  input: ReadinessInput
}

/**
 * Hook for submitting daily readiness check to Firestore.
 *
 * Creates a DailyArc entry in the `/dailyArcs/{date-userId}` collection
 * with calculated readiness score and recommendation.
 */
export function useSubmitReadiness() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, input }: SubmitReadinessParams) => {
      // Calculate readiness score using shared logic
      const readinessScore = calculateReadiness({
        sleepQuality: input.sleepQuality,
        stressLevel: input.stressLevel,
        soreness: input.soreness,
        fatigue: input.fatigue,
      })

      // Determine recommendation based on score
      let recommendation: 'REST' | 'LIGHT' | 'MODERATE' | 'INTENSE'
      if (readinessScore >= 8) recommendation = 'INTENSE'
      else if (readinessScore >= 6) recommendation = 'MODERATE'
      else if (readinessScore >= 4) recommendation = 'LIGHT'
      else recommendation = 'REST'

      // Create unique document ID based on date and userId
      const today = new Date()
      const dateString = today.toISOString().split('T')[0] // YYYY-MM-DD
      const docId = `${dateString}_${userId}`

      // Prepare the data to be stored
      const dailyArcData = {
        id: docId,
        userId,
        date: serverTimestamp(),
        readinessScore,
        recommendation,
        createdAt: serverTimestamp(),
        // Include the raw input data for reference
        sleepQuality: input.sleepQuality,
        stressLevel: input.stressLevel,
        soreness: input.soreness,
        fatigue: input.fatigue,
        sorenessZones: input.sorenessZones || [],
        notes: input.notes || '',
      }

      // Write to Firestore
      const docRef = doc(db, 'dailyArcs', docId)
      await setDoc(docRef, dailyArcData, { merge: true })

      return {
        docId,
        readinessScore,
        recommendation,
      }
    },
    onSuccess: (data) => {
      // Invalidate today's arc query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['todaysArc'] })
      queryClient.invalidateQueries({ queryKey: ['dailyArcs'] })

      console.log('✅ Readiness submitted:', data)
    },
    onError: (error) => {
      console.error('❌ Failed to submit readiness:', error)
    },
  })
}
