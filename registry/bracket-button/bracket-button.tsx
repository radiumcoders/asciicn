"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const GLYPHS = "!<>-_\\/[]{}=+*^?#%&@$"
const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

export interface BracketButtonProps {
  /**
   * Visual weight. `default` is solid ink, `tonal` a soft fill, `ghost` only fills on hover.
   * @defaultValue "default"
   */
  variant?: "default" | "tonal" | "ghost"
  /**
   * Height and text size.
   * @defaultValue "md"
   */
  size?: "sm" | "md" | "lg"
  /**
   * Swap the label for a spinner. The button keeps its width and ignores clicks.
   * @defaultValue false
   */
  loading?: boolean
  /**
   * Scramble a text label briefly on hover and keyboard focus.
   * @defaultValue true
   */
  scramble?: boolean
}

const variants = {
  default: "bg-foreground text-background hover:bg-foreground/90 [--bracket:color-mix(in_oklab,var(--background)_50%,transparent)]",
  tonal: "bg-muted text-foreground hover:bg-muted/70 [--bracket:color-mix(in_oklab,var(--foreground)_40%,transparent)]",
  ghost: "text-foreground hover:bg-muted/70 [--bracket:color-mix(in_oklab,var(--foreground)_40%,transparent)]",
}

const sizes = {
  sm: "h-8 rounded-md px-3 text-xs",
  md: "h-10 rounded-lg px-4 text-[13px]",
  lg: "h-12 rounded-xl px-5 text-sm",
}

// Brackets spring apart on hover/focus and pinch in while pressed.
const bracket =
  "inline-block text-[var(--bracket)] transition-[translate,color] duration-[420ms] ease-[cubic-bezier(0.34,1.7,0.5,1)] group-hover:text-current group-focus-visible:text-current group-active:duration-150 motion-reduce:transition-none"

export function BracketButton({
  variant = "default",
  size = "md",
  loading = false,
  scramble = true,
  className,
  children,
  onClick,
  onPointerEnter,
  onFocus,
  type = "button",
  ...props
}: BracketButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const label = typeof children === "string" ? children : null
  const [shown, setShown] = React.useState(label)
  const frame = React.useRef(0)

  React.useEffect(() => setShown(label), [label])
  React.useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const run = () => {
    if (!scramble || !label || loading) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    cancelAnimationFrame(frame.current)
    const start = performance.now()
    const duration = 320 + label.length * 18
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      let next = ""
      for (let i = 0; i < label.length; i++) {
        const settle = (i / label.length) * 0.7 + 0.3
        next += label[i] === " " || t >= settle ? label[i] : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      }
      setShown(next)
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }

  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      className={cn(
        "group relative inline-flex shrink-0 cursor-pointer items-center justify-center font-mono font-medium whitespace-nowrap transition-[background-color,scale] duration-150 outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none",
        variants[variant],
        sizes[size],
        loading && "cursor-progress",
        className
      )}
      onClick={(event) => {
        if (loading) {
          event.preventDefault()
          return
        }
        onClick?.(event)
      }}
      onPointerEnter={(event) => {
        run()
        onPointerEnter?.(event)
      }}
      onFocus={(event) => {
        if (event.currentTarget.matches(":focus-visible")) run()
        onFocus?.(event)
      }}
      {...props}
    >
      <span aria-hidden className={cn(bracket, "group-hover:-translate-x-[0.4ch] group-focus-visible:-translate-x-[0.4ch] group-active:translate-x-[0.2ch]")}>
        [
      </span>
      <span className="relative mx-[1ch] inline-grid place-items-center">
        {/* The label always holds the width, so loading never resizes the button. */}
        <span aria-hidden={label ? true : undefined} className={cn(loading && "invisible")}>
          {label ? shown : children}
        </span>
        {/* Kept outside the hidden label so the button keeps its name while loading. */}
        {label ? <span className="sr-only">{label}</span> : null}
        {loading ? <Spinner /> : null}
      </span>
      <span aria-hidden className={cn(bracket, "group-hover:translate-x-[0.4ch] group-focus-visible:translate-x-[0.4ch] group-active:-translate-x-[0.2ch]")}>
        ]
      </span>
    </button>
  )
}

function Spinner() {
  const [frame, setFrame] = React.useState(0)

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = setInterval(() => setFrame((f) => (f + 1) % SPINNER.length), 80)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="absolute inset-0 flex items-center justify-center" aria-hidden>
      {SPINNER[frame]}
    </span>
  )
}
