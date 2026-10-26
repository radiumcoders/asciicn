import type * as React from "react"

import { cn } from "@/lib/utils"

export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 -translate-y-px items-center justify-center border border-line bg-sheet px-1.5 align-middle font-mono text-[11px] leading-none font-medium text-ink",
        className
      )}
      {...props}
    />
  )
}
