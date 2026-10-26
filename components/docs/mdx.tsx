import type { MDXComponents } from "mdx/types"

import { CodeBlock } from "@/components/docs/code-block"
import { ComponentPreview } from "@/components/docs/component-preview"
import { Install } from "@/components/docs/install"
import { PropsTable } from "@/components/docs/props-table"
import { registryUrl } from "@/lib/site"

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    pre: CodeBlock,
    ComponentPreview,
    PropsTable,
    Install: ({ name }: { name: string }) => <Install url={registryUrl(name)} />,
    ...components,
  }
}
