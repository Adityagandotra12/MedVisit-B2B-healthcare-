import { useContext } from 'react';
import { PatientContext } from '../context/PatientContext';

export function usePatients() {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatients must be used within PatientProvider');
  }
  return context;
}
