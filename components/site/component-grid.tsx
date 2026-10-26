"use client"

import Link from "next/link"

import { useDemo } from "@/components/docs/use-demo"
import { cn } from "@/lib/utils"

type Item = { name: string; title: string; description: string }

export function ComponentGrid({ items, compact }: { items: Item[]; compact?: boolean }) {
  if (!items.length) {
    return (
      <div className="flex h-40 items-center justify-center border border-dashed border-line font-mono text-[13px] text-dim">
        no components yet
      </div>
    )
  }

  return (
    <div className={cn("grid gap-2 sm:grid-cols-2", !compact && "lg:grid-cols-3")}>
      {items.map((item) => {
        return (
          <Link
            key={item.name}
            href={`/docs/components/${item.name}`}
            className="group flex flex-col border border-line bg-sheet transition-colors hover:bg-plate"
          >
            <div className={cn("relative flex items-center justify-center overflow-hidden border-b border-line bg-stage", compact ? "h-52" : "h-64")}>
              {/* Live, but not clickable: the whole card is the link. */}
              <div className="pointer-events-none absolute inset-0 @container flex items-center justify-center">
                <CardDemo name={item.name} />
              </div>
            </div>
            <div className="px-3.5 pt-3 pb-3">
              <p className="flex items-center justify-between font-mono text-[13.5px] leading-5 font-medium">
                {item.title}
                <span aria-hidden className="-translate-x-1 text-dim opacity-0 transition-[opacity,translate] duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                  -&gt;
                </span>
              </p>
              <p className="mt-0.5 text-[13px] leading-5 text-dim">{item.description}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

function CardDemo({ name }: { name: string }) {
  const Demo = useDemo(name)?.default
  return Demo ? <Demo /> : null
}
