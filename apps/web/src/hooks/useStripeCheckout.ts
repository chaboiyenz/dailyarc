import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { createCheckoutSession, createPortalSession } from '@/lib/stripeService'
import type { CheckoutSessionParams } from '@/lib/stripeService'

interface UseStripeCheckoutReturn {
  startCheckout: (params: Omit<CheckoutSessionParams, 'userId' | 'userEmail'>) => Promise<void>
  openCustomerPortal: () => Promise<void>
  isLoading: boolean
  error: string | null
}

const STRIPE_PRO_PRICE_ID = import.meta.env.VITE_STRIPE_PRO_PRICE_ID

/**
 * Hook for Stripe checkout and subscription management
 * Follows mutation pattern like useSubmitReadiness
 */
export function useStripeCheckout(
  userId: string | null,
  userEmail: string | null,
  stripeCustomerId?: string
): UseStripeCheckoutReturn {
  const [error, setError] = useState<string | null>(null)

  const checkoutMutation = useMutation({
    mutationFn: async (params: Omit<CheckoutSessionParams, 'userId' | 'userEmail'>) => {
      if (!userId || !userEmail) throw new Error('User not authenticated')

      const result = await createCheckoutSession({
        ...params,
        userId,
        userEmail,
        priceId: params.priceId || STRIPE_PRO_PRICE_ID,
      })

      if (!result.success || !result.sessionUrl) {
        throw new Error(result.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.href = result.sessionUrl
    },
    onError: err => {
      const message = err instanceof Error ? err.message : 'Checkout failed'
      setError(message)
      console.error('Stripe checkout error:', err)
    },
  })

  const portalMutation = useMutation({
    mutationFn: async () => {
      if (!stripeCustomerId) {
        throw new Error('No subscription found. Please subscribe first.')
      }

      const result = await createPortalSession(stripeCustomerId)

      if (!result.success || !result.sessionUrl) {
        throw new Error(result.error || 'Failed to open customer portal')
      }

      // Redirect to Stripe Customer Portal
      window.location.href = result.sessionUrl
    },
    onError: err => {
      const message = err instanceof Error ? err.message : 'Failed to open portal'
      setError(message)
      console.error('Stripe portal error:', err)
    },
  })

  return {
    startCheckout: async params => {
      setError(null)
      await checkoutMutation.mutateAsync(params)
    },
    openCustomerPortal: async () => {
      setError(null)
      await portalMutation.mutateAsync()
    },
    isLoading: checkoutMutation.isPending || portalMutation.isPending,
    error,
  }
}
