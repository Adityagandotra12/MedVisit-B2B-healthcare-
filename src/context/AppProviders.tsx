import type { ReactNode } from 'react';
import { AuthProvider } from './AuthContext';
import { PatientProvider } from './PatientContext';
import { UIProvider } from './UIContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PatientProvider>
        <UIProvider>{children}</UIProvider>
      </PatientProvider>
    </AuthProvider>
  );
}
