"use client"

import { useTheme } from "@/contexts/ThemeContext"
import { Toaster as Sonner } from "sonner"
import React from "react"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  // Safe theme access with error boundary
  const getTheme = (): 'light' | 'dark' => {
    try {
      const { resolvedTheme } = useTheme();
      return resolvedTheme;
    } catch (error) {
      // Log the error for debugging but don't crash the app
      console.warn('ThemeProvider not available, falling back to light theme:', error);
      return 'light';
    }
  };

  const theme = getTheme();

  return (
    <Sonner
      theme={theme}
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

export { Toaster }