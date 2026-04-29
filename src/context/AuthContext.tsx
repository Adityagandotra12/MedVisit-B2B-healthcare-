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
import { auth, isFirebaseConfigured } from '../services/firebase';
import { loginWithEmailPassword } from '../services/auth';

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
  logout: () => Promise<void>;
  isFirebaseConfigured: boolean;
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
  if (authError?.code === 'auth/invalid-credential') {
    return 'Invalid email or password.';
  }
  if (authError?.code === 'auth/too-many-requests') {
    return 'Too many attempts. Try again later.';
  }
  return 'Unable to sign in. Please try again.';
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
        payload: 'Firebase is not configured. Set VITE_FIREBASE_* variables.',
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      dispatch({ type: 'AUTH_INIT', payload: user });
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
        logout,
        isFirebaseConfigured,
        role,
        isAdmin: role === 'admin',
        isDoctor: role === 'doctor',
        doctorName,
      };
    },
    [login, logout, state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
