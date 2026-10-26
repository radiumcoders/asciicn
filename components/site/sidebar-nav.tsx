"use client"

import type * as PageTree from "fumadocs-core/page-tree"
import { motion } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export function SidebarNav({ tree, onNavigate }: { tree: PageTree.Root; onNavigate?: () => void }) {
  const pathname = usePathname()

  const renderPage = (node: PageTree.Item) => {
    const active = pathname === node.url
    return (
      <li key={node.url}>
        <Link
          href={node.url}
          onClick={onNavigate}
          className={cn(
            "relative flex h-8 items-center rounded-md px-2.5 text-[13.5px] transition-colors",
            active ? "font-medium text-ink" : "text-dim hover:text-ink"
          )}
        >
          {active ? (
            <motion.span
              layoutId="sidebar-active"
              className="absolute inset-0 rounded-md bg-wash"
              transition={{ type: "spring", duration: 0.4, bounce: 0.18 }}
            />
          ) : null}
          <span className="relative">{node.name}</span>
        </Link>
      </li>
    )
  }

  return (
    <nav className="flex flex-col gap-6">
      {groupTree(tree.children).map((group, i) => (
        <div key={i}>
          {group.title ? (
            <p className="mb-1.5 px-2.5 font-mono text-[11px] tracking-wide text-dim/70 uppercase">{group.title}</p>
          ) : null}
          <ul className="flex flex-col gap-px">{group.pages.map(renderPage)}</ul>
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
