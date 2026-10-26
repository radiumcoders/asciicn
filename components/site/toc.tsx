"use client"

import { AnchorProvider, TOCItem, useActiveAnchor, type TOCItemType } from "fumadocs-core/toc"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

export function Toc({ items }: { items: TOCItemType[] }) {
  if (!items.length) return null

  return (
    <AnchorProvider toc={items} single>
      <div className="sticky top-8 hidden w-52 shrink-0 xl:block">
        <p className="mb-2 font-mono text-[11px] tracking-wide text-dim/70 uppercase">On this page</p>
        <TocList items={items} />
      </div>
    </AnchorProvider>
  )
}

function TocList({ items }: { items: TOCItemType[] }) {
  const active = useActiveAnchor()

  return (
    <ul className="flex flex-col shadow-[inset_1px_0_0_var(--border)]">
      {items.map((item) => {
        const isActive = active === item.url.slice(1)
        return (
          <li key={item.url} className="relative">
            {isActive ? (
              <motion.span
                layoutId="toc-active"
                className="absolute top-1.5 bottom-1.5 left-0 w-px bg-ink"
                transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
              />
            ) : null}
            <TOCItem
              href={item.url}
              className={cn(
                "block py-1 text-[13px] transition-colors",
                item.depth > 2 ? "pl-6" : "pl-3",
                isActive ? "text-ink" : "text-dim hover:text-ink"
              )}
            >
              {item.title}
            </TOCItem>
          </li>
        )
      })}
    </ul>
  )
}
