import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

// Simple local storage hook
function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Failed to read from localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setStoredValue = (newValue: T) => {
    try {
      setValue(newValue);
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error(`Error saving to localStorage key "${key}":`, error);
    }
  };

  return [value, setStoredValue];
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme'
}: ThemeProviderProps) {
  const [theme, setTheme] = useLocalStorage<Theme>(storageKey, defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    const root = window.document.documentElement;
    
    const updateTheme = () => {
      let effectiveTheme: 'dark' | 'light';
      
      try {
        if (theme === 'system') {
          effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
            ? 'dark' 
            : 'light';
        } else {
          effectiveTheme = theme;
        }
        
        setResolvedTheme(effectiveTheme);
        
        root.classList.remove('light', 'dark');
        root.classList.add(effectiveTheme);
        
        // Set CSS custom property for compatibility
        root.style.colorScheme = effectiveTheme;
      } catch (error) {
        console.error('Error updating theme:', error);
        // Fallback to light theme
        setResolvedTheme('light');
        root.classList.remove('light', 'dark');
        root.classList.add('light');
        root.style.colorScheme = 'light';
      }
    };

    updateTheme();

    // Listen for system theme changes
    let mediaQuery: MediaQueryList | null = null;
    let handleChange: (() => void) | null = null;

    try {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      handleChange = () => {
        if (theme === 'system') {
          updateTheme();
        }
      };

      mediaQuery.addEventListener('change', handleChange);
    } catch (error) {
      console.warn('Failed to set up media query listener:', error);
    }

    return () => {
      if (mediaQuery && handleChange) {
        try {
          mediaQuery.removeEventListener('change', handleChange);
        } catch (error) {
          console.warn('Failed to remove media query listener:', error);
        }
      }
    };
  }, [theme]);

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

export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    const error = new Error('useTheme must be used within a ThemeProvider');
    console.error('ThemeProvider Error:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
  
  return context;
}