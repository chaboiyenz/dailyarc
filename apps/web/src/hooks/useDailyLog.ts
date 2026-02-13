import { useQuery } from '@tanstack/react-query'
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DailyLogSchema } from '@repo/shared'

/**
 * Hook to fetch the user's latest daily log
 * Used to calculate the Readiness Factor in the dashboard
 */
export function useLatestDailyLog(userId: string | null) {
  return useQuery({
    queryKey: ['dailyLogs', 'latest', userId],
    queryFn: async () => {
      if (!userId) return null

      const logsRef = collection(db, 'dailyLogs')
      const q = query(logsRef, where('userId', '==', userId), orderBy('date', 'desc'), limit(1))

      const snapshot = await getDocs(q)
      if (snapshot.empty) return null

      const data = snapshot.docs[0].data()
      // Validate data matches schema
      try {
        return DailyLogSchema.parse(data)
      } catch (error) {
        console.error('Daily log schema mismatch:', error)
        return null
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 60, // 1 hour - daily logs don't change often
  })
}
