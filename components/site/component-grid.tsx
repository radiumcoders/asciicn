"use client"

import Link from "next/link"

import { useDemo } from "@/components/docs/use-demo"
import { cn } from "@/lib/utils"

type Item = { name: string; title: string; description: string }

export function ComponentGrid({ items, compact }: { items: Item[]; compact?: boolean }) {
  return (
    <div className={cn("grid gap-2 sm:grid-cols-2", !compact && "lg:grid-cols-3")}>
      {items.map((item) => {
        return (
          <Link
            key={item.name}
            href={`/docs/components/${item.name}`}
            className="group flex flex-col rounded-2xl bg-plate p-1 transition-colors hover:bg-wash"
          >
            <div className={cn("relative flex items-center justify-center overflow-hidden rounded-xl bg-stage", compact ? "h-52" : "h-64")}>
              {/* Live, but not clickable: the whole card is the link. */}
              <div className="pointer-events-none absolute inset-0 @container flex items-center justify-center">
                <CardDemo name={item.name} />
              </div>
            </div>
            <div className="px-3 pt-3 pb-2.5">
              <p className="text-[14px] leading-5 font-medium">{item.title}</p>
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
