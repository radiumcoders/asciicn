import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface ComponentPreviewProps {
  children: ReactNode
  className?: string
  title?: string
}

export function ComponentPreview({
  children,
  className,
  title = "Preview",
}: ComponentPreviewProps) {
  return (
    <div className="docs-component-preview my-4 border border-border bg-background">
      <div className="border-b border-border px-2 py-1 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
        {title}
      </div>
      <div
        className={cn(
          "flex min-h-128 flex-wrap items-center justify-center gap-3 p-6",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}