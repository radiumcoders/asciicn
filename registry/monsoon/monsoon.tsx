"use client"

import type * as React from "react"

import { AsciiShader, type AsciiShaderOptions } from "@/components/ui/ascii-shader"

export type MonsoonOptions = Omit<AsciiShaderOptions, "seed" | "field">

export type MonsoonProps = MonsoonOptions & React.HTMLAttributes<HTMLDivElement>

// Teal arcs sweeping through a dark field.
export function Monsoon(props: MonsoonProps) {
  return <AsciiShader seed="monsoon" field="silk" {...props} />
}
