"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface AsciiFieldProps {
  /**
   * Characters from empty to dense.
   * @defaultValue " .:-=+*#%@"
   */
  ramp?: string
  /**
   * Font size of one cell in pixels.
   * @defaultValue 14
   */
  cellSize?: number
  /**
   * Animation speed. 0 freezes the field.
   * @defaultValue 1
   */
  speed?: number
  /**
   * Size of the waves. Lower values give broader shapes.
   * @defaultValue 1
   */
  scale?: number
  /**
   * Swell the field around the pointer.
   * @defaultValue true
   */
  interactive?: boolean
}

export function AsciiField({
  ramp = " .:-=+*#%@",
  cellSize = 14,
  speed = 1,
  scale = 1,
  interactive = true,
  className,
  ...props
}: AsciiFieldProps & React.HTMLAttributes<HTMLDivElement>) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!wrap || !canvas || !ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const cellH = cellSize * 1.15
    let font = ""
    let cellW = cellSize * 0.6
    let cols = 0
    let rows = 0
    let raf = 0
    let visible = true
    let time = 0
    let last = performance.now()
    // Pointer target and the eased position that follows it.
    const pointer = { x: -1, y: -1, tx: -1, ty: -1, strength: 0, target: 0 }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      // Layout size, not the on-screen rect, so CSS transforms don't shrink it.
      const width = wrap.clientWidth
      const height = wrap.clientHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Measure the real glyph width so columns line up with the font.
      font = `${cellSize}px ${getComputedStyle(wrap).fontFamily}`
      ctx.font = font
      cellW = ctx.measureText("M").width || cellSize * 0.6
      cols = Math.ceil(width / cellW)
      rows = Math.ceil(height / cellH)
      // Resizing a canvas clears it, so repaint straight away.
      draw()
    }

    const draw = () => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = getComputedStyle(wrap).color
      ctx.font = font
      ctx.textBaseline = "top"

      const s = 0.09 * scale
      const t = time
      const top = ramp.length - 1
      const radius = 10

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // Aspect-correct so waves stay round.
          const fx = x
          const fy = y * (cellH / cellW)
          let v =
            Math.sin(fx * s + t) +
            Math.sin(fy * s * 1.3 - t * 0.8) +
            Math.sin((fx + fy) * s * 0.6 + t * 0.6) +
            Math.sin(Math.hypot(fx - cols / 2, fy - rows) * s * 0.9 - t * 1.2)
          v = (v + 4) / 8

          if (pointer.strength > 0.001) {
            const dx = x - pointer.x
            const dy = (y - pointer.y) * (cellH / cellW)
            v += Math.exp(-(dx * dx + dy * dy) / (radius * radius * 2)) * 0.55 * pointer.strength
          }

          // One glyph per cell keeps the grid exact and avoids ligatures.
          const ch = ramp[Math.max(0, Math.min(top, Math.round(v * v * top)))]
          if (ch !== " ") ctx.fillText(ch, x * cellW, y * cellH)
        }
      }
    }

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      time += dt * speed
      pointer.x += (pointer.tx - pointer.x) * 0.18
      pointer.y += (pointer.ty - pointer.y) * 0.18
      pointer.strength += (pointer.target - pointer.strength) * 0.08
      draw()
      if (visible) raf = requestAnimationFrame(loop)
    }

    const start = () => {
      cancelAnimationFrame(raf)
      last = performance.now()
      // Paint a frame right away so the field is never blank.
      draw()
      if (!reduced) raf = requestAnimationFrame(loop)
    }

    const onMove = (event: PointerEvent) => {
      const rect = wrap.getBoundingClientRect()
      const zoom = rect.width / (wrap.clientWidth || 1)
      pointer.tx = (event.clientX - rect.left) / zoom / cellW
      pointer.ty = (event.clientY - rect.top) / zoom / cellH
      if (pointer.target === 0) {
        pointer.x = pointer.tx
        pointer.y = pointer.ty
      }
      pointer.target = 1
      if (reduced) {
        pointer.x = pointer.tx
        pointer.y = pointer.ty
        pointer.strength = 1
        draw()
      }
    }
    const onLeave = () => {
      pointer.target = 0
      if (reduced) {
        pointer.strength = 0
        draw()
      }
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(wrap)

    // Stop drawing while scrolled out of view.
    const viewObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
      else cancelAnimationFrame(raf)
    })
    viewObserver.observe(wrap)

    if (interactive) {
      wrap.addEventListener("pointermove", onMove)
      wrap.addEventListener("pointerleave", onLeave)
    }

    resize()
    start()
    // Web fonts can land after the first measure.
    let disposed = false
    document.fonts?.ready.then(() => {
      if (!disposed) resize()
    })

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      viewObserver.disconnect()
      wrap.removeEventListener("pointermove", onMove)
      wrap.removeEventListener("pointerleave", onLeave)
    }
  }, [ramp, cellSize, speed, scale, interactive])

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={cn("relative size-full overflow-hidden font-mono select-none", className)}
      {...props}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}
