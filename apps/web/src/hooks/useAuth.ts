import { useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User as FirebaseUser,
} from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db, googleProvider, githubProvider } from '@/lib/firebase'
import { UserSchema, type User } from '@repo/shared'

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<User | null | undefined>(undefined) // undefined = loading, null = no profile
  const [loading, setLoading] = useState(true)

  /**
   * Determines if the user needs onboarding:
   * - Profile doesn't exist yet (null) after loading completes
   * - Profile exists but `onboardingComplete` is false
   * - Profile exists but `role` is null
   */
  const needsOnboarding =
    !loading &&
    user !== null &&
    (profile === null || !profile?.onboardingComplete || profile?.role === null)

  // -- Auth Actions with Enhanced Error Handling -----------------------------

  const handleAuthError = (error: unknown) => {
    const firebaseError = error as { code?: string }
    if (firebaseError.code === 'auth/account-exists-with-different-credential') {
      alert(
        '❌ Account exists with different credential. Please sign in with the method you originally used (Google, GitHub, or Email).'
      )
    }
    throw error
  }

  const signInWithGoogle = useCallback(async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      handleAuthError(error)
    }
  }, [])

  const signInWithGithub = useCallback(async () => {
    try {
      await signInWithPopup(auth, githubProvider)
    } catch (error) {
      handleAuthError(error)
    }
  }, [])

  const signUpWithEmail = useCallback(async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass)
  }, [])

  const signInWithEmail = useCallback(async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass)
  }, [])

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth)
  }, [])

  // -- Refactored Auth & Profile Listener ------------------------------------

  useEffect(() => {
    console.log('🔌 Auth Listener: Attaching...')

    // Maintain a local variable for the snapshot cleanup function
    let unsubscribeSnapshot: (() => void) | null = null

    const unsubscribeAuth = onAuthStateChanged(auth, async firebaseUser => {
      console.log('👤 User State:', firebaseUser ? 'Logged In' : 'Logged Out')

      // 1. Always clean up the previous profile listener if it exists
      if (unsubscribeSnapshot) {
        console.log('🧹 Cleaning up previous profile listener...')
        unsubscribeSnapshot()
        unsubscribeSnapshot = null
      }

      if (firebaseUser) {
        setUser(firebaseUser)
        const userDocRef = doc(db, 'users', firebaseUser.uid)

        // 2. Attach a fresh real-time listener for the new user
        unsubscribeSnapshot = onSnapshot(
          userDocRef,
          docSnapshot => {
            if (docSnapshot.exists()) {
              console.log('📂 Profile updated from Firestore')
              const result = UserSchema.safeParse(docSnapshot.data())
              if (result.success) {
                setProfile(result.data)
              } else {
                console.error('❌ Invalid profile data format:', result.error)
                setProfile(null)
              }
            } else {
              console.log('📝 User has no profile document yet')
              setProfile(null)
            }
            setLoading(false)
          },
          error => {
            console.error('🔥 Firestore Snapshot Error:', error)
            setLoading(false)
          }
        )
      } else {
        // Handle Logout
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    // Final cleanup on component unmount
    return () => {
      unsubscribeAuth()
      if (unsubscribeSnapshot) unsubscribeSnapshot()
    }
  }, [])

  return {
    user,
    profile,
    loading,
    needsOnboarding,
    signInWithGoogle,
    signInWithGithub,
    signUpWithEmail,
    signInWithEmail,
    signOut,
  }
}
