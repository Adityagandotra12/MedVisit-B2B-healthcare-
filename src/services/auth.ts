import {
  browserLocalPersistence,
  getRedirectResult,
  GoogleAuthProvider,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  type AuthError,
  type UserCredential,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

function assertFirebaseAuth() {
  if (!auth || !isFirebaseConfigured) {
    throw new Error('Firebase not configured');
  }
  return auth;
}

export async function loginWithEmailPassword(email: string, password: string) {
  return signInWithEmailAndPassword(assertFirebaseAuth(), email, password);
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const authInstance = assertFirebaseAuth();
  await setPersistence(authInstance, browserLocalPersistence);

  // Popups often fail silently on deployed sites after account selection.
  if (import.meta.env.PROD) {
    await signInWithRedirect(authInstance, provider);
    return;
  }

  try {
    return await signInWithPopup(authInstance, provider);
  } catch (error) {
    const authError = error as AuthError;
    if (authError?.code === 'auth/popup-blocked') {
      await signInWithRedirect(authInstance, provider);
      return;
    }
    throw error;
  }
}

// getRedirectResult can only be consumed once per redirect. Cache the promise so
// React Strict Mode (double mount in dev) does not call it twice.
let redirectResultPromise: Promise<UserCredential | null> | null = null;

export function completeGoogleRedirectSignIn() {
  if (!auth || !isFirebaseConfigured) {
    return Promise.resolve(null);
  }
  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(auth);
  }
  return redirectResultPromise;
}
