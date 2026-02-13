import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { DailyArcEntry, WorkoutSession } from '@repo/shared'

export interface TraineeHealthMetrics {
  traineeId: string
  latestDaily: DailyArcEntry | null
  recentWorkouts: WorkoutSession[]
  lastUpdateTime: Date | null
  healthStatus: 'active' | 'at-risk' | 'inactive' // Based on when last dailyArc was submitted
}

/**
 * Fetches health metrics for a specific trainee
 * - Latest daily arc (readiness score)
 * - Recent workouts (last 7 days for muscle fatigue)
 * - Status based on last update time
 */
export function useTraineeHealth(traineeId: string | null) {
  const [health, setHealth] = useState<TraineeHealthMetrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!traineeId) {
      setHealth(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Query for latest dailyArc
    const dailyQuery = query(
      collection(db, 'dailyArcs'),
      where('userId', '==', traineeId),
      orderBy('date', 'desc'),
      limit(1)
    )

    // Query for recent workouts (last 30 days)
    const workoutQuery = query(
      collection(db, 'workouts'),
      where('userId', '==', traineeId),
      orderBy('date', 'desc'),
      limit(30)
    )

    let latestDaily: DailyArcEntry | null = null
    let recentWorkouts: WorkoutSession[] = []
    let unsubscribeDaily: (() => void) | null = null
    let unsubscribeWorkouts: (() => void) | null = null
    let activeSubscriptions = 2

    const updateHealth = () => {
      if (activeSubscriptions !== 0) return

      // Determine health status based on last update time
      let healthStatus: 'active' | 'at-risk' | 'inactive' = 'inactive'
      let lastUpdateTime: Date | null = null

      if (latestDaily?.createdAt) {
        lastUpdateTime = latestDaily.createdAt.toDate?.() || new Date(latestDaily.createdAt)
        if (lastUpdateTime) {
          const hoursSinceUpdate = (Date.now() - lastUpdateTime.getTime()) / (1000 * 60 * 60)

          if (hoursSinceUpdate < 24) {
            healthStatus = 'active'
          } else if (hoursSinceUpdate < 72) {
            healthStatus = 'at-risk'
          } else {
            healthStatus = 'inactive'
          }
        }
      }

      setHealth({
        traineeId,
        latestDaily,
        recentWorkouts,
        lastUpdateTime,
        healthStatus,
      })
      setLoading(false)
    }

    // Subscribe to daily arcs
    unsubscribeDaily = onSnapshot(
      dailyQuery,
      snapshot => {
        const docs = snapshot.docs
        if (docs.length > 0) {
          latestDaily = { id: docs[0].id, ...docs[0].data() } as DailyArcEntry
        } else {
          latestDaily = null
        }
        activeSubscriptions--
        updateHealth()
      },
      err => {
        console.error('Error fetching trainee daily arc:', err)
        setError('Failed to load trainee health metrics')
        setLoading(false)
      }
    )

    // Subscribe to workouts
    unsubscribeWorkouts = onSnapshot(
      workoutQuery,
      snapshot => {
        recentWorkouts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as WorkoutSession[]
        activeSubscriptions--
        updateHealth()
      },
      err => {
        console.error('Error fetching trainee workouts:', err)
        // Don't fail completely if workouts fail
        activeSubscriptions--
        updateHealth()
      }
    )

    return () => {
      unsubscribeDaily?.()
      unsubscribeWorkouts?.()
    }
  }, [traineeId])

  return { health, loading, error }
}
