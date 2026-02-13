import { useQuery } from '@tanstack/react-query'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

/**
 * Hook to check if user has already submitted readiness for today
 * Returns the readiness data if it exists, or null if not submitted yet
 */
export function useTodayReadiness(userId: string | undefined) {
  return useQuery({
    queryKey: ['todayReadiness', userId],
    queryFn: async () => {
      if (!userId) return null

      const today = new Date()
      const dateString = today.toISOString().split('T')[0] // YYYY-MM-DD
      const docId = `${userId}_${dateString}`

      const docRef = doc(db, 'dailyArcs', docId)
      const snapshot = await getDoc(docRef)

      return snapshot.exists() ? snapshot.data() : null
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
