import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

type Theme = 'light'; // Only allow light theme

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({ 
  children, 
  defaultTheme = 'light',
  storageKey = 'vite-ui-theme'
}: ThemeProviderProps) {
  // Always force light theme
  const [theme] = useState<Theme>('light');
  const [resolvedTheme] = useState<'light'>('light');

  // Memoized setTheme function (does nothing, always light)
  const setTheme = useCallback((newTheme: Theme) => {
    console.log('🌞 [THEME] Theme change blocked, forcing light theme');
    // Always stay light, ignore theme changes
  }, []);

  // Effect to force light theme
  useEffect(() => {
    const forceLightTheme = () => {
      try {
        console.log('🌞 [THEME] Forcing light theme...');
        
        const root = document.documentElement;
        const body = document.body;
        
        // Remove all dark theme classes and attributes
        root.classList.remove('dark');
        root.removeAttribute('data-theme');
        body.classList.remove('dark');
        body.removeAttribute('data-theme');
        
        // Set light color scheme
        root.style.colorScheme = 'light';
        body.style.colorScheme = 'light';
        
        // Force light colors
        root.style.backgroundColor = '#ffffff';
        root.style.color = '#111827';
        body.style.backgroundColor = '#ffffff';
        body.style.color = '#111827';
        
        // Clear any stored dark theme preferences
        try {
          localStorage.removeItem(storageKey);
          localStorage.removeItem('theme');
          localStorage.removeItem('dark-mode');
          localStorage.removeItem('color-scheme');
        } catch (error) {
          console.warn('Failed to clear theme storage:', error);
        }
        
        console.log('✅ [THEME] Light theme forced successfully');
      } catch (error) {
        console.error('❌ [THEME] Failed to force light theme:', error);
      }
    };

    // Apply immediately
    forceLightTheme();

    // Set up mutation observer to prevent dark theme
    const observer = new MutationObserver((mutations) => {
      let needsForce = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const target = mutation.target as Element;
          if (target === document.documentElement || target === document.body) {
            const classList = target.classList;
            const dataTheme = target.getAttribute('data-theme');
            
            if (classList.contains('dark') || dataTheme === 'dark') {
              needsForce = true;
            }
          }
        }
      });
      
      if (needsForce) {
        console.log('🚫 [THEME] Dark theme detected, forcing light theme');
        forceLightTheme();
      }
    });

    // Observe changes to html and body
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style']
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style']
    });

    // Also force on window focus (in case other scripts change theme)
    const handleFocus = () => {
      forceLightTheme();
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      observer.disconnect();
      window.removeEventListener('focus', handleFocus);
    };
  }, [storageKey]);

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