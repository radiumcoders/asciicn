"use client"

import { defineControls, type ControlValues } from "@/lib/controls"
import { Lattice } from "@/registry/lattice/lattice"

export const controls = defineControls({
  cell: { type: "number", default: 14, min: 8, max: 24, step: 1 },
})

export default function Demo({ cell = 14 }: Partial<ControlValues<typeof controls>>) {
  return <Lattice cell={cell} className="absolute inset-0" />
}
