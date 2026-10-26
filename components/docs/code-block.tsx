"use client"

import * as React from "react"

import { CopyButton } from "@/components/docs/copy-button"
import { cn } from "@/lib/utils"

// MDX `pre` override: a plate surface with a copy button.
export function CodeBlock({ className, children, ...props }: React.ComponentProps<"pre">) {
  const ref = React.useRef<HTMLPreElement>(null)

  return (
    <div className="group relative my-5 rounded-xl bg-plate">
      <pre
        ref={ref}
        className={cn(
          "max-h-[32rem] overflow-auto py-4 pr-12 pl-4 font-mono text-[13px] leading-6 [&_.line]:inline-block",
          className
        )}
        {...props}
      >
        {children}
      </pre>
      <CopyButton
        value={() => ref.current?.textContent ?? ""}
        className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      />
    </div>
  )
}
