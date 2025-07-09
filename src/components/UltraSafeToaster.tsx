"use client"

import React, { memo } from 'react';
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const UltraSafeToaster = memo(({ ...props }: ToasterProps) => {
  // Use memo to prevent unnecessary re-renders
  // Always use light theme to avoid any context issues
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="top-right"
      expand={false}
      richColors={false}
      closeButton={false}
      toastOptions={{
        duration: 4000,
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
});

UltraSafeToaster.displayName = 'UltraSafeToaster';

export { UltraSafeToaster as Toaster }