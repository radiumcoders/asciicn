"use client"

import { defineControls, type ControlValues } from "@/lib/controls"

import { AsciiSpinner, spinners } from "./ascii-spinner"

export const controls = defineControls({
  interval: { type: "number", default: 80, min: 30, max: 300, step: 10 },
})

export default function AsciiSpinnerDemo({ interval }: Partial<ControlValues<typeof controls>>) {
  return (
    <div className="grid grid-cols-3 gap-x-[min(3.5rem,9cqi)] gap-y-7 text-[min(1.5rem,5.5cqi)]">
      {(Object.keys(spinners) as (keyof typeof spinners)[]).map((variant) => (
        <div key={variant} className="flex flex-col items-start gap-1.5">
          <AsciiSpinner variant={variant} interval={interval} />
          <span className="font-mono text-xs text-muted-foreground">{variant}</span>
        </div>
      ))}
    </div>
  )
}
