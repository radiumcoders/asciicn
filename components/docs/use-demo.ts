"use client"

import * as React from "react"

import type { DemoModule } from "@/lib/controls"
import { demos } from "@/registry/demos"

const cache = new Map<string, DemoModule>()

// Loads a demo module on demand; synchronous after the first load.
export function useDemo(name: string) {
  const [mod, setMod] = React.useState<DemoModule | null>(() => cache.get(name) ?? null)

  React.useEffect(() => {
    if (cache.has(name)) return setMod(cache.get(name)!)
    let live = true
    demos[name]?.().then((loaded) => {
      cache.set(name, loaded)
      if (live) setMod(loaded)
    })
    return () => {
      live = false
    }
  }, [name])

  return mod
}
