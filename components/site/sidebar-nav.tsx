"use client"

import type * as PageTree from "fumadocs-core/page-tree"
import { AnimatePresence, motion } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { useDemo } from "@/components/docs/use-demo"
import { isItemPage } from "@/lib/registry"
import { cn } from "@/lib/utils"

const PEEK_W = 304
const PEEK_H = 236

type Peek = { name: string; title: string; description?: string; top: number }

// The current page is a block cursor; a softer block follows the pointer between rows.
// Resting on a component opens a live peek beside the sidebar; once open it follows you.
export function SidebarNav({ tree, onNavigate }: { tree: PageTree.Root; onNavigate?: () => void }) {
  const pathname = usePathname()
  const [hover, setHover] = React.useState<{ top: number; height: number; jump: boolean; on: boolean } | null>(null)
  const navRef = React.useRef<HTMLElement>(null)
  const [peek, setPeek] = React.useState<Peek | null>(null)
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  const id = React.useId()
  const canPeek = !onNavigate

  React.useEffect(() => () => clearTimeout(timer.current), [])
  React.useEffect(() => setPeek(null), [pathname])

  const enter = (node: PageTree.Item, element: HTMLElement) => {
    const top = element.getBoundingClientRect().top - navRef.current!.getBoundingClientRect().top
    // Coming in from outside, the block appears where you are instead of sliding from where you left.
    setHover((current) => ({ top, height: element.offsetHeight, jump: !current?.on, on: true }))
    clearTimeout(timer.current)
    if (!canPeek || !isItemPage(node.url)) {
      timer.current = setTimeout(() => setPeek(null), peek ? 80 : 0)
      return
    }
    const rect = element.getBoundingClientRect()
    const next: Peek = {
      name: node.url.split("/").pop()!,
      title: String(node.name),
      description: typeof node.description === "string" ? node.description : undefined,
      top: Math.min(Math.max(rect.top + rect.height / 2 - PEEK_H / 2, 12), innerHeight - PEEK_H - 12),
    }
    // The first peek waits for intent; after that it's instant.
    if (peek) setPeek(next)
    else timer.current = setTimeout(() => setPeek(next), 420)
  }

  const leave = () => {
    // Fade out in place: keep the last row so nothing collapses.
    setHover((current) => (current ? { ...current, on: false } : null))
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setPeek(null), 120)
  }

  return (
    <nav ref={navRef} className="relative flex flex-col gap-6" onPointerLeave={leave}>
      {/* One hover block for the whole list: it slides between rows and fades at the edges. */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 bg-wash"
        initial={false}
        animate={hover ? { y: hover.top, height: hover.height, opacity: hover.on ? 1 : 0 } : { opacity: 0 }}
        transition={{
          y: hover?.jump ? { duration: 0 } : { type: "spring", duration: 0.3, bounce: 0.1 },
          height: { duration: 0 },
          opacity: { duration: 0.15 },
        }}
      />
      {groupTree(tree.children).map((group, i) => (
        <div key={i}>
          {group.title ? (
            <p className="mb-1.5 flex items-center gap-2 px-2.5 font-mono text-[11px] tracking-wide text-dim/70 uppercase">
              {group.title}
            </p>
          ) : null}
          <ul className="flex flex-col gap-px">
            {group.pages.map((node) => {
              const active = pathname === node.url
              return (
                <li key={node.url}>
                  <Link
                    href={node.url}
                    onClick={() => {
                      clearTimeout(timer.current)
                      setPeek(null)
                      onNavigate?.()
                    }}
                    onPointerEnter={(event) => enter(node, event.currentTarget)}
                    className={cn(
                      "relative flex h-8 items-center px-2.5 text-[13.5px] transition-colors duration-150",
                      active ? "inv font-medium" : "text-dim hover:text-ink"
                    )}
                  >
                    {active ? (
                      <motion.span
                        layoutId={`${id}-cursor`}
                        className="absolute inset-0 bg-cursor"
                        transition={{ type: "spring", duration: 0.45, bounce: 0.2 }}
                      />
                    ) : null}
                    <span className="relative">{node.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
      {canPeek ? <PeekCard peek={peek} /> : null}
    </nav>
  )
}

function PeekCard({ peek }: { peek: Peek | null }) {
  return (
    <AnimatePresence>
      {peek ? (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, x: -10, scale: 0.96, top: peek.top, filter: "blur(4px)" }}
          animate={{ opacity: 1, x: 0, scale: 1, top: peek.top, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: -8, scale: 0.97, filter: "blur(4px)", transition: { duration: 0.15 } }}
          transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
          style={{ width: PEEK_W, height: PEEK_H, transformOrigin: "left center" }}
          className="pointer-events-none fixed left-[15.75rem] z-40 flex flex-col border border-line bg-sheet"
        >
          <div className="relative flex-1 overflow-hidden border-b border-line bg-stage">
            <AnimatePresence initial={false}>
              <motion.div
                key={peek.name}
                initial={{ opacity: 0, filter: "blur(6px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(6px)" }}
                transition={{ duration: 0.22 }}
                className="absolute inset-0 @container flex items-center justify-center"
              >
                <PeekDemo name={peek.name} />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-between gap-3 px-3 py-2">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.p
                key={peek.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                className="truncate text-[12.5px] text-dim"
              >
                {peek.description ?? peek.title}
              </motion.p>
            </AnimatePresence>
            
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

function PeekDemo({ name }: { name: string }) {
  const Demo = useDemo(name)?.default
  return Demo ? <Demo /> : null
}

// Flatten separators and folders into titled groups of pages.
function groupTree(nodes: PageTree.Node[]) {
  const groups: { title?: string; pages: PageTree.Item[] }[] = [{ pages: [] }]
  for (const node of nodes) {
    if (node.type === "separator") groups.push({ title: String(node.name ?? ""), pages: [] })
    else if (node.type === "folder") {
      groups.push({
        title: String(node.name ?? ""),
        pages: node.children.filter((child): child is PageTree.Item => child.type === "page"),
      })
    } else groups[groups.length - 1].pages.push(node)
  }
  return groups.filter((group) => group.pages.length)
}
