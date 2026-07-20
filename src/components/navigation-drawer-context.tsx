import { createContext, useContext } from 'react';

type NavigationDrawerContextValue = {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const NavigationDrawerContext = createContext<NavigationDrawerContextValue | null>(null);

export const NavigationDrawerProvider = NavigationDrawerContext.Provider;

export function useNavigationDrawer() {
  const context = useContext(NavigationDrawerContext);

  if (!context) {
    throw new Error('useNavigationDrawer must be used inside NavigationDrawerProvider.');
  }

  return context;
}
