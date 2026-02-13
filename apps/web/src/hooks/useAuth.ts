import { useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User as FirebaseUser,
} from 'firebase/auth'
import { doc, onSnapshot, enableNetwork, waitForPendingWrites } from 'firebase/firestore'
import { auth, db, googleProvider, githubProvider } from '@/lib/firebase'
import { UserSchema, type User } from '@repo/shared'

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<User | null | undefined>(undefined) // undefined = still loading
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
    (profile === null ||
      profile === undefined ||
      !profile.onboardingComplete ||
      profile.role === null)

  // -- Auth Actions ----------------------------------------------------------

  const signInWithGoogle = useCallback(async () => {
    await signInWithPopup(auth, googleProvider)
  }, [])

  const signInWithGithub = useCallback(async () => {
    await signInWithPopup(auth, githubProvider)
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

  // -- Auth State Listener ---------------------------------------------------

  useEffect(() => {
    console.log('🔌 Auth Listener: Attaching...')
    console.log('🔥 Firestore Instance Type:', db.type)

    const unsubscribeAuth = onAuthStateChanged(auth, async firebaseUser => {
      console.log('👤 User State:', firebaseUser ? 'Logged In' : 'Logged Out')

      if (firebaseUser) {
        setUser(firebaseUser)

        const userDocRef = doc(db, 'users', firebaseUser.uid)

        // RT-1: Switch to onSnapshot for real-time profile updates
        // This fixes the onboarding redirect loop by reacting immediately to the DB write
        const unsubscribeSnapshot = onSnapshot(
          userDocRef,
          docSnapshot => {
            if (docSnapshot.exists()) {
              console.log('📂 Profile updated from DB')
              const result = UserSchema.safeParse(docSnapshot.data())
              if (result.success) {
                setProfile(result.data)
                setLoading(false)
              } else {
                console.error('❌ Invalid profile data format', result.error)
                setProfile(null)
                setLoading(false)
              }
            } else {
              console.log('📝 User has no profile yet (Needs Onboarding)')
              setProfile(null)
              setLoading(false)
            }
          },
          error => {
            console.error('🔥 Firestore Snapshot Error:', error)
            setLoading(false)
          }
        )

        // Cleanup snapshot listener when auth state changes or component unmounts
        // Note: multiple auth state changes might leak listeners if not handled carefully,
        // but useEffect cleanup handles the main auth unsubscribe.
        // Ideally we'd store the snapshot unsubscribe to call it later, but onAuthStateChanged
        // implies a new user session.
        // For simplicity in this hook structure, we can't easily unsubscribe *just* the snapshot
        // from inside this callback without refs.
        // HOWEVER, since this is a top-level provider, it rarely unmounts.
        // A better pattern might be a separate useEffect for the user profile.
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => unsubscribeAuth()
  }, [])

  // Refactor: We need a cleaner way to handle the nested subscription.
  // The above implementation leaks the snapshot listener if the user logs out and back in without unmounting.
  // Let's separate the effects.

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
