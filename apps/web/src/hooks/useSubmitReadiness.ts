import { useMutation, useQueryClient } from '@tanstack/react-query'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  calculateReadinessFactor,
  calculateReadinessAverage,
  getRecommendation,
} from '@repo/shared/logic'
import { ReadinessInputSchema, type ReadinessInput } from '@repo/shared/schemas/readiness'

interface SubmitReadinessParams {
  userId: string
  input: ReadinessInput
  sorenessZones?: string[]
  notes?: string
  bioMetrics?: {
    sleepQuality?: number
    restingHR?: number
    bodyBattery?: number
  }
}

/**
 * Hook for submitting the Phase 2 daily readiness check to Firestore.
 *
 * - Validates the input with Zod before writing
 * - Calculates RF using the shared pure function
 * - Writes to /dailyArcs/{userId_YYYY-MM-DD} (composite ID prevents duplicates)
 */
export function useSubmitReadiness() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      input,
      sorenessZones,
      notes,
      bioMetrics,
    }: SubmitReadinessParams) => {
      // Validate input using Zod schema
      const parsed = ReadinessInputSchema.parse(input)

      // Calculate derived values using shared pure functions
      const readinessFactor = calculateReadinessFactor(parsed)
      const readinessAverage = calculateReadinessAverage(parsed)
      const recommendation = getRecommendation(readinessFactor)

      // Composite ID: userId_YYYY-MM-DD (prevents duplicate entries per day)
      const today = new Date()
      const dateString = today.toISOString().split('T')[0] // YYYY-MM-DD
      const docId = `${userId}_${dateString}`

      // Build bioMetrics object, excluding undefined fields
      const bioMetricsData: Record<string, number> = {}
      if (bioMetrics) {
        if (bioMetrics.sleepQuality !== undefined)
          bioMetricsData.sleepQuality = bioMetrics.sleepQuality
        if (bioMetrics.restingHR !== undefined && bioMetrics.restingHR !== null)
          bioMetricsData.restingHR = bioMetrics.restingHR
        if (bioMetrics.bodyBattery !== undefined)
          bioMetricsData.bodyBattery = bioMetrics.bodyBattery
      }

      const dailyArcData: Record<string, unknown> = {
        id: docId,
        userId,
        date: serverTimestamp(),
        readinessInput: parsed,
        readinessFactor,
        readinessAverage,
        recommendation,
        sorenessZones: sorenessZones ?? [],
        notes: notes ?? '',
        createdAt: serverTimestamp(),
      }

      // Only add bioMetrics if it has data
      if (Object.keys(bioMetricsData).length > 0) {
        dailyArcData.bioMetrics = bioMetricsData
      }

      const docRef = doc(db, 'dailyArcs', docId)
      await setDoc(docRef, dailyArcData, { merge: true })

      return { docId, readinessFactor, readinessAverage, recommendation }
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['todaysArc'] })
      queryClient.invalidateQueries({ queryKey: ['dailyArcs'] })
      console.log('Readiness submitted:', data)
    },
    onError: error => {
      console.error('Failed to submit readiness:', error)
    },
  })
}
