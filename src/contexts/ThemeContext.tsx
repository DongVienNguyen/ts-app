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

  // Aggressive light theme forcing function
  const forceLightTheme = useCallback(() => {
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
      
      // Force all dark background elements to white
      const darkElements = document.querySelectorAll(`
        .bg-slate-900, .bg-gray-900, .bg-zinc-900, .bg-neutral-900, .bg-stone-900, .bg-black,
        .bg-slate-800, .bg-gray-800, .bg-zinc-800, .bg-neutral-800, .bg-stone-800,
        .bg-slate-700, .bg-gray-700, .bg-zinc-700, .bg-neutral-700, .bg-stone-700,
        [class*="bg-slate-9"], [class*="bg-gray-9"], [class*="bg-zinc-9"],
        [class*="bg-neutral-9"], [class*="bg-stone-9"], [class*="bg-black"]
      `);
      
      darkElements.forEach((element) => {
        const el = element as HTMLElement;
        el.style.backgroundColor = '#ffffff';
        el.style.color = '#111827';
        el.classList.add('force-light-bg');
      });

      // Force all white text elements to dark
      const whiteTextElements = document.querySelectorAll(`
        .text-white, .text-slate-100, .text-gray-100, .text-zinc-100, 
        .text-neutral-100, .text-stone-100,
        [class*="text-white"], [class*="text-slate-1"], [class*="text-gray-1"],
        [class*="text-zinc-1"], [class*="text-neutral-1"], [class*="text-stone-1"]
      `);
      
      whiteTextElements.forEach((element) => {
        const el = element as HTMLElement;
        // Don't change text color if it's inside a primary button
        if (!el.closest('.bg-primary') && !el.closest('[class*="bg-primary"]')) {
          el.style.color = '#111827';
          el.classList.add('force-light-text');
        }
      });

      // Force all form elements
      const formElements = document.querySelectorAll('input, textarea, select, form, .card, [class*="card"]');
      formElements.forEach((element) => {
        const el = element as HTMLElement;
        el.style.backgroundColor = '#ffffff';
        el.style.color = '#111827';
        el.style.borderColor = '#e5e7eb';
      });
      
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
  }, [storageKey]);

  // Effect to force light theme
  useEffect(() => {
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
        
        // Check for added nodes with dark classes
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              const hasDarkClass = element.classList && (
                element.classList.contains('dark') ||
                element.classList.toString().includes('bg-slate-9') ||
                element.classList.toString().includes('bg-gray-9') ||
                element.classList.toString().includes('bg-zinc-9') ||
                element.classList.toString().includes('bg-black')
              );
              
              if (hasDarkClass) {
                needsForce = true;
              }
            }
          });
        }
      });
      
      if (needsForce) {
        console.log('🚫 [THEME] Dark theme detected, forcing light theme');
        setTimeout(forceLightTheme, 0); // Use setTimeout to avoid infinite loops
      }
    });

    // Observe changes to html and body
    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'data-theme', 'style']
    });

    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'data-theme', 'style']
    });

    // Also force on window focus (in case other scripts change theme)
    const handleFocus = () => {
      forceLightTheme();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        forceLightTheme();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic check every 2 seconds
    const interval = setInterval(forceLightTheme, 2000);

    // Cleanup
    return () => {
      observer.disconnect();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [forceLightTheme]);

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