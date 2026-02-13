import { useState, useEffect } from 'react'
import { collection, query, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'

/**
 * Real-time hook for a user's completed skills.
 * Listens to the /users/{userId}/skills sub-collection.
 */
export function useCompletedSkills(userId: string | null) {
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setCompletedIds([])
      setIsLoading(false)
      return
    }

    const skillsRef = collection(db, 'users', userId, 'skills')
    const q = query(skillsRef)

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const ids = snapshot.docs
          .map(doc => doc.id)
          .filter((id): id is string => id !== null && id !== '')

        setCompletedIds(ids)
        setIsLoading(false)
      },
      err => {
        console.error('Error fetching completed skills:', err)
        setIsLoading(false)
      }
    )

    return () => unsubscribe()
  }, [userId])

  return { completedIds, isLoading }
}
