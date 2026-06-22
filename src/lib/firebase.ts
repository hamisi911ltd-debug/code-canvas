import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// Public client-side Firebase config — safe to commit (these are not secret keys)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyCTZjGb-WSk5-z4w4GakZ64VRl7cx_QD9c',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'daily-progress-ad412.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'daily-progress-ad412',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'daily-progress-ad412.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '487660252596',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '1:487660252596:web:d78c07ea9bd6dcf1ecd6e1',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-S0JNPSX649',
}

// Prevent re-initialization during HMR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const firebaseReady = true
