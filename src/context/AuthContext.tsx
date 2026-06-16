/* eslint-disable react-refresh/only-export-components */
import { onAuthStateChanged, signOut, type AuthError, type User } from 'firebase/auth';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { auth, isFirebaseConfigured, missingFirebaseEnvKeys } from '../services/firebase';
import { loginWithEmailPassword, loginWithGoogle, completeGoogleRedirectSignIn } from '../services/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  authReady: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_INIT'; payload: User | null }
  | { type: 'AUTH_LOADING'; payload: boolean }
  | { type: 'AUTH_ERROR'; payload: string | null };

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isFirebaseConfigured: boolean;
  missingFirebaseEnvKeys: readonly string[];
  role: 'admin' | 'doctor';
  isAdmin: boolean;
  isDoctor: boolean;
  doctorName: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  authReady: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_INIT':
      return { ...state, user: action.payload, authReady: true };
    case 'AUTH_LOADING':
      return { ...state, loading: action.payload };
    case 'AUTH_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

const mapAuthError = (error: unknown): string => {
  const authError = error as AuthError;
  const code = authError?.code;

  switch (code) {
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    case 'auth/popup-blocked':
      return 'Popup blocked. Allow popups for this site and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'This email is registered with email/password. Sign in with email instead.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase. Add your site URL (e.g. your-app.netlify.app or vercel.app) under Authentication → Settings → Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Turn on Google in Firebase Authentication → Sign-in method.';
    case 'auth/network-request-failed':
      return import.meta.env.PROD
        ? 'Cannot reach Firebase from this site. In Google Cloud → Credentials → API key, allow HTTP referrers for your deployed domain (e.g. https://*.netlify.app/*).'
        : 'Network error. Check your connection and try again.';
    case 'auth/internal-error':
      return 'Google sign-in failed. Enable Google in Firebase and add your Netlify domain to Authorized domains.';
    default:
      if (code) {
        return `Unable to sign in (${code}). Check Firebase Google sign-in and authorized domains.`;
      }
      return 'Unable to sign in. Please try again.';
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const adminEmail = 'admin@healthops.com';
  const inferDoctorName = (email: string | null | undefined): string | null => {
    if (!email) {
      return null;
    }
    const e = email.toLowerCase();
    if (e.includes('aditya')) return 'Dr. Aditya';
    if (e.includes('harini')) return 'Dr. Harini';
    if (e.includes('kapoor')) return 'Dr. Kapoor';
    if (e.includes('shah')) return 'Dr. Shah';
    return null;
  };

  useEffect(() => {
    if (!auth) {
      dispatch({ type: 'AUTH_INIT', payload: null });
      dispatch({
        type: 'AUTH_ERROR',
        payload:
          missingFirebaseEnvKeys.length > 0
            ? `Firebase is not configured. Missing: ${missingFirebaseEnvKeys.join(', ')}. Create .env.local in the project root, then restart npm run dev.`
            : 'Firebase is not configured. Set VITE_FIREBASE_* variables.',
      });
      return;
    }

    const authInstance = auth;
    let redirectProcessed = false;

    // Ignore the initial null auth event until Google redirect sign-in is resolved.
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      if (redirectProcessed || user) {
        dispatch({ type: 'AUTH_INIT', payload: user });
      }
    });

    void completeGoogleRedirectSignIn()
      .then((result) => {
        const signedInUser = result?.user ?? authInstance.currentUser;
        if (signedInUser) {
          dispatch({ type: 'AUTH_INIT', payload: signedInUser });
        }
      })
      .catch((error) => {
        dispatch({ type: 'AUTH_ERROR', payload: mapAuthError(error) });
      })
      .finally(() => {
        redirectProcessed = true;
        dispatch({ type: 'AUTH_INIT', payload: authInstance.currentUser });
        dispatch({ type: 'AUTH_LOADING', payload: false });
      });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    dispatch({ type: 'AUTH_LOADING', payload: true });
    dispatch({ type: 'AUTH_ERROR', payload: null });
    try {
      await loginWithEmailPassword(email, password);
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: mapAuthError(error) });
      throw error;
    } finally {
      dispatch({ type: 'AUTH_LOADING', payload: false });
    }
  }, []);

  const loginWithGoogleHandler = useCallback(async () => {
    dispatch({ type: 'AUTH_LOADING', payload: true });
    dispatch({ type: 'AUTH_ERROR', payload: null });
    try {
      const credential = await loginWithGoogle();
      // Popup sign-in finished; redirect keeps loading until the page returns.
      if (credential) {
        dispatch({ type: 'AUTH_LOADING', payload: false });
      }
    } catch (error) {
      dispatch({ type: 'AUTH_ERROR', payload: mapAuthError(error) });
      dispatch({ type: 'AUTH_LOADING', payload: false });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    if (!auth) {
      return;
    }
    await signOut(auth);
  }, []);

  const value = useMemo(
    () => {
      const role: 'admin' | 'doctor' =
        state.user?.email === adminEmail ? 'admin' : 'doctor';
      const doctorName =
        role === 'doctor' ? inferDoctorName(state.user?.email) : null;
      return {
        ...state,
        login,
        loginWithGoogle: loginWithGoogleHandler,
        logout,
        isFirebaseConfigured,
        missingFirebaseEnvKeys,
        role,
        isAdmin: role === 'admin',
        isDoctor: role === 'doctor',
        doctorName,
      };
    },
    [login, loginWithGoogleHandler, logout, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
