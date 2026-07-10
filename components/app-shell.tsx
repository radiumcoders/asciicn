"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { isNavLinkActive } from "@/lib/docs-nav"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Home" },
  { href: "/docs", label: "Introduction" },
  { href: "/docs/getting-started", label: "Getting Started" },
  { href: "/docs/components", label: "Components" },
]

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full min-h-0 flex-1">
      <aside className="docs-scroll hidden h-full w-52 shrink-0 self-stretch overflow-y-auto border-r border-border bg-background p-4 text-foreground md:flex md:flex-col">
        <div className="flex min-h-full flex-1 flex-col">
          <div className="flex flex-col gap-6">
            <Link
              href="/"
              className="font-heading text-sm tracking-tight text-sidebar-foreground"
            >
              asciicn
            </Link>

            <nav className="flex flex-col gap-0.5">
              {navItems.map((item) => {
                const isActive = isNavLinkActive(pathname, item.href)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-none px-2.5 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="mt-auto border-t border-sidebar-border pt-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Press <kbd className="border border-border px-1">d</kbd> for
              theme
            </p>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}