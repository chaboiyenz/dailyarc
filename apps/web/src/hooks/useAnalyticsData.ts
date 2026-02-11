import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DailyArcEntry } from '@repo/shared'

export interface AnalyticsDataPoint {
  date: string
  dayLabel: string
  readiness: number
  sleep: number
  stress: number
  soreness: number
  fatigue: number
  volume: number // Workout volume (placeholder for Phase 3)
  calories: number // Placeholder for Phase 4
}

export interface AnalyticsSummary {
  avgReadiness: number
  totalVolume: number
  avgSleep: number
  avgCalories: number
}

/**
 * Hook to fetch weekly analytics data from Firestore
 * Combines readiness scores with workout and nutrition data
 */
export function useAnalyticsData(userId: string | null) {
  const [data, setData] = useState<AnalyticsDataPoint[]>([])
  const [summary, setSummary] = useState<AnalyticsSummary>({
    avgReadiness: 0,
    totalVolume: 0,
    avgSleep: 0,
    avgCalories: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const fetchAnalyticsData = async () => {
      try {
        // Fetch last 7 days of daily arcs
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const arcsRef = collection(db, 'dailyArcs')
        const q = query(
          arcsRef,
          where('userId', '==', userId),
          where('date', '>=', Timestamp.fromDate(sevenDaysAgo)),
          orderBy('date', 'asc'),
          limit(7)
        )

        const snapshot = await getDocs(q)

        // Build data for last 7 days
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const today = new Date()
        const weeklyData: AnalyticsDataPoint[] = []

        let totalReadiness = 0
        let totalSleep = 0
        let totalVolume = 0
        let totalCalories = 0
        let daysWithData = 0

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          const dateString = date.toISOString().split('T')[0]
          const dayLabel = days[date.getDay()]

          // Find matching arc data
          const arcDoc = snapshot.docs.find((doc) => doc.id.startsWith(dateString))

          if (arcDoc && arcDoc.exists()) {
            const arcData = arcDoc.data() as any

            // Calculate sleep from the inverted values
            const sleepQuality = arcData.sleepQuality || 0
            const stressLevel = arcData.stressLevel || 0
            const sorenessLevel = arcData.soreness || 0
            const fatigueLevel = arcData.fatigue || 0

            weeklyData.push({
              date: dateString,
              dayLabel,
              readiness: arcData.readinessScore || 0,
              sleep: sleepQuality,
              stress: stressLevel,
              soreness: sorenessLevel,
              fatigue: fatigueLevel,
              volume: 0, // TODO: Fetch from workout logs in Phase 3
              calories: 0, // TODO: Fetch from nutrition logs in Phase 4
            })

            totalReadiness += arcData.readinessScore || 0
            totalSleep += sleepQuality
            daysWithData++
          } else {
            // No data for this day
            weeklyData.push({
              date: dateString,
              dayLabel,
              readiness: 0,
              sleep: 0,
              stress: 0,
              soreness: 0,
              fatigue: 0,
              volume: 0,
              calories: 0,
            })
          }
        }

        setData(weeklyData)

        // Calculate summary statistics
        setSummary({
          avgReadiness: daysWithData > 0 ? totalReadiness / daysWithData : 0,
          totalVolume, // Currently 0, will be real in Phase 3
          avgSleep: daysWithData > 0 ? totalSleep / daysWithData : 0,
          avgCalories: daysWithData > 0 ? totalCalories / daysWithData : 0,
        })

        setError(null)
      } catch (err) {
        console.error('Error fetching analytics data:', err)
        setError(err as Error)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [userId])

  return { data, summary, isLoading, error }
}
