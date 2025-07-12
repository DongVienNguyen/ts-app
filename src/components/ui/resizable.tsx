"use client"

import * as React from "react"
import {
  PanelGroup,
  Panel,
  PanelResizeHandle,
} from "react-resizable-panels"
import { GripVertical } from "lucide-react" // Import GripVertical

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
        <GripVertical className="h-2.5 w-2.5" /> {/* Sử dụng GripVertical */}
      </div>
    )}
  </PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }