import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export function DocsCodeBlock(props: ComponentProps<"pre">) {
  const { className, children, ...rest } = props

  return (
    <CodeBlock
      {...rest}
      viewportProps={{ className: "py-0.5" }}
      className={cn(
        "docs-code-block my-4 rounded-none p-2 border border-border bg-card shadow-none",
        className
      )}
    >
      <Pre>{children}</Pre>
    </CodeBlock>
  )
}