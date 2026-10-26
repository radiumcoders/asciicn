"use client"

import type * as React from "react"

import { AsciiShader, type AsciiShaderOptions } from "@/components/ui/ascii-shader"

export type VelvetOptions = Omit<AsciiShaderOptions, "seed" | "field">

export type VelvetProps = VelvetOptions & React.HTMLAttributes<HTMLDivElement>

// Red smoke drifting slowly, in characters.
export function Velvet(props: VelvetProps) {
  return <AsciiShader seed="velvet" field="nebula" {...props} />
}
