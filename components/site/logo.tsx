import Link from "next/link"

import { cn } from "@/lib/utils"

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 font-mono text-[15px] font-semibold tracking-tight", className)}>
      <span aria-hidden className="text-brand">
        {">_"}
      </span>
      asciicn
    </Link>
  )
}
