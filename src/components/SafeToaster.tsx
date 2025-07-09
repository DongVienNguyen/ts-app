"use client"

import React, { Component, ReactNode, useContext } from 'react';
import { Toaster as Sonner } from "sonner"
import { ThemeContext } from "@/contexts/ThemeContext";

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
        />
      );
    }

    return this.props.children;
  }
}

// Safe theme hook using direct useContext
function useSafeTheme() {
  try {
    const context = useContext(ThemeContext);
    if (context) {
      return context;
    }
    // Fallback if context is not available
    return {
      theme: 'light' as const,
      setTheme: () => {},
      resolvedTheme: 'light' as const
    };
  } catch (error) {
    console.warn('Failed to access ThemeContext, using fallback:', error);
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