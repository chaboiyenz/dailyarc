import { useState, useEffect, useMemo } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MealLogSchema, type Recipe } from '@repo/shared'

interface MealLogEntry {
  id: string
  type: 'RECIPE' | 'MANUAL'
  recipeName: string
  macros: { protein: number; carbs: number; fat: number }
  calories: number
  timestamp: Date
}

type SyncStatus = 'idle' | 'syncing' | 'ready' | 'error'

/**
 * Real-time hook for today's meal logs.
 * Provides consumed totals, sync status, and handles real-time updates.
 * - Filters by userId AND current date (YYYY-MM-DD)
 * - Handles failed-precondition errors (index building)
 * - Returns syncStatus to allow UI to show "Syncing..." while index builds
 */
export function useTodaysMealLogs(userId: string | null) {
  const [logs, setLogs] = useState<MealLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      setSyncStatus('ready')
      return
    }

    setSyncStatus('syncing')
    setError(null)

    // Get today's date as YYYY-MM-DD string (timezone-independent)
    const today = new Date()
    const todayDateString = today.toISOString().split('T')[0] // e.g., "2025-02-13"

    const q = query(
      collection(db, 'mealLogs'),
      where('userId', '==', userId),
      where('date', '==', todayDateString),
      orderBy('timestamp', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        console.log(
          `[useMealLogs] onSnapshot fired: ${snapshot.docs.length} meals for ${todayDateString}`
        )
        const entries: MealLogEntry[] = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            type: data.type || 'RECIPE',
            recipeName: data.recipeName || data.title || 'Unknown',
            macros: data.macros || { protein: 0, carbs: 0, fat: 0 },
            calories: data.calories || 0,
            timestamp: data.timestamp?.toDate?.() || new Date(),
          }
        })
        setLogs(entries)
        setIsLoading(false)
        setSyncStatus('ready')
        setError(null)
      },
      err => {
        console.error('Error fetching meal logs:', err)
        const errorCode = (err as any)?.code

        // Check for failed-precondition (index still building)
        if (errorCode === 'failed-precondition') {
          console.warn(
            'Firestore index is still building for meal logs query. Showing syncing state.'
          )
          setSyncStatus('syncing')
          setError('Firestore is indexing your data. Real-time updates will be available shortly.')
        } else {
          setSyncStatus('error')
          setError(
            `Failed to load meal logs: ${err instanceof Error ? err.message : 'Unknown error'}`
          )
        }
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [userId])

  const consumed = useMemo(() => {
    return logs.reduce(
      (acc, log) => ({
        protein: acc.protein + log.macros.protein,
        carbs: acc.carbs + log.macros.carbs,
        fat: acc.fat + log.macros.fat,
        calories: acc.calories + log.calories,
      }),
      { protein: 0, carbs: 0, fat: 0, calories: 0 }
    )
  }, [logs])

  return { logs, consumed, isLoading, syncStatus, error }
}

/**
 * Logs a meal to Firestore with Zod validation.
 * Includes both timestamp and date (YYYY-MM-DD) for reliable querying.
 */
export async function logMealToFirestore(
  userId: string,
  recipe: Recipe,
  rf: number
): Promise<void> {
  const macros = {
    protein: Math.round(recipe.macros.protein),
    carbs: Math.round(recipe.macros.carbs),
    fat: Math.round(recipe.macros.fat),
  }

  // Get current date as YYYY-MM-DD (timezone-independent)
  const now = new Date()
  const dateString = now.toISOString().split('T')[0]

  const entry = {
    userId,
    type: 'RECIPE' as const,
    recipeId: recipe.id,
    recipeName: recipe.label,
    macros,
    calories: Math.round(recipe.calories),
    readinessFactor: rf,
    timestamp: Timestamp.now(),
    date: dateString, // YYYY-MM-DD for reliable daily queries
  }

  // Validate with Zod before writing
  MealLogSchema.parse(entry)

  await addDoc(collection(db, 'mealLogs'), entry)
}

/**
 * Logs a manual meal entry to Firestore.
 * Includes both timestamp and date (YYYY-MM-DD) for reliable querying.
 */
export async function logManualMealToFirestore(
  userId: string,
  title: string,
  macros: { protein: number; carbs: number; fat: number },
  calories: number,
  rf: number
): Promise<void> {
  // Get current date as YYYY-MM-DD (timezone-independent)
  const now = new Date()
  const dateString = now.toISOString().split('T')[0]

  const entry = {
    userId,
    type: 'MANUAL' as const,
    title,
    macros,
    calories: Math.round(calories),
    readinessFactor: rf,
    timestamp: Timestamp.now(),
    date: dateString, // YYYY-MM-DD for reliable daily queries
  }

  // Validate with Zod before writing
  MealLogSchema.parse(entry)

  await addDoc(collection(db, 'mealLogs'), entry)
}
