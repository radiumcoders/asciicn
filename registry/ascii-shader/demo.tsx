"use client"

import { defineControls, type ControlValues } from "@/lib/controls"
import { AsciiShader } from "@/registry/ascii-shader/ascii-shader"

export const controls = defineControls({
  seed: { type: "text", default: "asciicn" },
  field: { type: "select", default: "silk", options: ["silk", "nebula"] },
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

export default function Demo({ seed, ...props }: Partial<ControlValues<typeof controls>>) {
  return <AsciiShader seed={seed || "asciicn"} {...props} className="absolute inset-0" />
}
