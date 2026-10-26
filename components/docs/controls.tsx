"use client"

import { motion } from "motion/react"
import * as React from "react"

import type { Control } from "@/lib/controls"
import { cn } from "@/lib/utils"

const spring = { type: "spring", duration: 0.35, bounce: 0.15 } as const

// "cellSize" -> "cell size"
const labelOf = (key: string) => key.replace(/([A-Z])/g, " $1").toLowerCase()

export function ControlRow({
  name,
  control,
  value,
  onChange,
}: {
  name: string
  control: Control
  value: unknown
  onChange: (value: unknown) => void
}) {
  switch (control.type) {
    case "number":
      return <Slider label={labelOf(name)} control={control} value={value as number} onChange={onChange} />
    case "boolean":
      return <Toggle label={labelOf(name)} value={value as boolean} onChange={onChange} />
    case "select":
      return <Choice label={labelOf(name)} options={control.options} value={value as string} onChange={onChange} />
    case "text":
      return (
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] text-dim">{labelOf(name)}</span>
          <input
            value={value as string}
            onChange={(event) => onChange(event.target.value)}
            className="h-8 border border-line bg-sheet px-2.5 font-mono text-[12px] outline-none focus-visible:border-ink/50"
          />
        </label>
      )
  }
}

// The label and value live inside the track; the fill sits behind them.
function Slider({
  label,
  control,
  value,
  onChange,
}: {
  label: string
  control: Extract<Control, { type: "number" }>
  value: number
  onChange: (value: number) => void
}) {
  const { min, max, step = 1 } = control
  const [dragging, setDragging] = React.useState(false)
  const decimals = (String(step).split(".")[1] ?? "").length
  const progress = (value - min) / (max - min)

  const setFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const t = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1)
    const raw = min + t * (max - min)
    onChange(Number((Math.round(raw / step) * step).toFixed(decimals)))
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        setDragging(true)
        setFromPointer(event)
      }}
      onPointerMove={(event) => dragging && setFromPointer(event)}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      onKeyDown={(event) => {
        const delta = event.key === "ArrowRight" || event.key === "ArrowUp" ? step : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -step : 0
        if (!delta) return
        event.preventDefault()
        onChange(Number(Math.min(max, Math.max(min, value + delta * (event.shiftKey ? 10 : 1))).toFixed(decimals)))
      }}
      className="group relative flex h-8 cursor-ew-resize touch-none items-center justify-between overflow-hidden border border-line bg-sheet px-2.5 outline-none select-none focus-visible:border-ink/50"
    >
      <motion.span
        className="absolute inset-y-0 left-0 bg-brand/15 shadow-[inset_-2px_0_0_var(--brand)]"
        animate={{ width: `${progress * 100}%` }}
        transition={dragging ? { duration: 0 } : spring}
      />
      <span className="relative font-mono text-[11px] text-dim transition-colors group-hover:text-ink">{label}</span>
      <span className="relative font-mono text-[11px] text-ink tabular-nums">{value.toFixed(decimals)}</span>
    </div>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className="group flex h-8 items-center justify-between border border-line bg-sheet px-2.5 outline-none focus-visible:border-ink/50"
    >
      <span className="font-mono text-[11px] text-dim transition-colors group-hover:text-ink">{label}</span>
      <span className={cn("flex h-4 w-7 items-center p-0.5 transition-colors", value ? "justify-end bg-brand" : "justify-start bg-ink/15")}>
        <motion.span layout transition={spring} className="size-3 bg-sheet" />
      </span>
    </button>
  )
}

function Choice({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly string[]
  value: string
  onChange: (value: string) => void
}) {
  const id = React.useId()

  return (
    <div className="flex flex-col gap-1.5">
      <span className="px-0.5 font-mono text-[11px] text-dim">{label}</span>
      <div className="flex flex-wrap gap-1 border border-line bg-sheet p-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              "relative h-6 max-w-full px-2 font-mono text-[11px] whitespace-pre transition-colors",
              value === option ? "inv" : "text-dim hover:text-ink"
            )}
          >
            {value === option ? (
              <motion.span layoutId={id} transition={spring} className="absolute inset-0 bg-cursor" />
            ) : null}
            <span className="relative block truncate">{option.trim() === "" ? "space" : option.length > 14 ? `${option.slice(0, 12)}…` : option}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
