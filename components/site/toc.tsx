"use client"

import { TOCItem, useActiveAnchor } from "fumadocs-core/toc"
import { motion } from "motion/react"
import * as React from "react"

import { usePage } from "@/components/site/page-provider"
import { cn } from "@/lib/utils"

// Pinned beside the article. A single ink bar slides to the section you're reading.
export function Toc({ editUrl }: { editUrl?: string }) {
  const { toc } = usePage()
  const active = useActiveAnchor()
  const list = React.useRef<HTMLUListElement>(null)
  const [mark, setMark] = React.useState<{ top: number; height: number } | null>(null)

  React.useLayoutEffect(() => {
    const item = list.current?.querySelector<HTMLElement>(`[data-url="#${active}"]`)
    setMark(item ? { top: item.offsetTop, height: item.offsetHeight } : null)
  }, [active])

  if (!toc.length) return null

  return (
    <aside className="sticky top-10 hidden max-h-[calc(100svh-5rem)] w-48 shrink-0 flex-col self-start lg:flex">
      <p className="mb-3 flex items-center gap-2 font-mono text-[11px] tracking-wide text-dim/70 uppercase">
        On this page
      </p>
      <ul ref={list} className="relative flex flex-col overflow-y-auto shadow-[inset_1px_0_0_var(--line)]">
        {mark ? (
          <motion.span
            aria-hidden
            className="absolute left-0 w-0.5 bg-brand"
            initial={false}
            animate={{ top: mark.top, height: mark.height }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
          />
        ) : null}
        {toc.map((item) => {
          const isActive = active === item.url.slice(1)
          return (
            <li key={item.url} data-url={item.url}>
              <TOCItem
                href={item.url}
                className={cn(
                  "block py-1.5 text-[13px] leading-5 transition-colors duration-200",
                  item.depth > 2 ? "pl-6" : "pl-3.5",
                  isActive ? "text-ink" : "text-dim hover:text-ink"
                )}
              >
                {item.title}
              </TOCItem>
            </li>
          )
        })}
      </ul>

      <div className="mt-5 flex flex-col items-start gap-0.5 border-t border-dashed border-line pt-4 font-mono text-[11.5px] text-dim">
        {editUrl ? (
          <a href={editUrl} target="_blank" rel="noreferrer" className="py-1 transition-colors hover:text-ink">
            edit this page ↗
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="py-1 transition-colors hover:text-ink"
        >
          back to top ↑
        </button>
      </div>
    </aside>
  )
}
