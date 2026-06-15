import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithRedirect,
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
  // Redirect avoids popup blockers on Vercel and mobile browsers.
  await signInWithRedirect(assertFirebaseAuth(), provider);
}

export async function completeGoogleRedirectSignIn() {
  if (!auth || !isFirebaseConfigured) {
    return null;
  }
  return getRedirectResult(auth);
}
