import type { ReactNode } from "react"

import { DocsShell } from "@/components/docs-shell"
import { getDocsNavGroups } from "@/lib/docs-nav"

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <DocsShell navGroups={getDocsNavGroups()}>{children}</DocsShell>
    </div>
  )
}