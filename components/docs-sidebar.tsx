"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { RiCloseLine, RiMenuLine } from "@remixicon/react"

import { isNavLinkActive, type DocsNavGroup } from "@/lib/docs-nav"
import { cn } from "@/lib/utils"

type DocsSidebarProps = {
  navGroups: DocsNavGroup[]
  brand: ReactNode
}

function DocsNavGroup({
  title,
  pages,
  defaultPageUrl,
}: {
  title: string
  pages: DocsNavGroup["pages"]
  defaultPageUrl?: string
}) {
  const pathname = usePathname()

  if (pages.length === 0) return null

  return (
    <div className="flex flex-col gap-1.5">
      <p className="px-2.5 font-mono text-[10px] font-medium tracking-wide text-sidebar-foreground/50 uppercase">
        {title}
      </p>
      <nav className="flex flex-col gap-px">
        {pages.map((page) => {
          const active =
            isNavLinkActive(pathname, page.url) ||
            (pathname === "/docs" && page.url === defaultPageUrl)

          return (
            <Link
              key={page.url}
              href={page.url}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-none px-2.5 py-1.5 font-mono text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                active
                  ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              {page.title}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function DocsSidebar({ navGroups, brand }: DocsSidebarProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const defaultPageUrl = navGroups[0]?.pages[0]?.url

  useEffect(() => {
    const rafId = window.requestAnimationFrame(() => {
      setOpen(false)
    })

    return () => window.cancelAnimationFrame(rafId)
  }, [pathname])

  return (
    <>
      <aside
        className={cn(
          "docs-scroll fixed inset-y-0 left-0 z-50 flex h-svh w-64 shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground transition-transform duration-200 ease-out md:static md:z-auto md:h-full md:min-h-full md:w-52 md:self-stretch md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex min-h-full flex-1 flex-col gap-6">
          <div className="flex items-center justify-between px-0.5">
            {brand}
            <button
              type="button"
              className="inline-flex size-7 items-center justify-center rounded-none text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring md:hidden"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <RiCloseLine className="size-4" />
            </button>
          </div>

          {navGroups.map((group) => (
            <DocsNavGroup
              key={group.title}
              title={group.title}
              pages={group.pages}
              defaultPageUrl={defaultPageUrl}
            />
          ))}
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-foreground/15 backdrop-blur-[2px] md:hidden dark:bg-foreground/25"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      <div className={cn("fixed top-4 left-4 z-50 md:hidden", open && "hidden")}>
        <button
          type="button"
          className="inline-flex size-8 items-center justify-center rounded-none border border-sidebar-border bg-sidebar text-sidebar-foreground/70 shadow-sm transition-colors hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label="Open menu"
        >
          <RiMenuLine className="size-4" />
        </button>
      </div>
    </>
  )
}