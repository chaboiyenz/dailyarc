import { useQuery } from '@tanstack/react-query'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DailyArcEntrySchema, type DailyArcEntry } from '@repo/shared'
import { useEffect, useState } from 'react'

/**
 * Hook to fetch today's Daily Arc entry with real-time updates.
 *
 * Uses Firestore onSnapshot for live updates when the readiness data changes.
 * The document ID is based on today's date and the user's ID: `YYYY-MM-DD_userId`
 */
export function useTodaysArc(userId: string | null) {
  const [realtimeData, setRealtimeData] = useState<DailyArcEntry | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    // Generate today's document ID
    const today = new Date()
    const dateString = today.toISOString().split('T')[0] // YYYY-MM-DD
    const docId = `${dateString}_${userId}`

    // Set up real-time listener
    const docRef = doc(db, 'dailyArcs', docId)

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setIsLoading(false)

        if (snapshot.exists()) {
          const data = snapshot.data()

          // Parse with Zod schema
          const result = DailyArcEntrySchema.safeParse({
            ...data,
            id: snapshot.id,
          })

          if (result.success) {
            setRealtimeData(result.data)
            setError(null)
          } else {
            console.error('Invalid DailyArc data:', result.error)
            setError(new Error('Invalid data format'))
            setRealtimeData(null)
          }
        } else {
          // No readiness check submitted today
          setRealtimeData(null)
          setError(null)
        }
      },
      (err) => {
        console.error('Error listening to today\'s arc:', err)
        setError(err as Error)
        setIsLoading(false)
      }
    )

    // Cleanup listener on unmount or userId change
    return () => unsubscribe()
  }, [userId])

  return {
    data: realtimeData,
    isLoading,
    error,
    exists: realtimeData !== null,
  }
}

/**
 * Alternative version using TanStack Query with manual refetch.
 * Use this if you prefer TanStack Query's caching and don't need real-time updates.
 */
export function useTodaysArcQuery(userId: string | null) {
  return useQuery({
    queryKey: ['todaysArc', userId],
    queryFn: async () => {
      if (!userId) return null

      // Generate today's document ID
      const today = new Date()
      const dateString = today.toISOString().split('T')[0] // YYYY-MM-DD
      const docId = `${dateString}_${userId}`

      // Fetch document (one-time)
      const { getDoc } = await import('firebase/firestore')
      const docRef = doc(db, 'dailyArcs', docId)
      const snapshot = await getDoc(docRef)

      if (!snapshot.exists()) {
        return null
      }

      const data = snapshot.data()
      const result = DailyArcEntrySchema.safeParse({
        ...data,
        id: snapshot.id,
      })

      if (result.success) {
        return result.data
      }

      throw new Error('Invalid DailyArc data format')
    },
    enabled: !!userId,
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
  })
}
