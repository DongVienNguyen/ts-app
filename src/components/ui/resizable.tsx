"use client"

import * as React from "react"
import {
  PanelGroup, // Correct import name
  Panel,      // Correct import name
  PanelResizeHandle, // Correct import name
} from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof PanelGroup>) => (
  <PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Panel>) => (
  <Panel
    className={cn(className)}
    {...props}
  />
)

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <PanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:h-24 after:w-1 after:-translate-x-px after:bg-border after:content-[''] data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-24 data-[panel-group-direction=vertical]:after:-translate-y-px [&[data-panel-group-direction=vertical]>div]:rotate-90",
      withHandle &&
        "after:bg-border after:opacity-0 after:transition-all after:group-hover:opacity-100 after:data-[panel-group-direction=vertical]:-translate-y-px data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-4 items-center justify-center rounded-sm border bg-border">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-2.5 w-2.5"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    )}
  </PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }