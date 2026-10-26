"use client"

import { defineControls, type ControlValues } from "@/lib/controls"

import { AsciiField } from "./ascii-field"

export const controls = defineControls({
  ramp: { type: "select", default: " .:-=+*#%@", options: [" .:-=+*#%@", " ░▒▓█", " .oO@", " ·•●"] },
  cellSize: { type: "number", default: 14, min: 8, max: 28, step: 1 },
  speed: { type: "number", default: 1, min: 0, max: 3, step: 0.1 },
  scale: { type: "number", default: 1, min: 0.3, max: 2.5, step: 0.05 },
  interactive: { type: "boolean", default: true },
})

export default function AsciiFieldDemo(props: Partial<ControlValues<typeof controls>>) {
  return <AsciiField {...props} className="absolute inset-0 text-foreground/80" />
}
