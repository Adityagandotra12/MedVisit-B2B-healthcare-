/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

export type ViewMode = 'grid' | 'list';

interface UIState {
  viewMode: ViewMode;
  notifications: string[];
}

type UIAction =
  | { type: 'TOGGLE_VIEW' }
  | { type: 'PUSH_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' };

interface UIContextValue extends UIState {
  toggleViewMode: () => void;
  pushNotification: (message: string) => void;
  clearNotifications: () => void;
}

const initialState: UIState = {
  viewMode: 'grid',
  notifications: [],
};

const uiReducer = (state: UIState, action: UIAction): UIState => {
  switch (action.type) {
    case 'TOGGLE_VIEW':
      return { ...state, viewMode: state.viewMode === 'grid' ? 'list' : 'grid' };
    case 'PUSH_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 10),
      };
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    default:
      return state;
  }
};

export const UIContext = createContext<UIContextValue | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(uiReducer, initialState);

  const value = useMemo(
    () => ({
      ...state,
      toggleViewMode: () => dispatch({ type: 'TOGGLE_VIEW' }),
      pushNotification: (message: string) =>
        dispatch({ type: 'PUSH_NOTIFICATION', payload: message }),
      clearNotifications: () => dispatch({ type: 'CLEAR_NOTIFICATIONS' }),
    }),
    [state],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}
