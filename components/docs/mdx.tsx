import type { MDXComponents } from "mdx/types"

import { Callout } from "@/components/docs/callout"
import { CodeBlock } from "@/components/docs/code-block"
import { ComponentPreview } from "@/components/docs/component-preview"
import { File, Files, Folder } from "@/components/docs/files"
import { Heading } from "@/components/docs/heading"
import { Install } from "@/components/docs/install"
import { Kbd } from "@/components/docs/kbd"
import { PropsTable } from "@/components/docs/props-table"
import { SiteCode } from "@/components/docs/site-code"
import { Steps } from "@/components/docs/steps"
import { Tab, Tabs } from "@/components/docs/tabs"
import { ComponentGrid } from "@/components/site/component-grid"
import { items } from "@/lib/registry"
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
    Steps,
    Callout,
    Kbd,
    Tabs,
    Tab,
    Files,
    Folder,
    File,
    SiteCode,
    ...components,
  }
}
