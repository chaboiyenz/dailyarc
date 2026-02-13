import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DailyArcEntry } from '@repo/shared'

interface WeeklyData {
  date: string
  score: number
  dayLabel: string
}

/**
 * Hook to fetch the last 7 days of readiness scores for the weekly trend chart
 */
export function useWeeklyReadiness(userId: string | null) {
  const [data, setData] = useState<WeeklyData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [trend, setTrend] = useState<'neutral' | 'improving' | 'declining'>('neutral')
  const [fatigueAlert, setFatigueAlert] = useState(false)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const fetchWeeklyData = async () => {
      try {
        // Calculate date 7 days ago
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        sevenDaysAgo.setHours(0, 0, 0, 0)

        // Query last 7 days of arcs
        const arcsRef = collection(db, 'dailyArcs')
        const q = query(
          arcsRef,
          where('userId', '==', userId),
          where('date', '>=', Timestamp.fromDate(sevenDaysAgo)),
          orderBy('date', 'asc'), // Ensure sorted by date
          limit(7)
        )

        const snapshot = await getDocs(q)
        const weeklyData: WeeklyData[] = []

        // Get last 7 days including today
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        const today = new Date()

        for (let i = 6; i >= 0; i--) {
          const date = new Date(today)
          date.setDate(date.getDate() - i)
          const dateString = date.toISOString().split('T')[0]
          const dayLabel = days[date.getDay()]

          // Find matching arc data
          const arcData = snapshot.docs.find(doc => {
            return doc.id.startsWith(dateString)
          })

          const score = arcData ? (arcData.data() as DailyArcEntry).readinessAverage * 2 : 0

          weeklyData.push({
            date: dateString,
            score,
            dayLabel,
          })
        }

        // Detect Fatigue Trend (3 days of consecutive decline)
        // Filter out zero-score days for trend analysis
        const activeDays = weeklyData.filter(d => d.score > 0)

        // Handle 0-log case: no active days means neutral trend, no fatigue
        if (activeDays.length === 0) {
          setFatigueAlert(false)
          setTrend('neutral')
          setData(weeklyData)
          setError(null)
          setIsLoading(false)
          return
        }

        let consecutiveDecline = 0
        if (activeDays.length >= 3) {
          for (let i = activeDays.length - 1; i > 0; i--) {
            if (activeDays[i].score < activeDays[i - 1].score) {
              consecutiveDecline++
            } else {
              break
            }
          }
        }

        const isFatigued = consecutiveDecline >= 3
        setFatigueAlert(isFatigued)
        setTrend(
          isFatigued
            ? 'declining'
            : consecutiveDecline === 0 &&
                activeDays.length > 1 &&
                activeDays[activeDays.length - 1].score > activeDays[activeDays.length - 2].score
              ? 'improving'
              : 'neutral'
        )

        setData(weeklyData)
        setError(null)
      } catch (err) {
        console.error('Error fetching weekly readiness:', err)
        setError(err as Error)
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchWeeklyData()
  }, [userId])

  return { data, isLoading, error, trend, fatigueAlert }
}

/**
 * Calculate streak from daily arc data
 * Returns number of consecutive days with readiness checks
 */
export function useReadinessStreak(userId: string | null) {
  const [streak, setStreak] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const calculateStreak = async () => {
      try {
        // Get last 30 days of arcs to calculate streak
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const arcsRef = collection(db, 'dailyArcs')
        const q = query(
          arcsRef,
          where('userId', '==', userId),
          where('date', '>=', Timestamp.fromDate(thirtyDaysAgo)),
          orderBy('date', 'desc'),
          limit(30)
        )

        const snapshot = await getDocs(q)

        // Calculate consecutive days from today backwards
        let currentStreak = 0
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(today)
          checkDate.setDate(checkDate.getDate() - i)
          const dateString = checkDate.toISOString().split('T')[0]

          // Check if there's an arc for this date
          const hasArc = snapshot.docs.some(doc => doc.id.startsWith(dateString))

          if (hasArc) {
            currentStreak++
          } else {
            // Streak broken
            break
          }
        }

        setStreak(currentStreak)
      } catch (err) {
        console.error('Error calculating streak:', err)
        setStreak(0)
      } finally {
        setIsLoading(false)
      }
    }

    calculateStreak()
  }, [userId])

  return { streak, isLoading }
}
