import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
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
  return signInWithPopup(assertFirebaseAuth(), provider);
}
