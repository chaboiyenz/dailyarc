import { useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  enableNetwork,
  waitForPendingWrites,
} from 'firebase/firestore'
import { auth, db, googleProvider } from '@/lib/firebase'
import { UserSchema, type User } from '@repo/shared'

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  /**
   * Determines if the user needs onboarding:
   * - Profile doesn't exist yet (null)
   * - Profile exists but `onboardingComplete` is false
   * - Profile exists but `role` is null
   */
  const needsOnboarding =
    user !== null && (profile === null || !profile.onboardingComplete || profile.role === null)

  // -- Auth Actions ----------------------------------------------------------

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider)
  }, [])

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth)
  }, [])

  // -- Auth State Listener ---------------------------------------------------

  useEffect(() => {
    console.log('🔌 Auth Listener: Attaching...')
    console.log('🔥 Firestore Instance Type:', db.type)

    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      console.log('👤 User State:', firebaseUser ? 'Logged In' : 'Logged Out')

      if (firebaseUser) {
        setUser(firebaseUser)

        const userDocRef = doc(db, 'users', firebaseUser.uid)
        let retryAttempted = false

        // First attempt to fetch profile
        try {
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            console.log('📂 Profile loaded from DB')
            const result = UserSchema.safeParse(userDoc.data())
            if (result.success) {
              setProfile(result.data)
            }
          } else {
            console.log('📝 User exists in Auth but not DB. Flagging for onboarding...')
            // Don't auto-create doc — let onboarding flow handle it.
            // Set a minimal "ghost" profile so needsOnboarding triggers.
            setProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'New User',
              photoURL: firebaseUser.photoURL,
              role: null,
              onboardingComplete: false,
              inventory: [],
              stats: {
                currentPushupLevel: 0,
                weight: 0,
              },
            })
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err)
          console.error('🔥 DB Error (First Attempt):', errorMessage)

          // FORCE-CONNECT STRATEGY: Retry with network recovery
          if (
            (errorMessage.includes('offline') || errorMessage.includes('network')) &&
            !retryAttempted
          ) {
            console.log('⚠️ Client offline. Forcing network reconnection...')
            retryAttempted = true

            try {
              await enableNetwork(db)
              await waitForPendingWrites(db)
              console.log('🔄 Network enabled. Retrying getDoc...')

              const retryDoc = await getDoc(userDocRef)
              if (retryDoc.exists()) {
                console.log('✅ Profile loaded after retry')
                const result = UserSchema.safeParse(retryDoc.data())
                if (result.success) {
                  setProfile(result.data)
                }
              } else {
                console.log('📝 No doc after retry. Flagging for onboarding...')
                setProfile({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email || '',
                  displayName: firebaseUser.displayName || 'New User',
                  photoURL: firebaseUser.photoURL,
                  role: null,
                  onboardingComplete: false,
                  inventory: [],
                  stats: {
                    currentPushupLevel: 0,
                    weight: 0,
                  },
                })
              }
            } catch (retryErr: unknown) {
              const retryMessage = retryErr instanceof Error ? retryErr.message : String(retryErr)
              console.error('❌ Retry failed:', retryMessage)

              // GHOST PROFILE FALLBACK
              console.log('👻 Using Ghost Profile - Firestore unavailable')
              setProfile({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'New User',
                photoURL: firebaseUser.photoURL,
                role: null,
                onboardingComplete: false,
                inventory: [],
                stats: {
                  currentPushupLevel: 0,
                  weight: 0,
                },
              })
            }
          } else {
            // Non-network error or retry already attempted
            console.log('👻 Using Ghost Profile - Firestore unavailable')
            setProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'New User',
              photoURL: firebaseUser.photoURL,
              role: null,
              onboardingComplete: false,
              inventory: [],
              stats: {
                currentPushupLevel: 0,
                weight: 0,
              },
            })
          }
        }
      } else {
        setUser(null)
        setProfile(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, profile, loading, needsOnboarding, signInWithGoogle, signOut }
}
