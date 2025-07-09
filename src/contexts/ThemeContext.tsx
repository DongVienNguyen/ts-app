import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

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

export function ThemeProvider({ 
  children, 
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme'
}: ThemeProviderProps) {
  // Initialize theme from localStorage or default
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? (JSON.parse(stored) as Theme) : defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  // Initialize resolved theme
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => {
    if (theme === 'system') {
      try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } catch {
        return 'light';
      }
    }
    return theme;
  });

  // Memoized setTheme function
  const setTheme = useCallback((newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      localStorage.setItem(storageKey, JSON.stringify(newTheme));
    } catch (error) {
      console.error('Failed to save theme to localStorage:', error);
      setThemeState(newTheme);
    }
  }, [storageKey]);

  // Effect to update resolved theme and DOM
  useEffect(() => {
    const updateResolvedTheme = () => {
      let effective: 'dark' | 'light';
      
      if (theme === 'system') {
        try {
          effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } catch {
          effective = 'light';
        }
      } else {
        effective = theme;
      }
      
      setResolvedTheme(effective);
      
      // Update DOM
      try {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(effective);
        root.style.colorScheme = effective;
      } catch (error) {
        console.error('Failed to update DOM theme:', error);
      }
    };

    updateResolvedTheme();

    // Listen for system theme changes only if theme is 'system'
    if (theme === 'system') {
      try {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => updateResolvedTheme();
        
        mediaQuery.addEventListener('change', handleChange);
        
        return () => {
          mediaQuery.removeEventListener('change', handleChange);
        };
      } catch (error) {
        console.warn('Failed to set up media query listener:', error);
      }
    }
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

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    // Return safe fallback instead of throwing
    console.warn('useTheme must be used within a ThemeProvider');
    return {
      theme: 'light',
      setTheme: () => {},
      resolvedTheme: 'light'
    };
  }
  
  return context;
}

// Export ThemeContext for direct access
export { ThemeContext };