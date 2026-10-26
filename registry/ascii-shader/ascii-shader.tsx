"use client"

import * as React from "react"

import { CHARSETS, createShader } from "@/lib/ascii-shader"
import { cn } from "@/lib/utils"

export type AsciiCharset = keyof typeof CHARSETS

export interface AsciiShaderOptions {
  /** Everything comes from the seed: shape, palette and motion. */
  seed?: string
  /** `silk` draws glowing ribbons, `nebula` draws drifting smoke. */
  field?: "silk" | "nebula"
  /** Glyph height in CSS pixels. */
  cell?: number
  /** Which characters to draw with, from empty to dense. */
  charset?: AsciiCharset
  /** Your own ramp, from empty to dense, like `" .oO@"`. Overrides `charset`. */
  chars?: string
  /** `shader` uses the field's colours, `mono` uses your text colour. */
  color?: "shader" | "mono"
  /** Shifts every cell lighter or darker, from -1 to 1. */
  brightness?: number
  /** Pushes cells apart from the middle grey, from -1 to 1. */
  contrast?: number
  /** Share of cells allowed to draw, from 0 to 1. Lower values keep only the bright ones. */
  coverage?: number
  /** Dense glyphs in the dark parts instead of the bright ones. */
  invert?: boolean
  /** Opacity of the glyphs, from 0 to 1. */
  opacity?: number
  /** How much of the smooth shader shows behind the glyphs, from 0 to 1. */
  backdrop?: number
  /** Animation speed. 0 holds a still frame. */
  speed?: number
  /** Page colours behind the shader, as `#rrggbb`. Read from the page when left out. */
  background?: { dark: string; light: string }
}

export type AsciiShaderProps = AsciiShaderOptions & React.HTMLAttributes<HTMLDivElement>

// A seeded GPU field, drawn as ASCII. It follows the page's light and dark mode,
// pauses off-screen and holds still with reduced motion. Look props update live.
export function AsciiShader({
  seed = "asciicn",
  field = "silk",
  cell = 14,
  charset = "standard",
  chars,
  color = "shader",
  brightness = 0,
  contrast = 0,
  coverage = 1,
  invert = false,
  opacity = 1,
  backdrop = 0,
  speed = 1,
  background,
  className,
  ...props
}: AsciiShaderProps) {
  const canvas = React.useRef<HTMLCanvasElement>(null)
  const shader = React.useRef<ReturnType<typeof createShader> | null>(null)
  const dark = background?.dark
  const light = background?.light

  const look = { brightness, contrast, coverage, invert, opacity, backdrop, speed, mono: color === "mono" }
  const lookRef = React.useRef(look)
  lookRef.current = look

  // The mono colour is the text colour, read fresh because it changes with the theme.
  const lookFor = React.useCallback((element: HTMLElement) => {
    const { mono, ...rest } = lookRef.current
    return { ...rest, mono: mono ? rgbOf(getComputedStyle(element).color) : null }
  }, [])

  React.useEffect(() => {
    const element = canvas.current
    if (!element) return
    const root = document.documentElement
    const themeOf = () =>
      root.classList.contains("dark") ? "dark" : root.classList.contains("light") ? "light" : matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"

    let theme = themeOf()
    const start = () => {
      shader.current?.destroy()
      // Unlit cells must match the page exactly, so read the colour behind the canvas.
      const page = hexOf(pageColor(element))
      shader.current = createShader(element, {
        seed,
        field,
        cell,
        charset,
        chars,
        theme,
        look: lookFor(element),
        font: getComputedStyle(element).fontFamily,
        background: { dark: dark ?? page, light: light ?? page },
        onError: () => shader.current?.destroy(),
      })
    }
    start()

    const observer = new MutationObserver(() => {
      const next = themeOf()
      if (next === theme) return
      theme = next
      requestAnimationFrame(() => {
        // Given both colours, crossfade in place; otherwise re-read the page and restart.
        if (dark && light) {
          shader.current?.setTheme(next)
          shader.current?.set(lookFor(element))
        } else start()
      })
    })
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    return () => {
      observer.disconnect()
      shader.current?.destroy()
      shader.current = null
    }
  }, [seed, field, cell, charset, chars, dark, light, lookFor])

  React.useEffect(() => {
    if (canvas.current) shader.current?.set(lookFor(canvas.current))
  }, [brightness, contrast, coverage, invert, opacity, backdrop, speed, color, lookFor])

  return (
    <div aria-hidden className={cn("relative overflow-hidden", className)} {...props}>
      <canvas ref={canvas} className="absolute inset-0 size-full font-mono" />
    </div>
  )
}

// The first opaque background above the element.
function pageColor(element: HTMLElement) {
  for (let node: HTMLElement | null = element; node; node = node.parentElement) {
    const rgb = rgbOf(getComputedStyle(node).backgroundColor)
    if (rgb) return rgb
  }
  return [1, 1, 1]
}

// "rgb(r, g, b)" or an opaque "rgba(…)" as 0–1 floats; null when transparent.
function rgbOf(value: string) {
  const match = value.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/)
  if (!match || (match[4] !== undefined && Number(match[4]) < 1)) return null
  return [Number(match[1]) / 255, Number(match[2]) / 255, Number(match[3]) / 255]
}

const hexOf = (rgb: number[]) => `#${rgb.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`
