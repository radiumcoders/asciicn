"use client"

import { defineControls, type ControlValues } from "@/lib/controls"

import { AsciiDonut } from "./ascii-donut"

export const controls = defineControls({
  ramp: { type: "select", default: ".,-~:;=!*#$@", options: [".,-~:;=!*#$@", " .:-=+*#%@", "░▒▓█", "·•●"] },
  cellSize: { type: "number", default: 12, min: 7, max: 24, step: 1 },
  speed: { type: "number", default: 1, min: 0, max: 3, step: 0.1 },
  fill: { type: "number", default: 0.85, min: 0.3, max: 1, step: 0.05 },
  interactive: { type: "boolean", default: true },
})

export default function AsciiDonutDemo(props: Partial<ControlValues<typeof controls>>) {
  return <AsciiDonut {...props} className="absolute inset-0 text-foreground" />
}
