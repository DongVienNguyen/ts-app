import { createContext, useContext, ReactNode } from 'react';

// Only light theme supported
type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Always light theme - no state needed, no effects needed
  const theme: Theme = 'light';
  const resolvedTheme: 'light' = 'light';

  // No-op setTheme function - always stays light
  const setTheme = () => {
    console.log('Theme is locked to light mode');
    // Do nothing - always stay light
  };

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    // Return safe fallback - always light
    return {
      theme: 'light',
      setTheme: () => {},
      resolvedTheme: 'light'
    };
  }
  
  return context;
}

export { ThemeContext };