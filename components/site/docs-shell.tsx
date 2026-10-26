"use client"

import type * as PageTree from "fumadocs-core/page-tree"
import { AnimatePresence, motion } from "motion/react"
import { usePathname } from "next/navigation"
import * as React from "react"

import { GithubLink } from "@/components/site/github-link"
import { Logo } from "@/components/site/logo"
import { SearchTrigger } from "@/components/site/search"
import { ShortcutsProvider, useShortcuts } from "@/components/site/shortcuts"
import { SidebarNav } from "@/components/site/sidebar-nav"
import { ThemeToggle } from "@/components/site/theme-toggle"

export function DocsShell({ tree, children }: { tree: PageTree.Root; children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => setMenuOpen(false), [pathname])

  return (
    <ShortcutsProvider>
      <div className="min-h-svh">
        {/* Desktop sidebar, ruled off from the page. */}
        <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-line bg-ground px-3 py-4 md:flex">
          <Logo className="px-2.5 py-1" />
          <SearchTrigger className="mt-5" />
          <div className="-mx-3 mt-5 flex-1 overflow-y-auto px-3 pb-4">
            <SidebarNav tree={tree} />
          </div>
          <div className="-mx-3 flex items-center gap-1 border-t border-line px-3 pt-3">
            <GithubLink />
            <ThemeToggle />
            <ShortcutsButton />
            <span className="ml-auto pr-2 font-mono text-[11px] text-dim/60">v0.1.0</span>
          </div>
        </aside>

        {/* Mobile top bar. */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-ground/90 px-4 backdrop-blur md:hidden">
          <Logo />
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="inline-flex size-8 items-center justify-center text-dim hover:bg-wash hover:text-ink"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" className="size-4">
                {menuOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 8h16M4 16h16" />}
              </svg>
            </button>
          </div>
        </header>

        <AnimatePresence>
          {menuOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              className="fixed inset-x-0 top-14 bottom-0 z-30 overflow-y-auto bg-ground px-4 pt-2 pb-8 md:hidden"
            >
              <SearchTrigger className="mb-5" />
              <SidebarNav tree={tree} onNavigate={() => setMenuOpen(false)} />
              <div className="mt-8 flex items-center justify-between px-1">
                <GithubLink />
                <span className="pr-2 font-mono text-[11px] text-dim/60">v0.1.0</span>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <main className="md:pl-60">
          <div className="min-h-svh bg-sheet">
            {children}
          </div>
        </main>
      </div>
    </ShortcutsProvider>
  )
}

function ShortcutsButton() {
  const open = useShortcuts()
  return (
    <button
      type="button"
      aria-label="Keyboard shortcuts"
      title="Keyboard shortcuts (?)"
      onClick={open}
      className="inline-flex size-8 items-center justify-center font-mono text-[13px] text-dim transition-colors hover:bg-wash hover:text-ink"
    >
      ?
    </button>
  )
}
