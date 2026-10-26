"use client"

import Link from "next/link"

import { demos } from "@/registry/demos"

type Item = { name: string; title: string; description: string }

export function ComponentGrid({ items }: { items: Item[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const Demo = demos[item.name]
        return (
          <Link
            key={item.name}
            href={`/docs/components/${item.name}`}
            className="group flex flex-col rounded-2xl bg-plate p-1 transition-colors hover:bg-wash"
          >
            <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-xl bg-stage">
              {/* Live, but not clickable: the whole card is the link. */}
              <div className="pointer-events-none absolute inset-0 @container flex items-center justify-center">
                <Demo />
              </div>
            </div>
            <div className="px-3 pt-3 pb-2.5">
              <p className="text-[14px] font-medium">{item.title}</p>
              <p className="mt-0.5 text-[13px] text-dim">{item.description}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
