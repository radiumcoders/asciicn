"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const GLYPHS = "!<>-_\\/[]{}=+*^?#%&@$"

export interface ScrambleTextProps {
  /** The text that settles in once the scramble ends. */
  text: string
  /**
   * What starts the scramble.
   * `mount` runs once, `hover` replays on pointer enter, `view` runs when scrolled into view.
   * @defaultValue "mount"
   */
  trigger?: "mount" | "hover" | "view"
  /**
   * Total run time in milliseconds.
   * @defaultValue 900
   */
  duration?: number
  /**
   * Characters drawn while a letter is still unresolved.
   * @defaultValue "!<>-_\\/[]{}=+*^?#%&@$"
   */
  glyphs?: string
  /**
   * Resolve letters left to right instead of all at random.
   * @defaultValue true
   */
  sequential?: boolean
}

export function ScrambleText({
  text,
  trigger = "mount",
  duration = 900,
  glyphs = GLYPHS,
  sequential = true,
  className,
  onPointerEnter,
  ...props
}: ScrambleTextProps & Omit<React.HTMLAttributes<HTMLSpanElement>, "children">) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [output, setOutput] = React.useState(text)
  const frame = React.useRef(0)

  const run = React.useCallback(() => {
    cancelAnimationFrame(frame.current)
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOutput(text)
      return
    }

    // Each letter gets the moment it locks in.
    const settle = Array.from(text, (_, i) =>
      sequential
        ? (i / Math.max(text.length, 1)) * 0.75 + Math.random() * 0.25
        : 0.15 + Math.random() * 0.85
    )
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      let next = ""
      for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        next +=
          ch === " " || t >= settle[i]
            ? ch
            : glyphs[Math.floor(Math.random() * glyphs.length)]
      }
      setOutput(next)
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }, [text, duration, glyphs, sequential])

  React.useEffect(() => {
    if (trigger === "mount") run()
    else setOutput(text)

    if (trigger !== "view" || !ref.current) {
      return () => cancelAnimationFrame(frame.current)
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        run()
        observer.disconnect()
      }
    })
    observer.observe(ref.current)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame.current)
    }
  }, [trigger, run, text])

  return (
    <span
      ref={ref}
      aria-label={text}
      className={cn("inline-block whitespace-pre font-mono", className)}
      onPointerEnter={(event) => {
        if (trigger === "hover") run()
        onPointerEnter?.(event)
      }}
      {...props}
    >
      <span aria-hidden>{output}</span>
    </span>
  )
}
