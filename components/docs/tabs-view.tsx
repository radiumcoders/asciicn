"use client"

import { AnimatePresence, motion } from "motion/react"
import * as React from "react"

import { Segmented } from "@/components/docs/segmented"

// Tabs that share a `groupId` stay in step across the page and across visits.
const listeners = new Set<() => void>()
const key = (group: string) => `asciicn:tabs:${group}`

function useGroupValue(group: string | undefined, fallback: string) {
  const subscribe = React.useCallback((notify: () => void) => {
    listeners.add(notify)
    window.addEventListener("storage", notify)
    return () => {
      listeners.delete(notify)
      window.removeEventListener("storage", notify)
    }
  }, [])
  const stored = React.useSyncExternalStore(
    subscribe,
    () => (group ? localStorage.getItem(key(group)) : null),
    () => null
  )
  const [local, setLocal] = React.useState<string | null>(null)

  const value = (group ? stored : local) ?? fallback
  const set = (next: string) => {
    if (!group) return setLocal(next)
    localStorage.setItem(key(group), next)
    listeners.forEach((notify) => notify())
  }
  return [value, set] as const
}

export function TabsView({
  items,
  groupId,
  defaultValue,
  panels,
}: {
  items: string[]
  groupId?: string
  defaultValue?: string
  panels: Record<string, React.ReactNode>
}) {
  const [stored, setValue] = useGroupValue(groupId, defaultValue ?? items[0])
  const value = items.includes(stored) ? stored : items[0]

  return (
    <div className="my-6">
      <Segmented options={items} value={value} onChange={setValue} className="-ml-0.5" />
      <div className="relative">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={value}
            role="tabpanel"
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.2 }}
            className="tabs-panel [&>:first-child]:mt-2.5"
          >
            {panels[value]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
