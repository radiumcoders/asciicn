import * as React from "react"

import { cn } from "@/lib/utils"

export interface AsciiBadgeProps extends React.ComponentProps<"span"> {
  variant?: "default" | "outline"
}

/**
 * Minimal monochrome badge — sample registry component for asciicn.
 * Install: pnpm dlx shadcn@latest add @asciicn/ascii-badge
 */
function AsciiBadge({
  className,
  variant = "default",
  ...props
}: AsciiBadgeProps) {
  return (
    <span
      data-slot="ascii-badge"
      className={cn(
        "inline-flex items-center border border-border px-1.5 py-0.5 font-mono text-xs tracking-tight",
        variant === "default" && "bg-foreground text-background",
        variant === "outline" && "bg-background text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { AsciiBadge }
