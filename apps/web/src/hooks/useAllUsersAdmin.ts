import { useState, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { User } from '@repo/shared'

/**
 * Fetches all users from the database (admin only)
 * Used by AdminPanel to display and manage all users
 */
export function useAllUsersAdmin() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const unsubscribe = onSnapshot(
      collection(db, 'users'),
      snapshot => {
        const userList = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
        })) as User[]

        setUsers(userList)
        setLoading(false)
      },
      err => {
        console.error('Error fetching all users:', err)
        setError('Failed to load users')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  return { users, loading, error }
}
