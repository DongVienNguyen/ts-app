import { useEffect, useRef } from 'react';

interface LightThemeForcerProps {
  children: React.ReactNode;
  className?: string;
}

export const LightThemeForcer: React.FC<LightThemeForcerProps> = ({ 
  children, 
  className = '' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const forceLightTheme = () => {
      // Force light theme on container and all children
      container.style.backgroundColor = '#ffffff';
      container.style.color = '#111827';
      container.classList.remove('dark');
      container.removeAttribute('data-theme');

      // Force light theme on all child elements
      const allElements = container.querySelectorAll('*');
      allElements.forEach((element) => {
        const el = element as HTMLElement;
        el.classList.remove('dark');
        el.removeAttribute('data-theme');
        
        // Force specific dark backgrounds to white
        if (el.classList.contains('bg-slate-900') || 
            el.classList.contains('bg-gray-900') ||
            el.classList.contains('bg-zinc-900') ||
            el.classList.contains('bg-neutral-900') ||
            el.classList.contains('bg-stone-900') ||
            el.classList.contains('bg-black')) {
          el.style.backgroundColor = '#ffffff';
          el.style.color = '#111827';
        }
      });
    };

    // Apply immediately
    forceLightTheme();

    // Set up mutation observer
    const observer = new MutationObserver(() => {
      forceLightTheme();
    });

    observer.observe(container, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['class', 'data-theme', 'style']
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`bg-white text-gray-900 ${className}`}
      style={{ 
        backgroundColor: '#ffffff', 
        color: '#111827',
        colorScheme: 'light'
      }}
    >
      {children}
    </div>
  );
};

export default LightThemeForcer;