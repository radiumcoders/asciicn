"use client"

import type * as React from "react"

import { AsciiShader, type AsciiShaderOptions } from "@/components/ui/ascii-shader"

export type LatticeOptions = Omit<AsciiShaderOptions, "seed" | "field">

export type LatticeProps = LatticeOptions & React.HTMLAttributes<HTMLDivElement>

// Violet silk folding over itself, drawn in glyphs.
export function Lattice(props: LatticeProps) {
  return <AsciiShader seed="lattice" field="silk" {...props} />
}
