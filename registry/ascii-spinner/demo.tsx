"use client"

import { AsciiSpinner, spinners } from "./ascii-spinner"

export default function AsciiSpinnerDemo() {
  return (
    <div className="grid grid-cols-3 gap-x-[min(3.5rem,9cqi)] gap-y-7 text-[min(1.5rem,5.5cqi)]">
      {(Object.keys(spinners) as (keyof typeof spinners)[]).map((variant) => (
        <div key={variant} className="flex flex-col items-start gap-1.5">
          <AsciiSpinner variant={variant} />
          <span className="font-mono text-xs text-muted-foreground">{variant}</span>
        </div>
      ))}
    </div>
  )
}
