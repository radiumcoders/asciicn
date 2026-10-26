"use client"

import { AnimatePresence, motion } from "motion/react"
import * as React from "react"

import { cn } from "@/lib/utils"

export type Node =
  | { kind: "file"; name: string; note?: string }
  | { kind: "folder"; name: string; note?: string; open: boolean; children: Node[] }

// A project tree drawn with box glyphs, the way `tree` prints it.
export function FilesTree({ nodes }: { nodes: Node[] }) {
  return (
    <div className="not-prose my-6 overflow-x-auto border border-line bg-plate px-4 py-3.5 font-mono text-[13px] leading-6" role="tree">
      <Branch nodes={nodes} rails={[]} />
    </div>
  )
}

function Branch({ nodes, rails }: { nodes: Node[]; rails: boolean[] }) {
  return nodes.map((node, i) => {
    const last = i === nodes.length - 1
    return node.kind === "folder" ? (
      <FolderRow key={node.name} node={node} rails={rails} last={last} />
    ) : (
      <Row key={node.name} rails={rails} last={last} name={node.name} note={node.note} />
    )
  })
}

function Prefix({ rails, last }: { rails: boolean[]; last: boolean }) {
  return (
    <span aria-hidden className="whitespace-pre text-dim/45 select-none">
      {rails.map((open) => (open ? "│  " : "   ")).join("")}
      {last ? "└─ " : "├─ "}
    </span>
  )
}

function Row({
  rails,
  last,
  name,
  note,
  folder,
  open,
  onToggle,
}: {
  rails: boolean[]
  last: boolean
  name: string
  note?: string
  folder?: boolean
  open?: boolean
  onToggle?: () => void
}) {
  const label = (
    <>
      <span className={cn("whitespace-pre", folder ? "text-ink" : note ? "text-ink" : "text-dim")}>
        {name}
        {folder ? <span className="text-dim/60">/</span> : null}
      </span>
      {note ? <span className="ml-3 text-[12px] whitespace-pre text-dim/70">← {note}</span> : null}
    </>
  )

  return (
    <div className="flex items-center" role="treeitem" aria-expanded={folder ? open : undefined}>
      <Prefix rails={rails} last={last} />
      {folder ? (
        <button
          type="button"
          onClick={onToggle}
          className="group -mx-1 flex items-center px-1 transition-colors hover:bg-wash"
        >
          {label}
          <motion.span
            aria-hidden
            animate={{ rotate: open ? 0 : -90 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
            className="ml-1.5 inline-block text-[10px] text-dim/60 group-hover:text-ink"
          >
            ▾
          </motion.span>
        </button>
      ) : (
        label
      )}
    </div>
  )
}

function FolderRow({ node, rails, last }: { node: Extract<Node, { kind: "folder" }>; rails: boolean[]; last: boolean }) {
  const [open, setOpen] = React.useState(node.open)

  return (
    <>
      <Row rails={rails} last={last} name={node.name} note={node.note} folder open={open} onToggle={() => setOpen((o) => !o)} />
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            role="group"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0 }}
            className="overflow-hidden"
          >
            <Branch nodes={node.children} rails={[...rails, !last]} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
