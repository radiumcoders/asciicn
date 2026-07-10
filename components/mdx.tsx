import { CodeBlock, Pre } from "fumadocs-ui/components/codeblock"
import defaultMdxComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"
import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

function WindowPre(props: ComponentProps<"pre">) {
  const { className, children, ...rest } = props

  return (
    <div className="docs-code-window my-4 border border-border bg-background p-1">
      <CodeBlock
        {...rest}
        className={cn(
          "my-0 rounded-none border border-border bg-card shadow-none",
          className
        )}
      >
        <Pre>{children}</Pre>
      </CodeBlock>
    </div>
  )
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    pre: WindowPre,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}