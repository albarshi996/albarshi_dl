/**
 * Firebase Configuration — Dawerli Platform
 * ⚠️  Zero API Keys in source — all values via import.meta.env
 * ✅  Modular SDK v10 (tree-shakeable)
 * ✅  Singleton init (safe for Astro SSR + React hydration)
 */

import { initializeApp, getApps }   from 'firebase/app';
import { getAuth }                   from 'firebase/auth';
import { getFirestore }              from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey:            import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain:        import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.PUBLIC_FIREBASE_APP_ID,
  measurementId:     import.meta.env.PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Prevent double-init during Astro hot reload / SSR
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const auth = getAuth(app);
export const db   = getFirestore(app);

// Analytics: browser-only — skipped during SSR/build
export const analytics = typeof window !== 'undefined'
  ? isSupported().then(ok => ok ? getAnalytics(app) : null)
  : Promise.resolve(null);

export default app;

/*
 * AUTH PLAN — Zero Cost (Firebase Spark)
 * ──────────────────────────────────────
 * Phase 1 (FREE, unlimited — Spark plan):
 *   ✅ Email/Password  — Firebase Console → Auth → Sign-in method
 *   ✅ Google Sign-In  — Firebase Console → Auth → Sign-in method
 *
 * Phone OTP (SMS):
 *   ⚠️  Spark plan quota: ~10 SMS/day (prototyping only)
 *   ⚠️  Libya SMS delivery via Firebase can be unreliable
 *   → Use Email magic-link (free) now; upgrade to Blaze for production OTP
 */
