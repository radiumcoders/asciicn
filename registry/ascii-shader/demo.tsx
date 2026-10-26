"use client"

import { defineControls, type ControlValues } from "@/lib/controls"
import { AsciiShader } from "@/registry/ascii-shader/ascii-shader"

export const controls = defineControls({
  seed: { type: "text", default: "asciicn" },
  field: { type: "select", default: "silk", options: ["silk", "nebula"] },
  cell: { type: "number", default: 14, min: 8, max: 24, step: 1 },
})

export default function Demo({ seed = "asciicn", field = "silk", cell = 14 }: Partial<ControlValues<typeof controls>>) {
  return <AsciiShader seed={seed || "asciicn"} field={field} cell={cell} className="absolute inset-0" />
}
