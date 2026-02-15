// apps/web/src/lib/stripeService.ts
const CLOUD_FUNCTION_URL = import.meta.env.VITE_CLOUD_FUNCTION_URL

export interface CheckoutSessionParams {
  userId: string
  userEmail: string
  priceId: string
  successUrl?: string
  cancelUrl?: string
}

export interface CheckoutResult {
  success: boolean
  sessionUrl?: string
  error?: string
}

/**
 * Create Stripe Checkout Session
 * MOCK MODE ENABLED for Sprint Demo
 */
export async function createCheckoutSession(
  params: CheckoutSessionParams
): Promise<CheckoutResult> {
  try {
    const successUrl = params.successUrl || `${window.location.origin}/subscription/success`
    const cancelUrl = params.cancelUrl || `${window.location.origin}/subscription/canceled`

    // --- SPRINT DEMO MOCK LOGIC ---
    if (CLOUD_FUNCTION_URL === 'mock-mode' || !CLOUD_FUNCTION_URL) {
      console.log('🧪 [Mock Stripe] Simulation active for:', params.userEmail)

      // Simulate a small network delay for realism
      await new Promise(resolve => setTimeout(resolve, 800))

      // Return the success URL directly to trigger the redirect in your hook
      return { success: true, sessionUrl: successUrl }
    }
    // --- END MOCK LOGIC ---

    // Real production flow (will run if URL is valid)
    const response = await fetch(`${CLOUD_FUNCTION_URL}/createCheckoutSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: params.userId,
        userEmail: params.userEmail,
        priceId: params.priceId,
        successUrl,
        cancelUrl,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    return { success: true, sessionUrl: data.url }
  } catch (error) {
    console.error('Checkout session creation failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create checkout session',
    }
  }
}

/**
 * Create Customer Portal session
 */
export async function createPortalSession(
  customerId: string,
  returnUrl?: string
): Promise<CheckoutResult> {
  if (CLOUD_FUNCTION_URL === 'mock-mode' || !CLOUD_FUNCTION_URL) {
    return { success: true, sessionUrl: `${window.location.origin}/profile` }
  }

  try {
    const portalReturnUrl = returnUrl || `${window.location.origin}/profile`
    const response = await fetch(`${CLOUD_FUNCTION_URL}/createPortalSession`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, returnUrl: portalReturnUrl }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`)
    }

    const data = await response.json()
    return { success: true, sessionUrl: data.url }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create portal session',
    }
  }
}
