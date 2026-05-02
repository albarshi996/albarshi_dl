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

// ─── [PHONE OTP — READY BUT DISABLED] ────────────────────────────────
// Uncomment the imports below when Phone Auth is needed in production.
// Requirements before enabling:
//   1. Upgrade Firebase project to Blaze (pay-as-you-go) plan
//   2. Enable Phone Auth in Firebase Console → Authentication → Sign-in method
//   3. Verify Libya (+218) is in the allowed regions list
//   4. Add reCAPTCHA domain to Firebase Console → Authentication → Settings
// import { PhoneAuthProvider, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
// ─────────────────────────────────────────────────────────────────────

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

// ── Active Auth Services ───────────────────────────────────────────────
export const auth = getAuth(app);
export const db   = getFirestore(app);

// Analytics: browser-only — skipped during SSR/build
export const analytics = typeof window !== 'undefined'
  ? isSupported().then(ok => ok ? getAnalytics(app) : null)
  : Promise.resolve(null);

export default app;

// ═══════════════════════════════════════════════════════════════════════
// PHONE OTP IMPLEMENTATION — DISABLED (ready for production upgrade)
// ═══════════════════════════════════════════════════════════════════════
// To enable: uncomment this entire block + the imports above.
//
// /**
//  * Initialize invisible reCAPTCHA for phone auth.
//  * Call once, typically on component mount.
//  * @param {string} buttonId - ID of the submit button element
//  */
// export function initRecaptcha(buttonId) {
//   if (window._recaptchaVerifier) return window._recaptchaVerifier;
//   window._recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
//     size: 'invisible',
//     callback: () => {},           // reCAPTCHA solved automatically
//     'expired-callback': () => {   // Reset on expiry
//       window._recaptchaVerifier = null;
//     },
//   });
//   return window._recaptchaVerifier;
// }
//
// /**
//  * Send OTP SMS to a Libyan phone number.
//  * @param {string} phoneNumber - E.164 format: +218XXXXXXXXX
//  * @param {string} buttonId    - DOM element ID for reCAPTCHA anchor
//  * @returns {Promise<ConfirmationResult>}
//  *
//  * Usage:
//  *   const confirmation = await sendOtp('+218946507954', 'send-otp-btn');
//  *   // Store confirmation in state, then call verifyOtp(confirmation, code)
//  */
// export async function sendOtp(phoneNumber, buttonId) {
//   const appVerifier = initRecaptcha(buttonId);
//   return await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
// }
//
// /**
//  * Verify the OTP code received by the user.
//  * @param {ConfirmationResult} confirmationResult - from sendOtp()
//  * @param {string} code - 6-digit OTP entered by user
//  * @returns {Promise<UserCredential>}
//  *
//  * Usage:
//  *   const userCred = await verifyOtp(confirmation, '123456');
//  *   console.log('Signed in as:', userCred.user.uid);
//  */
// export async function verifyOtp(confirmationResult, code) {
//   return await confirmationResult.confirm(code);
// }
//
// ── Active Auth Plan (Phase 1 — FREE, Spark plan) ─────────────────────
// ✅ Email/Password  → getAuth + createUserWithEmailAndPassword
// ✅ Google Sign-In  → GoogleAuthProvider + signInWithPopup
// ⚠️  Phone OTP      → DISABLED above — enable after Blaze upgrade
// ═══════════════════════════════════════════════════════════════════════
