import type { ReactNode } from "react"

import { DocsShell } from "@/components/site/docs-shell"
import { source } from "@/lib/source"

export default function Layout({ children }: { children: ReactNode }) {
  return <DocsShell tree={source.getPageTree()}>{children}</DocsShell>
}
