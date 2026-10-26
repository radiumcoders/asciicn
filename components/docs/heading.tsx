import type * as React from "react"

import { cn } from "@/lib/utils"

// h2/h3 with a hover anchor; the whole heading links to itself.
export function Heading({ as: Tag, id, children, className, ...props }: React.ComponentProps<"h2"> & { as: "h2" | "h3" }) {
  if (!id) return <Tag className={className} {...props}>{children}</Tag>

  return (
    <Tag id={id} className={cn("group", className)} {...props}>
      <a href={`#${id}`} className="inline-flex items-center gap-2">
        {children}
        <span
          aria-hidden
          className="-translate-x-1 font-mono text-[0.8em] font-normal text-dim/50 opacity-0 transition-[opacity,translate] duration-200 group-hover:translate-x-0 group-hover:opacity-100"
        >
          #
        </span>
      </a>
    </Tag>
  )
}
