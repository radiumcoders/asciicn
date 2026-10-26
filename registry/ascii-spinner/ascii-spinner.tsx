"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export const spinners = {
  dots: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  line: ["-", "\\", "|", "/"],
  arc: ["◜", "◠", "◝", "◞", "◡", "◟"],
  bounce: ["[=   ]", "[ =  ]", "[  = ]", "[   =]", "[  = ]", "[ =  ]"],
  pulse: ["·", "•", "●", "•"],
  blocks: ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█", "▇", "▆", "▅", "▄", "▃", "▂"],
} satisfies Record<string, string[]>

export interface AsciiSpinnerProps {
  /**
   * Which frame set to cycle through.
   * @defaultValue "dots"
   */
  variant?: keyof typeof spinners
  /**
   * Milliseconds per frame.
   * @defaultValue 80
   */
  interval?: number
  /** Text shown after the spinner, also used as its accessible name. */
  label?: string
}

export function AsciiSpinner({
  variant = "dots",
  interval = 80,
  label,
  className,
  ...props
}: AsciiSpinnerProps & React.HTMLAttributes<HTMLSpanElement>) {
  const frames = spinners[variant]
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    setIndex(0)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = setInterval(
      () => setIndex((i) => (i + 1) % frames.length),
      interval
    )
    return () => clearInterval(id)
  }, [frames, interval])

  // Reserve the widest frame so the label never shifts.
  const width = Math.max(...frames.map((f) => f.length))

  return (
    <span
      role="status"
      aria-label={label ?? "Loading"}
      className={cn("inline-flex items-center gap-2 font-mono", className)}
      {...props}
    >
      <span aria-hidden className="inline-block whitespace-pre" style={{ minWidth: `${width}ch` }}>
        {frames[index]}
      </span>
      {label ? <span aria-hidden>{label}</span> : null}
    </span>
  )
}
