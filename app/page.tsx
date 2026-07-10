import Link from "next/link"

import { AsciiBadge } from "@/components/asciicn/ascii-badge"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center p-8 md:p-12">
      <div className="flex max-w-md flex-col gap-6 text-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-lg tracking-tight">asciicn</h1>
            <AsciiBadge>registry</AsciiBadge>
          </div>
          <p className="leading-relaxed text-muted-foreground">
            Monochrome components distributed as a shadcn registry. Docs run on
            Fumadocs; registry JSON is generated from{" "}
            <code className="font-mono text-xs">components/asciicn</code>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button nativeButton={false} render={<Link href="/docs" />}>
            Introduction
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/docs/getting-started" />}
          >
            Getting started
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Press <kbd className="border border-border px-1">d</kbd> to toggle
          theme
        </p>
      </div>
    </div>
  )
}