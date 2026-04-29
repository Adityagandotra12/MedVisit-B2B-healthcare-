import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebase';

export async function loginWithEmailPassword(email: string, password: string) {
  if (!auth || !isFirebaseConfigured) {
    throw new Error('Firebase not configured');
  }

  return signInWithEmailAndPassword(auth, email, password);
}
