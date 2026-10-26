import type * as React from "react"

import { cn } from "@/lib/utils"

type CalloutType = "note" | "tip" | "warn"

// A quiet aside: a ruled box, with a warm edge when it's a warning.
export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: CalloutType
  title?: string
  children: React.ReactNode
}) {
  return (
    <aside className={cn("my-6 border border-line px-4 py-3.5", type === "warn" && "border-l-2 border-l-brand")}>
      <div className="callout-body min-w-0 text-[14px] leading-6 text-dim">
        {title ? <p className="mb-1 font-medium text-ink">{title}</p> : null}
        {children}
      </div>
    </aside>
  )
}
