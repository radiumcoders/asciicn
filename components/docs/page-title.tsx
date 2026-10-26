"use client"

import { ScrambleText } from "@/registry/scramble-text/scramble-text"

// Titles decode in on arrival: the site using its own component.
export function PageTitle({ title }: { title: string }) {
  return (
    <h1 className="font-mono text-[clamp(1.75rem,4vw,2.4rem)] leading-tight font-semibold tracking-tight">
      <ScrambleText text={title} duration={650} />
    </h1>
  )
}
