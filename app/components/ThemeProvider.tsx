'use client';

import React, { createContext, useContext } from 'react';

// Create a dummy context that provides no theme functionality
const ThemeContext = createContext({});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeContext.Provider value={{}}>
      {children}
    </ThemeContext.Provider>
  );
}

// Export a dummy useTheme function that returns empty values
export function useTheme() {
  return {
    theme: 'light',
    toggleTheme: () => {},
    isAutoMode: false,
    setAutoMode: () => {}
  };
}