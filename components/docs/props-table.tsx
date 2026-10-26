import { createGenerator } from "fumadocs-typescript"
import type * as React from "react"

import { getItem } from "@/lib/registry"

const generator = createGenerator()

type Entry = { name: string; type: string; simplifiedType: string; required: boolean; description?: string; tags: { name: string; text: string }[] }

// Read straight from the component's TypeScript, so the table can't drift.
export async function PropsTable({ name, type }: { name: string; type: string }) {
  const [doc] = await generator.generateTypeTable({
    path: getItem(name).files[0].path,
    name: type,
  })
  if (!doc) return null

  return (
    <div className="not-prose my-6 border border-line bg-plate">
      <div className="flex items-center justify-between border-b border-line px-4 py-2 font-mono text-[11.5px] text-dim">
        <span>{type}</span>
      </div>
      <dl className="bg-sheet">
        {(doc.entries as Entry[]).map((entry) => (
          <Row key={entry.name} entry={entry} />
        ))}
      </dl>
    </div>
  )
}

function Row({ entry }: { entry: Entry }) {
  const fallback = entry.tags.find((tag) => tag.name === "defaultValue")?.text
  const full = entry.required ? entry.type : entry.type.replace(/ \| undefined$/, "")
  const options = unionOf(full)
  const id = `prop-${entry.name}`

  return (
    <div
      id={id}
      className="group grid scroll-mt-24 gap-x-6 gap-y-2 px-4 py-4 target:bg-wash/50 sm:grid-cols-[9.5rem_1fr] [&+&]:border-t [&+&]:border-dashed [&+&]:border-line"
    >
      <dt className="flex flex-col items-start gap-1">
        <a href={`#${id}`} className="inline-flex items-center gap-1.5 font-mono text-[13.5px] font-medium text-ink">
          {entry.name}
          <span aria-hidden className="text-[12px] font-normal text-dim/50 opacity-0 transition-opacity group-hover:opacity-100">
            #
          </span>
        </a>
        <span className="font-mono text-[11px] text-dim/70">{entry.required ? "required" : "optional"}</span>
      </dt>
      <dd className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[12.5px]">
          {options ? (
            options.map((option) => {
              const isDefault = option === fallback
              return (
                <span
                  key={option}
                  title={isDefault ? "default" : undefined}
                  className={
                    isDefault
                      ? "inv inline-flex h-6 items-center gap-1.5 bg-brand px-2"
                      : "inline-flex h-6 items-center border border-line px-2 text-ink"
                  }
                >
                  {option}
                  {isDefault ? <span className="text-[10px] text-dim">default</span> : null}
                </span>
              )
            })
          ) : (
            <>
              <code className="inline-flex min-h-6 items-center border border-line px-2 break-all text-ink">
                {full.length <= 64 ? full : entry.simplifiedType}
              </code>
              {fallback ? (
                <span className="ml-1 text-dim">
                  <span className="text-dim/60">= </span>
                  {fallback}
                </span>
              ) : null}
            </>
          )}
        </div>
        {entry.description ? <p className="mt-2 text-[13.5px] leading-6 text-dim">{inline(entry.description)}</p> : null}
      </dd>
    </div>
  )
}

// Short unions of literals read better as chips: `"a" | "b"`.
function unionOf(type: string) {
  const parts = type.split(" | ")
  if (parts.length < 2 || parts.length > 8) return null
  return parts.every((part) => /^("[^"]*"|-?\d+(\.\d+)?|true|false)$/.test(part)) ? parts : null
}

// Backticks in TSDoc become inline code.
function inline(text: string): React.ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith("`") && part.endsWith("`") ? (
      <code key={i} className="border border-line-soft bg-plate px-1 py-px font-mono text-[0.88em] text-ink">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  )
}
