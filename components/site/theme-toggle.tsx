"use client"

import { useTheme } from "next-themes"
import * as React from "react"

import { cn } from "@/lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const ref = React.useRef<HTMLButtonElement>(null)

  // The new theme grows out of the button as a circle.
  const toggle = React.useCallback(() => {
    const next = resolvedTheme === "dark" ? "light" : "dark"
    const apply = () => {
      document.documentElement.classList.toggle("dark", next === "dark")
      document.documentElement.style.colorScheme = next
      setTheme(next)
    }
    if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return apply()

    const rect = ref.current?.getBoundingClientRect()
    const x = rect ? rect.left + rect.width / 2 : innerWidth / 2
    const y = rect ? rect.top + rect.height / 2 : 0
    const root = document.documentElement.style
    root.setProperty("--vt-x", `${x}px`)
    root.setProperty("--vt-y", `${y}px`)
    root.setProperty("--vt-r", `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`)
    document.startViewTransition(apply)
  }, [resolvedTheme, setTheme])

  // Press D anywhere outside a text field.
  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.key !== "d" || event.metaKey || event.ctrlKey || event.altKey) return
      if (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      toggle()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [toggle])

  return (
    <button
      ref={ref}
      type="button"
      aria-label="Toggle theme"
      title="Toggle theme (D)"
      onClick={toggle}
      className={cn(
        "relative inline-flex size-8 items-center justify-center overflow-hidden text-dim transition-colors hover:bg-wash hover:text-ink",
        className
      )}
    >
      {/* Both icons render; CSS swaps them with a turn, so there's no hydration flash. */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        className="absolute size-4 transition-[rotate,scale,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:scale-50 dark:-rotate-90 dark:opacity-0"
      >
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
      </svg>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        className="absolute size-4 scale-50 rotate-90 opacity-0 transition-[rotate,scale,opacity] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] dark:scale-100 dark:rotate-0 dark:opacity-100"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
      </svg>
    </button>
  )
}
