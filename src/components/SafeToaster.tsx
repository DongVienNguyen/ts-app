"use client"

import React, { Component, ReactNode } from 'react';
import { Toaster as Sonner } from "sonner"

// Error Boundary for Toaster
class ToasterErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('Toaster Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback to basic Sonner without theme
      return (
        <Sonner
          theme="light"
          className="toaster group"
        />
      );
    }

    return this.props.children;
  }
}

// Safe theme hook
function useSafeTheme() {
  try {
    // Dynamic import to avoid issues during SSR or initial render
    const { useTheme } = require("@/contexts/ThemeContext");
    return useTheme();
  } catch (error) {
    console.warn('Failed to load ThemeContext, using fallback:', error);
    return {
      theme: 'light' as const,
      setTheme: () => {},
      resolvedTheme: 'light' as const
    };
  }
}

type ToasterProps = React.ComponentProps<typeof Sonner>

const SafeToasterInner = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useSafeTheme();

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

const SafeToaster = (props: ToasterProps) => {
  return (
    <ToasterErrorBoundary>
      <SafeToasterInner {...props} />
    </ToasterErrorBoundary>
  );
};

export { SafeToaster as Toaster }