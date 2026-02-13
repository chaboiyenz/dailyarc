import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { User } from '@repo/shared'

export function useAllUsers(currentUserId: string | null) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!currentUserId) {
      setUsers([])
      return
    }

    setLoading(true)

    // Fetch all users except current user
    const q = query(
      collection(db, 'users'),
      where('uid', '!=', currentUserId)
    )

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const allUsers = snapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
        })) as User[]
        setUsers(allUsers)
        setLoading(false)
      },
      error => {
        console.error('Failed to fetch users:', error)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [currentUserId])

  return { users, loading }
}
