import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  initiateGoogleFitAuth,
  disconnectWearable,
  saveWearableTokens,
} from '@/lib/wearableService'
import type { WearableAuthResult } from '@/lib/wearableService'

interface UseWearableSyncReturn {
  connectWearable: () => Promise<void>
  disconnectWearable: () => Promise<void>
  isConnecting: boolean
  error: string | null
}

/**
 * Hook for managing wearable device connections
 * Uses mutation pattern consistent with useSubmitReadiness
 */
export function useWearableSync(userId: string | null): UseWearableSyncReturn {
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User not authenticated')

      // Step 1: Initiate OAuth flow
      const authResult: WearableAuthResult = await initiateGoogleFitAuth()

      if (!authResult.success || !authResult.accessToken) {
        throw new Error(authResult.error || 'Authorization failed')
      }

      // Step 2: Exchange code for tokens via backend
      // This would call a Cloud Function to securely exchange the code
      // For now, we'll assume the backend returns tokens
      const tokens = {
        accessToken: authResult.accessToken,
        refreshToken: authResult.refreshToken || '',
        expiresIn: authResult.expiresIn || 3600,
      }

      // Step 3: Save tokens to Firestore
      await saveWearableTokens(userId, tokens)

      return { success: true }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] })
      queryClient.invalidateQueries({ queryKey: ['todaysArc'] })
      setError(null)
      console.log('Wearable connected successfully')
    },
    onError: err => {
      const message = err instanceof Error ? err.message : 'Failed to connect wearable'
      setError(message)
      console.error('Wearable connection error:', err)
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User not authenticated')
      await disconnectWearable(userId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] })
      queryClient.invalidateQueries({ queryKey: ['todaysArc'] })
      setError(null)
      console.log('Wearable disconnected successfully')
    },
    onError: err => {
      const message = err instanceof Error ? err.message : 'Failed to disconnect wearable'
      setError(message)
      console.error('Wearable disconnection error:', err)
    },
  })

  return {
    connectWearable: async () => {
      setError(null)
      await connectMutation.mutateAsync()
    },
    disconnectWearable: async () => {
      setError(null)
      await disconnectMutation.mutateAsync()
    },
    isConnecting: connectMutation.isPending || disconnectMutation.isPending,
    error,
  }
}
