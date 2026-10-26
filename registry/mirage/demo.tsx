"use client"

import { defineControls, type ControlValues } from "@/lib/controls"
import { Mirage } from "@/registry/mirage/mirage"

export const controls = defineControls({
  charset: { type: "select", default: "standard", options: ["standard", "classic", "minimal", "blocks", "braille", "dots", "geometric", "binary", "numeric", "hacker", "katakana"] },
  color: { type: "select", default: "shader", options: ["shader", "mono"] },
  cell: { type: "number", default: 14, min: 8, max: 24, step: 1 },
  brightness: { type: "number", default: 0, min: -1, max: 1, step: 0.05 },
  contrast: { type: "number", default: 0, min: -1, max: 1, step: 0.05 },
  coverage: { type: "number", default: 1, min: 0, max: 1, step: 0.05 },
  opacity: { type: "number", default: 1, min: 0, max: 1, step: 0.05 },
  backdrop: { type: "number", default: 0, min: 0, max: 1, step: 0.05 },
  speed: { type: "number", default: 1, min: 0, max: 3, step: 0.1 },
  invert: { type: "boolean", default: false },
})

export default function Demo(props: Partial<ControlValues<typeof controls>>) {
  return <Mirage {...props} className="absolute inset-0" />
}
