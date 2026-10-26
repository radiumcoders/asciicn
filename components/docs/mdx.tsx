import type { MDXComponents } from "mdx/types"

import { CodeBlock } from "@/components/docs/code-block"
import { ComponentPreview } from "@/components/docs/component-preview"
import { Heading } from "@/components/docs/heading"
import { Install } from "@/components/docs/install"
import { ComponentGrid } from "@/components/site/component-grid"
import { items } from "@/lib/registry"
import { PropsTable } from "@/components/docs/props-table"
import { registryUrl } from "@/lib/site"

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    pre: CodeBlock,
    h2: (props) => <Heading as="h2" {...props} />,
    h3: (props) => <Heading as="h3" {...props} />,
    ComponentPreview,
    PropsTable,
    ComponentIndex: () => (
      <div className="not-prose my-6">
        <ComponentGrid items={items.map(({ name, title, description }) => ({ name, title, description }))} compact />
      </div>
    ),
    Install: ({ name }: { name: string }) => <Install url={registryUrl(name)} />,
    ...components,
  }
}
