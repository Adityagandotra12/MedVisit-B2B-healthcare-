/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';
import { mockPatients } from '../features/patients/data/mockPatients';
import type { Patient } from '../features/patients/types';

interface PatientState {
  patients: Patient[];
}

type PatientAction =
  | { type: 'ADD_PATIENT'; payload: Patient }
  | { type: 'UPDATE_PATIENT'; payload: Patient }
  | { type: 'REMOVE_PATIENT'; payload: string };

interface PatientContextValue {
  patients: Patient[];
  addPatient: (patient: Patient) => void;
  updatePatient: (patient: Patient) => void;
  removePatient: (patientId: string) => void;
}

const initialState: PatientState = {
  patients: mockPatients,
};

const patientReducer = (
  state: PatientState,
  action: PatientAction,
): PatientState => {
  switch (action.type) {
    case 'ADD_PATIENT':
      return { ...state, patients: [action.payload, ...state.patients] };
    case 'UPDATE_PATIENT':
      return {
        ...state,
        patients: state.patients.map((patient) =>
          patient.id === action.payload.id ? action.payload : patient,
        ),
      };
    case 'REMOVE_PATIENT':
      return {
        ...state,
        patients: state.patients.filter((patient) => patient.id !== action.payload),
      };
    default:
      return state;
  }
};

export const PatientContext = createContext<PatientContextValue | undefined>(
  undefined,
);

export function PatientProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(patientReducer, initialState);

  const value = useMemo(
    () => ({
      patients: state.patients,
      addPatient: (patient: Patient) =>
        dispatch({ type: 'ADD_PATIENT', payload: patient }),
      updatePatient: (patient: Patient) =>
        dispatch({ type: 'UPDATE_PATIENT', payload: patient }),
      removePatient: (patientId: string) =>
        dispatch({ type: 'REMOVE_PATIENT', payload: patientId }),
    }),
    [state.patients],
  );

  return (
    <PatientContext.Provider value={value}>{children}</PatientContext.Provider>
  );
}
