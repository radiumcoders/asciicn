"use client"

import { ScrambleText } from "@/components/site/scramble-text"

// Titles decode in on arrival: the site using its own component.
export function PageTitle({ title }: { title: string }) {
  return (
    <h1 className="font-mono text-[clamp(1.5rem,6.2vw,2.4rem)] leading-tight font-semibold tracking-tight text-balance">
      <ScrambleText text={title} duration={650} />
    </h1>
  )
}
