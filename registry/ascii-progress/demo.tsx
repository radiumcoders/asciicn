"use client"

import * as React from "react"

import { defineControls, type ControlValues } from "@/lib/controls"

import { AsciiProgress } from "./ascii-progress"

export const controls = defineControls({
  value: { type: "number", default: 64, min: 0, max: 100, step: 1 },
  width: { type: "number", default: 24, min: 8, max: 40, step: 1 },
  showValue: { type: "boolean", default: true },
  brackets: { type: "boolean", default: true },
  track: { type: "select", default: "·", options: ["·", " ", "░", "-"] },
  animate: { type: "boolean", default: true },
})

// Climbs in uneven steps like a real download, rests at 100, then starts over.
function useDownload(pace: number, start: number) {
  const [value, setValue] = React.useState(start)

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = setInterval(() => {
      setValue((v) => (v >= 100 ? 0 : Math.min(100, v + Math.random() * pace)))
    }, 650)
    return () => clearInterval(id)
  }, [pace])

  return value
}

export default function AsciiProgressDemo({ value, ...props }: Partial<ControlValues<typeof controls>>) {
  const fonts = useDownload(9, 38)
  const field = useDownload(16, 81)

  const rows = [
    { name: "registry.json", value: value ?? 64 },
    { name: "ascii-field.tsx", value: field },
    { name: "geist-mono.woff2", value: fonts },
  ]

  return (
    <div className="grid grid-cols-[auto_auto] items-center gap-x-[2ch] gap-y-[1.1em] font-mono text-[min(1rem,3.1cqi)]">
      {rows.map((row) => (
        <React.Fragment key={row.name}>
          <span className="text-muted-foreground">{row.name}</span>
          <AsciiProgress {...props} value={row.value} />
        </React.Fragment>
      ))}
    </div>
  )
}
