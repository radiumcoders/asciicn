"use client"

import * as React from "react"

import { defineControls, type ControlValues } from "@/lib/controls"

import { BracketButton } from "./bracket-button"

export const controls = defineControls({
  label: { type: "text", default: "deploy" },
  variant: { type: "select", default: "default", options: ["default", "tonal", "ghost"] },
  size: { type: "select", default: "md", options: ["sm", "md", "lg"] },
  scramble: { type: "boolean", default: true },
})

export default function BracketButtonDemo({ label = "deploy", variant, ...props }: Partial<ControlValues<typeof controls>>) {
  const [loading, setLoading] = React.useState(false)
  const timer = React.useRef<number>(undefined)

  React.useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <div className="flex flex-wrap items-center justify-center gap-[min(0.75rem,2.5cqi)] px-4">
      <BracketButton
        {...props}
        variant={variant}
        loading={loading}
        onClick={() => {
          setLoading(true)
          timer.current = window.setTimeout(() => setLoading(false), 1600)
        }}
      >
        {label}
      </BracketButton>
      <BracketButton {...props} variant="tonal">
        preview
      </BracketButton>
      <BracketButton {...props} variant="ghost">
        cancel
      </BracketButton>
    </div>
  )
}
