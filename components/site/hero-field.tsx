"use client"

import { AsciiField } from "@/components/site/ascii-field"
import { ScrambleText } from "@/components/site/scramble-text"

export function HeroField() {
  return (
    <AsciiField
      cellSize={13}
      speed={0.6}
      scale={0.8}
      className="absolute inset-0 text-ink/20 [mask-image:radial-gradient(ellipse_at_center,transparent_15%,black_75%)]"
    />
  )
}

export function HeroTitle() {
  return (
    <h1 className="font-mono text-[clamp(2.25rem,7vw,4.5rem)] leading-[1.05] font-semibold tracking-tight">
      <ScrambleText text="text-mode" duration={1100} />
      <br />
      <span className="text-dim">components</span>
    </h1>
  )
}
