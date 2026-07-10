import defaultMdxComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"

import { CliBlock } from "@/components/docs/cli-block"
import { Cmd } from "@/components/docs/cmd"
import { DocsCodeView, DocsInlineCode } from "@/components/docs/code-view"
import { ComponentPreview } from "@/components/docs/component-preview"

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    pre: DocsCodeView,
    code: DocsInlineCode,
    ComponentPreview,
    CliBlock,
    Cmd,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}