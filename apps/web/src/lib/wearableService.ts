import { db } from './firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

// Google Fit OAuth Configuration
const GOOGLE_FIT_CLIENT_ID = import.meta.env.VITE_GOOGLE_FIT_CLIENT_ID
const GOOGLE_FIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
]

export interface WearableAuthResult {
  success: boolean
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
  error?: string
}

/**
 * Initiate Google Fit OAuth flow using popup method
 * Popup avoids redirect issues and preserves app state
 */
export async function initiateGoogleFitAuth(): Promise<WearableAuthResult> {
  const redirectUri = `${window.location.origin}/wearable-callback`
  const scope = GOOGLE_FIT_SCOPES.join(' ')

  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_FIT_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent`

  // Open popup window
  const popup = window.open(
    authUrl,
    'Google Fit Authorization',
    'width=600,height=700,top=100,left=100'
  )

  if (!popup) {
    return {
      success: false,
      error: 'Popup blocked. Please allow popups for this site.',
    }
  }

  // Listen for OAuth callback via postMessage
  return new Promise(resolve => {
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      const { code, error } = event.data
      if (error) {
        resolve({ success: false, error })
      } else if (code) {
        // Placeholder - backend will exchange code for tokens
        resolve({ success: true, accessToken: code })
      }

      window.removeEventListener('message', messageHandler)
      popup.close()
    }

    window.addEventListener('message', messageHandler)

    // Timeout after 5 minutes
    setTimeout(() => {
      window.removeEventListener('message', messageHandler)
      popup.close()
      resolve({ success: false, error: 'Authorization timeout' })
    }, 300000)
  })
}

/**
 * Disconnect wearable by clearing tokens from Firestore
 */
export async function disconnectWearable(userId: string): Promise<void> {
  const userRef = doc(db, 'users', userId)
  await updateDoc(userRef, {
    wearableSync: {
      provider: 'NONE',
      isConnected: false,
      syncEnabled: false,
    },
  })
}

/**
 * Save wearable tokens to Firestore after OAuth
 * Note: Backend should handle token exchange and encryption
 */
export async function saveWearableTokens(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  tokens: { accessToken: string; refreshToken: string; expiresIn: number }
): Promise<void> {
  const userRef = doc(db, 'users', userId)

  await updateDoc(userRef, {
    wearableSync: {
      provider: 'GOOGLE_FIT',
      isConnected: true,
      syncEnabled: true,
      lastSyncAt: serverTimestamp(),
    },
  })
}

/**
 * Check if wearable token needs refresh
 */
export function needsTokenRefresh(expiryDate: Date | null): boolean {
  if (!expiryDate) return true
  const now = new Date()
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000)
  return expiryDate <= fiveMinutesFromNow
}
