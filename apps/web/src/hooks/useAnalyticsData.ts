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
  volume: number
  calories: number
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
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        sevenDaysAgo.setHours(0, 0, 0, 0)

        // Fetch all 3 data sources in parallel
        const [arcsSnapshot, workoutsSnapshot, mealsSnapshot] = await Promise.all([
          getDocs(
            query(
              collection(db, 'dailyArcs'),
              where('userId', '==', userId),
              where('date', '>=', Timestamp.fromDate(sevenDaysAgo)),
              orderBy('date', 'asc'),
              limit(7)
            )
          ),
          getDocs(
            query(
              collection(db, 'workouts'),
              where('userId', '==', userId),
              where('date', '>=', Timestamp.fromDate(sevenDaysAgo)),
              orderBy('date', 'asc'),
              limit(50)
            )
          ),
          getDocs(
            query(
              collection(db, 'mealLogs'),
              where('userId', '==', userId),
              where('timestamp', '>=', Timestamp.fromDate(sevenDaysAgo)),
              orderBy('timestamp', 'asc'),
              limit(100)
            )
          ),
        ])

        // Build workout volume map by date
        const volumeByDate: Record<string, number> = {}
        workoutsSnapshot.docs.forEach(doc => {
          const d = doc.data()
          // Workout doc ID format: {userId}_{YYYY-MM-DD}_{timestamp}
          const idParts = doc.id.split('_')
          const dateKey =
            idParts.length >= 2 ? idParts[1] : d.date?.toDate?.()?.toISOString().split('T')[0] || ''
          if (dateKey) {
            volumeByDate[dateKey] = (volumeByDate[dateKey] || 0) + (d.totalVolume || d.reps || 0)
          }
        })

        // Build calories map by date
        const caloriesByDate: Record<string, number> = {}
        const daysWithCaloriesSet = new Set<string>()
        mealsSnapshot.docs.forEach(doc => {
          const d = doc.data()
          const dateKey = d.timestamp?.toDate?.()
            ? d.timestamp.toDate().toISOString().split('T')[0]
            : ''
          if (dateKey) {
            caloriesByDate[dateKey] = (caloriesByDate[dateKey] || 0) + (d.calories || 0)
            daysWithCaloriesSet.add(dateKey)
          }
        })

        // Build final data array for last 7 days
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const today = new Date()
        const weeklyData: AnalyticsDataPoint[] = []

        let totalReadiness = 0
        let totalSleep = 0
        let totalVolume = 0
        let totalCalories = 0
        let daysWithData = 0
        let daysWithCalories = 0

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          const dateString = date.toISOString().split('T')[0]
          const dayLabel = days[date.getDay()]

          // Arc doc ID format: {userId}_{YYYY-MM-DD}
          const arcDoc = arcsSnapshot.docs.find(doc => doc.id === `${userId}_${dateString}`)
          const dayVolume = volumeByDate[dateString] || 0
          const dayCalories = caloriesByDate[dateString] || 0

          if (arcDoc && arcDoc.exists()) {
            const arcData = arcDoc.data() as DailyArcEntry
            const ri = arcData.readinessInput
            const sleepVal = ri?.sleep ?? 0
            const stressVal = ri?.stress ?? 0
            const sorenessVal = ri?.soreness ?? 0
            const energyVal = ri?.energy ?? 0

            weeklyData.push({
              date: dateString,
              dayLabel,
              readiness: arcData.readinessAverage * 2,
              sleep: sleepVal,
              stress: stressVal,
              soreness: sorenessVal,
              fatigue: 5 - energyVal,
              volume: dayVolume,
              calories: dayCalories,
            })

            totalReadiness += arcData.readinessAverage * 2
            totalSleep += sleepVal
            daysWithData++
          } else {
            weeklyData.push({
              date: dateString,
              dayLabel,
              readiness: 0,
              sleep: 0,
              stress: 0,
              soreness: 0,
              fatigue: 0,
              volume: dayVolume,
              calories: dayCalories,
            })
          }

          totalVolume += dayVolume
          totalCalories += dayCalories
          if (dayCalories > 0) {
            daysWithCalories++
          }
        }

        setData(weeklyData)
        const avgReadinessVal = daysWithData > 0 ? totalReadiness / daysWithData : 0
        const avgSleepVal = daysWithData > 0 ? totalSleep / daysWithData : 0
        const avgCaloriesVal = daysWithCalories > 0 ? totalCalories / daysWithCalories : 0

        setSummary({
          avgReadiness: isNaN(avgReadinessVal) ? 0 : avgReadinessVal,
          totalVolume,
          avgSleep: isNaN(avgSleepVal) ? 0 : avgSleepVal,
          avgCalories: isNaN(avgCaloriesVal) ? 0 : avgCaloriesVal,
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
