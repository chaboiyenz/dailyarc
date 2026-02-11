import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, GithubAuthProvider, EmailAuthProvider } from 'firebase/auth'
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  type Firestore,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// 1. Singleton App Initialization
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

// 2. Export Auth
export const auth = getAuth(app)

// 3. Singleton Firestore Initialization
// This prevents the "already been called" error during HMR
let db: Firestore
try {
  db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
    experimentalForceLongPolling: true,
  })
  console.log('🔥 Firestore Initialized with Resilient Settings')
} catch (e) {
  db = getFirestore(app)
  console.log('🔥 Firestore already active, using existing instance')
}

// Diagnostic: Verify runtime project ID
console.log(
  '🔍 Runtime Project ID:',
  (db as unknown as { _databaseId?: { projectId?: string } })?._databaseId?.projectId
)
console.log('🔍 Expected Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID)

export { db }
export const googleProvider = new GoogleAuthProvider()
export const githubProvider = new GithubAuthProvider()
export const emailProvider = new EmailAuthProvider()
export default app
