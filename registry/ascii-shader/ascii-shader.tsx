"use client"

import * as React from "react"

import { createShader } from "@/lib/ascii-shader"
import { cn } from "@/lib/utils"

export interface AsciiShaderOptions {
  /** Everything comes from the seed: shape, palette and motion. */
  seed?: string
  /** `silk` draws glowing ribbons, `nebula` draws drifting smoke. */
  field?: "silk" | "nebula"
  /** Glyph height in CSS pixels. */
  cell?: number
  /** Page colours behind the shader, as `#rrggbb`. Read from the page when left out. */
  background?: { dark: string; light: string }
}

export type AsciiShaderProps = AsciiShaderOptions & React.HTMLAttributes<HTMLDivElement>

// A seeded GPU field, drawn as ASCII in the field's own colours. It follows the page's
// light and dark mode, pauses off-screen and holds still with reduced motion.
export function AsciiShader({ seed = "asciicn", field = "silk", cell = 14, background, className, ...props }: AsciiShaderProps) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const dark = background?.dark
  const light = background?.light

  React.useEffect(() => {
    const element = canvas.current
    if (!element) return
    const root = document.documentElement
    const themeOf = () =>
      root.classList.contains("dark") ? "dark" : root.classList.contains("light") ? "light" : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"

    let shader: ReturnType<typeof createShader> | null = null
    let theme = themeOf()
    const start = () => {
      shader?.destroy()
      // Unlit cells must match the page exactly, so read the colour behind the canvas.
      const page = pageColor(element)
      shader = createShader(element, {
        seed,
        field,
        cell,
        theme,
        font: getComputedStyle(element).fontFamily,
        background: { dark: dark ?? page, light: light ?? page },
        onError: () => shader?.destroy(),
      })
    }
    start()

    const observer = new MutationObserver(() => {
      const next = themeOf()
      if (next === theme) return
      theme = next
      // Given both colours, crossfade in place; otherwise re-read the page and restart.
      if (dark && light) shader?.setTheme(next)
      else requestAnimationFrame(start)
    })
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => {
      observer.disconnect()
      shader?.destroy()
    }
  }, [seed, field, cell, dark, light])

  return (
    <div aria-hidden className={cn("relative overflow-hidden", className)} {...props}>
      <canvas ref={canvas} className="absolute inset-0 size-full font-mono" />
    </div>
  )
}

// The first opaque background above the element, as #rrggbb.
function pageColor(element: HTMLElement) {
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    const match = getComputedStyle(node).backgroundColor.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/)
    if (match && (match[4] === undefined || Number(match[4]) === 1)) {
      return `#${match.slice(1, 4).map((v) => Math.round(Number(v)).toString(16).padStart(2, "0")).join("")}`
    }
  }
  return "#ffffff"
}
