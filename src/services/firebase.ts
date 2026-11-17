import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  Firestore,
} from 'firebase/firestore';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;
const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;
export const googleWebClientId = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID || '';

if (!apiKey || !projectId || !appId) {
  throw new Error(
    'Firebase environment configuration missing. Please ensure VITE_FIREBASE_* variables are set in your .env file.'
  );
}

export const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId,
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Initialize Native Google Auth
export const initNativeGoogleAuth = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await GoogleAuth.initialize({
        clientId: googleWebClientId || undefined,
        scopes: ['profile', 'email'],
        grantOfflineAccess: true,
      });
    } catch (e) {
      console.warn('GoogleAuth initialization notice:', e);
    }
  }
};

if (Capacitor.isNativePlatform()) {
  initNativeGoogleAuth();
}

// Enable persistent multi-tab offline cache with long-polling fallback for ad-blockers / firewalls
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
    experimentalAutoDetectLongPolling: true,
  });
} catch {
  firestoreInstance = getFirestore(app);
}
export const db = firestoreInstance;
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Auth Helpers
export const signInWithGoogle = async () => {
  // 1. Native Mobile Flow (Capacitor on Android / iOS)
  if (Capacitor.isNativePlatform()) {
    try {
      if (googleWebClientId) {
        try {
          await GoogleAuth.initialize({
            clientId: googleWebClientId,
            scopes: ['profile', 'email'],
            grantOfflineAccess: true,
          });
        } catch {
          // Ignore if already initialized
        }
      }

      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser?.authentication?.idToken || (googleUser as any)?.idToken;

      if (!idToken) {
        throw new Error('Google Sign-In failed: No ID token returned. Please verify your Web Client ID.');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      return await signInWithCredential(auth, credential);
    } catch (nativeError: any) {
      console.error('Native Google Sign-In error:', nativeError);
      // Do NOT fallback to signInWithPopup on native - Google blocks OAuth inside Android WebViews!
      throw nativeError;
    }
  }

  // 2. Pure Web Browser Flow
  return await signInWithPopup(auth, googleProvider);
};

export const signInWithEmail = async (email: string, pass: string) => {
  return await signInWithEmailAndPassword(auth, email, pass);
};

export const signUpWithEmail = async (email: string, pass: string) => {
  return await createUserWithEmailAndPassword(auth, email, pass);
};

export const signInAsGuest = async () => {
  return await signInAnonymously(auth);
};

export const logOut = async () => {
  return await signOut(auth);
};

export type { FirebaseUser };
