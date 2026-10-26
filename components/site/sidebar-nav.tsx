"use client"

import type * as PageTree from "fumadocs-core/page-tree"
import { motion } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { cn } from "@/lib/utils"

// One pill: it follows the pointer, and springs home to the current page on leave.
export function SidebarNav({ tree, onNavigate }: { tree: PageTree.Root; onNavigate?: () => void }) {
  const pathname = usePathname()
  const [hovered, setHovered] = React.useState<string | null>(null)
  const id = React.useId()
  const target = hovered ?? pathname

  return (
    <nav className="flex flex-col gap-6" onPointerLeave={() => setHovered(null)}>
      {groupTree(tree.children).map((group, i) => (
        <div key={i}>
          {group.title ? (
            <p className="mb-1.5 flex items-center justify-between px-2.5 font-mono text-[11px] tracking-wide text-dim/70 uppercase">
              {group.title}
              <span className="tabular-nums">{String(group.pages.length).padStart(2, "0")}</span>
            </p>
          ) : null}
          <ul className="flex flex-col gap-px">
            {group.pages.map((node) => {
              const active = pathname === node.url
              return (
                <li key={node.url}>
                  <Link
                    href={node.url}
                    onClick={onNavigate}
                    onPointerEnter={() => setHovered(node.url)}
                    className={cn(
                      "relative flex h-8 items-center rounded-md px-2.5 text-[13.5px] transition-colors duration-150",
                      active ? "font-medium text-ink" : "text-dim hover:text-ink"
                    )}
                  >
                    {target === node.url ? (
                      <motion.span
                        layoutId={id}
                        className={cn("absolute inset-0 rounded-md", active ? "bg-wash" : "bg-wash/60")}
                        transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
                      />
                    ) : null}
                    {active ? (
                      <motion.span
                        layoutId={`${id}-tick`}
                        className="absolute top-1/2 left-0 h-3.5 w-[3px] -translate-y-1/2 rounded-full bg-ink"
                        transition={{ type: "spring", duration: 0.45, bounce: 0.25 }}
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
    </nav>
  )
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
