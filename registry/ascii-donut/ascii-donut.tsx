"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface AsciiDonutProps {
  /**
   * Characters from dim to bright.
   * @defaultValue ".,-~:;=!*#$@"
   */
  ramp?: string
  /**
   * Font size of one cell in pixels.
   * @defaultValue 12
   */
  cellSize?: number
  /**
   * Auto-rotation speed. 0 holds it still.
   * @defaultValue 1
   */
  speed?: number
  /**
   * How much of the container the donut fills, from 0 to 1.
   * @defaultValue 0.85
   */
  fill?: number
  /**
   * Drag to spin it. It coasts, then eases back to its own rotation.
   * @defaultValue true
   */
  interactive?: boolean
}

// Torus radii and camera distance, as in Andy Sloane's donut.c.
const R1 = 1
const R2 = 2
const K2 = 5

export function AsciiDonut({
  ramp = ".,-~:;=!*#$@",
  cellSize = 12,
  speed = 1,
  fill = 0.85,
  interactive = true,
  className,
  ...props
}: AsciiDonutProps & React.HTMLAttributes<HTMLDivElement>) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!wrap || !canvas || !ctx || !ramp.length) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const cellH = cellSize * 1.15
    let font = ""
    let cellW = cellSize * 0.6
    let width = 0
    let height = 0
    let cols = 0
    let rows = 0
    let depth = new Float32Array(0)
    let shade = new Int16Array(0)

    // Tilt (x), turn (y) and tumble (z), with their angular velocities.
    const angle = { x: 0.9, y: 0, z: 0.35 }
    const auto = { x: 0.9 * speed, y: 0, z: 0.45 * speed }
    const velocity = { ...auto }
    const drag = { active: false, id: -1, x: 0, y: 0, t: 0 }

    let raf = 0
    let visible = true
    let disposed = false
    let last = performance.now()

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      // Layout size, not the on-screen rect, so CSS transforms don't shrink it.
      width = wrap.clientWidth
      height = wrap.clientHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Measure the real glyph width so columns line up with the font.
      font = `${cellSize}px ${getComputedStyle(wrap).fontFamily}`
      ctx.font = font
      cellW = ctx.measureText("M").width || cellSize * 0.6
      cols = Math.max(1, Math.floor(width / cellW))
      rows = Math.max(1, Math.floor(height / cellH))
      depth = new Float32Array(cols * rows)
      shade = new Int16Array(cols * rows)
      // Resizing a canvas clears it, so repaint straight away.
      draw()
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      if (!cols || !rows) return

      depth.fill(0)
      shade.fill(-1)

      const top = ramp.length - 1
      const cx = Math.cos(angle.x)
      const sx = Math.sin(angle.x)
      const cy = Math.cos(angle.y)
      const sy = Math.sin(angle.y)
      const cz = Math.cos(angle.z)
      const sz = Math.sin(angle.z)

      // Scale so the donut's widest projection fills `fill` of the short side.
      const side = Math.min(width, height)
      const k1 = (side * fill * (K2 - R1)) / (2 * (R1 + R2) * 1.05)
      const ox = (width - cols * cellW) / 2
      const oy = (height - rows * cellH) / 2
      const midX = width / 2
      const midY = height / 2

      // Sample finely enough that big donuts don't show holes.
      const density = Math.max(1, (k1 * (R1 + R2)) / K2 / (cellW * 18))
      const thetaStep = 0.07 / density
      const phiStep = 0.02 / density

      for (let theta = 0; theta < Math.PI * 2; theta += thetaStep) {
        const ct = Math.cos(theta)
        const st = Math.sin(theta)
        const circleX = R2 + R1 * ct
        const circleY = R1 * st

        for (let phi = 0; phi < Math.PI * 2; phi += phiStep) {
          const cp = Math.cos(phi)
          const sp = Math.sin(phi)

          // Point and normal on the torus, spun around its own y axis.
          let px = circleX * cp
          let py = circleY
          let pz = -circleX * sp
          let nx = ct * cp
          let ny = st
          let nz = -ct * sp

          // Tilt around x.
          let t = py * cx - pz * sx
          pz = py * sx + pz * cx
          py = t
          t = ny * cx - nz * sx
          nz = ny * sx + nz * cx
          ny = t

          // Turn around y.
          t = px * cy + pz * sy
          pz = -px * sy + pz * cy
          px = t
          t = nx * cy + nz * sy
          nz = -nx * sy + nz * cy
          nx = t

          // Tumble around z.
          t = px * cz - py * sz
          py = px * sz + py * cz
          px = t
          t = nx * cz - ny * sz
          ny = nx * sz + ny * cz
          nx = t

          // Light from above and behind the viewer.
          const luminance = (ny - nz) * Math.SQRT1_2
          if (luminance <= 0) continue

          const ooz = 1 / (pz + K2)
          const col = Math.floor((midX + k1 * ooz * px - ox) / cellW)
          const row = Math.floor((midY - k1 * ooz * py - oy) / cellH)
          if (col < 0 || col >= cols || row < 0 || row >= rows) continue

          const index = row * cols + col
          if (ooz > depth[index]) {
            depth[index] = ooz
            shade[index] = Math.min(top, Math.floor(luminance * (top + 0.999)))
          }
        }
      }

      ctx.font = font
      ctx.textBaseline = "top"
      ctx.fillStyle = getComputedStyle(wrap).color

      // One pass per ramp step, so alpha changes once per step, not per glyph.
      for (let level = 0; level <= top; level++) {
        const ch = ramp[level]
        if (ch === " ") continue
        ctx.globalAlpha = 0.4 + 0.6 * (level / Math.max(top, 1))
        for (let i = 0; i < shade.length; i++) {
          if (shade[i] !== level) continue
          const col = i % cols
          const row = (i - col) / cols
          ctx.fillText(ch, ox + col * cellW, oy + row * cellH)
        }
      }
      ctx.globalAlpha = 1
    }

    const step = (dt: number) => {
      if (!drag.active) {
        // Coast, then ease back toward the auto-rotation.
        const ease = 1 - Math.exp(-dt * 1.6)
        velocity.x += (auto.x - velocity.x) * ease
        velocity.y += (auto.y - velocity.y) * ease
        velocity.z += (auto.z - velocity.z) * ease
        angle.x += velocity.x * dt
        angle.y += velocity.y * dt
        angle.z += velocity.z * dt
      }
    }

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      step(dt)
      draw()
      if (visible) raf = requestAnimationFrame(loop)
    }

    const start = () => {
      cancelAnimationFrame(raf)
      last = performance.now()
      // Paint a frame right away so the donut is never blank.
      draw()
      if (!reduced) raf = requestAnimationFrame(loop)
    }

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === "mouse") return
      drag.active = true
      drag.id = event.pointerId
      drag.x = event.clientX
      drag.y = event.clientY
      drag.t = performance.now()
      velocity.x = 0
      velocity.y = 0
      velocity.z = 0
      wrap.setPointerCapture(event.pointerId)
    }

    const onMove = (event: PointerEvent) => {
      if (!drag.active || event.pointerId !== drag.id) return
      const now = performance.now()
      const dt = Math.max((now - drag.t) / 1000, 1 / 240)
      const dx = event.clientX - drag.x
      const dy = event.clientY - drag.y
      const turn = dx * 0.012
      const tilt = dy * 0.012
      angle.y += turn
      angle.x += tilt
      // Smoothed release velocity.
      velocity.y = velocity.y * 0.6 + (turn / dt) * 0.4
      velocity.x = velocity.x * 0.6 + (tilt / dt) * 0.4
      drag.x = event.clientX
      drag.y = event.clientY
      drag.t = now
      if (reduced || !visible) draw()
    }

    const onUp = (event: PointerEvent) => {
      if (event.pointerId !== drag.id) return
      drag.active = false
      // A pause before letting go means no fling.
      if (performance.now() - drag.t > 80) {
        velocity.x = 0
        velocity.y = 0
      }
      if (wrap.hasPointerCapture(event.pointerId)) wrap.releasePointerCapture(event.pointerId)
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
      wrap.addEventListener("pointerdown", onDown)
      wrap.addEventListener("pointermove", onMove)
      wrap.addEventListener("pointerup", onUp)
      wrap.addEventListener("pointercancel", onUp)
    }

    resize()
    start()
    // Web fonts can land after the first measure.
    document.fonts?.ready.then(() => {
      if (!disposed) resize()
    })

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      resizeObserver.disconnect()
      viewObserver.disconnect()
      wrap.removeEventListener("pointerdown", onDown)
      wrap.removeEventListener("pointermove", onMove)
      wrap.removeEventListener("pointerup", onUp)
      wrap.removeEventListener("pointercancel", onUp)
    }
  }, [ramp, cellSize, speed, fill, interactive])

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={cn(
        "relative size-full overflow-hidden font-mono select-none",
        interactive && "cursor-grab touch-none active:cursor-grabbing",
        className
      )}
      {...props}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  )
}
