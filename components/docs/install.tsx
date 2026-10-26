"use client"

import * as React from "react"

import { CopyButton } from "@/components/docs/copy-button"
import { Segmented } from "@/components/docs/segmented"
import { ScrambleText } from "@/registry/scramble-text/scramble-text"

const MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const
type Manager = (typeof MANAGERS)[number]

const RUNNER: Record<Manager, string> = {
  pnpm: "pnpm dlx",
  npm: "npx",
  yarn: "yarn dlx",
  bun: "bunx --bun",
}

// The chosen package manager is shared by every install block and remembered.
const KEY = "asciicn:pm"
const listeners = new Set<() => void>()

function read(): Manager {
  try {
    const stored = localStorage.getItem(KEY)
    return MANAGERS.includes(stored as Manager) ? (stored as Manager) : "pnpm"
  } catch {
    return "pnpm"
  }
}

function write(manager: Manager) {
  try {
    localStorage.setItem(KEY, manager)
  } catch {}
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function Install({ url }: { url: string }) {
  const manager = React.useSyncExternalStore(subscribe, read, () => "pnpm" as Manager)
  const command = `${RUNNER[manager]} shadcn@latest add ${url}`

  return (
    <div className="my-5 rounded-xl bg-plate p-1">
      <div className="flex items-center justify-between py-0.5 pr-0.5 pl-0.5">
        <Segmented options={MANAGERS} value={manager} onChange={write} />
        <CopyButton value={command} />
      </div>
      <pre className="overflow-x-auto px-3 pt-2.5 pb-3 font-mono text-[13px] leading-6">
        <span className="text-dim/60 select-none">$ </span>
        {/* Only the runner changes between managers, so only it scrambles. */}
        <ScrambleText key={manager} text={RUNNER[manager]} duration={380} className="text-dim" />
        <span className="text-ink"> shadcn@latest add {url}</span>
      </pre>
    </div>
  )
}
