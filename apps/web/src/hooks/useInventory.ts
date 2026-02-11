import { useState } from 'react'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from './useAuth'

export function useInventory() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)

  const inventory = profile?.inventory || []

  const addToPantry = async (item: string) => {
    if (!user?.uid || !item.trim()) return

    // Check for duplicates
    if (inventory.includes(item)) {
      throw new Error('Item already in pantry')
    }

    setLoading(true)
    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        inventory: arrayUnion(item.trim()),
      })
    } catch (error) {
      console.error('Error adding to pantry:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const removeFromPantry = async (item: string) => {
    if (!user?.uid) return

    setLoading(true)
    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        inventory: arrayRemove(item),
      })
    } catch (error) {
      console.error('Error removing from pantry:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    inventory,
    addToPantry,
    removeFromPantry,
    loading,
  }
}
