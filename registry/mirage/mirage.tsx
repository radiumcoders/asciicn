"use client"

import type * as React from "react"

import { AsciiShader, type AsciiShaderOptions } from "@/components/ui/ascii-shader"

export type MirageOptions = Omit<AsciiShaderOptions, "seed" | "field">

export type MirageProps = MirageOptions & React.HTMLAttributes<HTMLDivElement>

// Blue ribbons of light that bend across the page.
export function Mirage(props: MirageProps) {
  return <AsciiShader seed="mirage" field="silk" {...props} />
}
