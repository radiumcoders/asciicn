"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface AsciiProgressProps {
  /**
   * Progress from 0 to 100.
   * @defaultValue 0
   */
  value?: number
  /**
   * Length of the bar in characters.
   * @defaultValue 24
   */
  width?: number
  /**
   * Show the percentage after the bar.
   * @defaultValue true
   */
  showValue?: boolean
  /**
   * Frame the bar in square brackets.
   * @defaultValue true
   */
  brackets?: boolean
  /**
   * Character for the empty part of the bar.
   * @defaultValue "·"
   */
  track?: string
  /**
   * Glide toward new values instead of jumping.
   * @defaultValue true
   */
  animate?: boolean
}

export function AsciiProgress({
  value = 0,
  width = 24,
  showValue = true,
  brackets = true,
  track = "·",
  animate = true,
  className,
  ...props
}: AsciiProgressProps & React.HTMLAttributes<HTMLDivElement>) {
  const target = clamp(value)
  const shown = useGlide(target, animate)
  const cells = Math.max(1, Math.round(width))

  // Fill in eighths of a cell for sub-character precision.
  const eighths = Math.round((shown / 100) * cells * 8)
  // Cells the fill touches hide their track character.
  const filled = Math.ceil(eighths / 8)

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(target)}
      className={cn("inline-flex items-center font-mono leading-none whitespace-pre tabular-nums", className)}
      {...props}
    >
      {brackets ? <span aria-hidden>[</span> : null}
      <span aria-hidden className="relative inline-flex">
        {Array.from({ length: cells }, (_, i) => (
          <span key={i} className={cn("inline-block w-[1ch] text-center opacity-30", i < filled && "invisible")}>
            {track}
          </span>
        ))}
        {/*
         * The fill moves in eighths of a cell, the same steps as ▏▎▍▌▋▊▉█.
         * It's one block, not glyphs: block characters aren't in most monospace
         * fonts, and a fallback font leaves seams between cells.
         */}
        <span
          className="absolute top-1/2 left-0 h-[1.15em] -translate-y-1/2 bg-current"
          style={{ width: `${eighths / 8}ch` }}
        />
      </span>
      {brackets ? <span aria-hidden>]</span> : null}
      {showValue ? (
        <span aria-hidden className="ml-[1ch] inline-block w-[4ch] text-right">
          {Math.round(shown)}%
        </span>
      ) : null}
    </div>
  )
}

function clamp(value: number) {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0
}

// A critically damped spring toward `target`; jumps straight there with reduced motion.
function useGlide(target: number, enabled: boolean) {
  const [shown, setShown] = React.useState(target)
  const state = React.useRef({ value: target, velocity: 0 })

  React.useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (!enabled || reduced) {
      state.current = { value: target, velocity: 0 }
      setShown(target)
      return
    }

    let raf = 0
    let last = performance.now()
    const stiffness = 170
    const damping = 2 * Math.sqrt(stiffness)

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const s = state.current
      const force = stiffness * (target - s.value) - damping * s.velocity
      s.velocity += force * dt
      s.value += s.velocity * dt
      if (Math.abs(target - s.value) < 0.01 && Math.abs(s.velocity) < 0.01) {
        s.value = target
        s.velocity = 0
        setShown(target)
        return
      }
      setShown(s.value)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, enabled])

  return shown
}
