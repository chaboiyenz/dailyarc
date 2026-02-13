import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { type User } from '@repo/shared'

/**
 * Hook to fetch all pending trainers (role === 'TRAINER' && status === 'PENDING')
 * Only accessible to admins
 */
export function usePendingTrainers() {
  return useQuery({
    queryKey: ['pendingTrainers'],
    queryFn: async () => {
      console.log('[usePendingTrainers] Fetching pending trainers...')

      const usersRef = collection(db, 'users')
      const q = query(
        usersRef,
        where('role', '==', 'TRAINER'),
        where('trainerStatus', '==', 'PENDING')
      )

      const snapshot = await getDocs(q)
      const trainers = snapshot.docs.map(doc => ({
        ...(doc.data() as User),
        id: doc.id,
      }))

      console.log('[usePendingTrainers] Found', trainers.length, 'pending trainers')
      return trainers
    },
  })
}

/**
 * Hook to fetch all trainers with approval status
 */
export function useAllTrainers() {
  return useQuery({
    queryKey: ['allTrainers'],
    queryFn: async () => {
      console.log('[useAllTrainers] Fetching all trainers...')

      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('role', '==', 'TRAINER'))

      const snapshot = await getDocs(q)
      const trainers = snapshot.docs.map(doc => ({
        ...(doc.data() as User),
        id: doc.id,
      }))

      console.log('[useAllTrainers] Found', trainers.length, 'total trainers')
      return trainers
    },
  })
}

/**
 * Hook to approve a trainer
 */
export function useApproveTrainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (trainerId: string) => {
      console.log('[useApproveTrainer] Approving trainer:', trainerId)

      const trainerRef = doc(db, 'users', trainerId)
      await updateDoc(trainerRef, {
        trainerStatus: 'APPROVED',
      })

      console.log('[useApproveTrainer] ✅ Trainer approved:', trainerId)
    },
    onSuccess: () => {
      // Invalidate both queries
      queryClient.invalidateQueries({ queryKey: ['pendingTrainers'] })
      queryClient.invalidateQueries({ queryKey: ['allTrainers'] })
    },
    onError: error => {
      console.error('[useApproveTrainer] ❌ Failed to approve trainer:', error)
    },
  })
}

/**
 * Hook to reject a trainer
 */
export function useRejectTrainer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (trainerId: string) => {
      console.log('[useRejectTrainer] Rejecting trainer:', trainerId)

      const trainerRef = doc(db, 'users', trainerId)
      await updateDoc(trainerRef, {
        trainerStatus: 'REJECTED',
      })

      console.log('[useRejectTrainer] ✅ Trainer rejected:', trainerId)
    },
    onSuccess: () => {
      // Invalidate both queries
      queryClient.invalidateQueries({ queryKey: ['pendingTrainers'] })
      queryClient.invalidateQueries({ queryKey: ['allTrainers'] })
    },
    onError: error => {
      console.error('[useRejectTrainer] ❌ Failed to reject trainer:', error)
    },
  })
}
