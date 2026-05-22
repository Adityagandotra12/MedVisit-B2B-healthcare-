import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Vite only inlines env vars when each key is accessed statically (not import.meta.env[key]).
const firebaseConfig = {
  apiKey: String(import.meta.env.VITE_FIREBASE_API_KEY ?? '').trim(),
  authDomain: String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '').trim(),
  projectId: String(import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '').trim(),
  storageBucket: String(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '').trim(),
  messagingSenderId: String(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '').trim(),
  appId: String(import.meta.env.VITE_FIREBASE_APP_ID ?? '').trim(),
};

export const missingFirebaseEnvKeys = [
  !firebaseConfig.apiKey && 'VITE_FIREBASE_API_KEY',
  !firebaseConfig.authDomain && 'VITE_FIREBASE_AUTH_DOMAIN',
  !firebaseConfig.projectId && 'VITE_FIREBASE_PROJECT_ID',
  !firebaseConfig.storageBucket && 'VITE_FIREBASE_STORAGE_BUCKET',
  !firebaseConfig.messagingSenderId && 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  !firebaseConfig.appId && 'VITE_FIREBASE_APP_ID',
].filter((key): key is string => Boolean(key));

export const isFirebaseConfigured = missingFirebaseEnvKeys.length === 0;

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

export const auth = app ? getAuth(app) : null;
