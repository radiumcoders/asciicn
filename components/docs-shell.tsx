import Link from "next/link"
import type { ReactNode } from "react"

import { DocsSidebar } from "@/components/docs-sidebar"
import type { DocsNavGroup } from "@/lib/docs-nav"

type DocsShellProps = {
  children: ReactNode
  navGroups: DocsNavGroup[]
}

export function DocsShell({ children, navGroups }: DocsShellProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 gap-1 overflow-hidden bg-background text-foreground">
      <DocsSidebar
        navGroups={navGroups}
        brand={
          <Link
            href="/"
            className="font-heading text-sm tracking-tight text-foreground transition-opacity hover:opacity-80"
          >
            asciicn
          </Link>
        }
      />
      <main className="docs-scroll min-h-0 min-w-0 flex-1 overflow-y-auto border border-border bg-background">
        {children}
      </main>
    </div>
  )
}