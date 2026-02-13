import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { User } from '@repo/shared'

/**
 * Fetches all trainees assigned to a trainer (users where trainerId === trainerId)
 * Used by Coach Tab and Trainer Dashboard to display trainee rosters
 */
export function useTrainees(trainerId: string | null) {
  const [trainees, setTrainees] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!trainerId) {
      setTrainees([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    // Query for users where trainerId matches
    const q = query(
      collection(db, 'users'),
      where('trainerId', '==', trainerId)
    )

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const traineeList = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
        })) as User[]

        setTrainees(traineeList)
        setLoading(false)
      },
      err => {
        console.error('Error fetching trainees:', err)
        setError('Failed to load trainees')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [trainerId])

  return { trainees, loading, error }
}
