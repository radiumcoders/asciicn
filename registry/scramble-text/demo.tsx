"use client"

import * as React from "react"

import { ScrambleText } from "./scramble-text"

const LINES = ["text-mode components", "copy. paste. own it.", "made of characters"]

export default function ScrambleTextDemo() {
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % LINES.length), 2600)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center gap-3 px-6 text-center">
      <ScrambleText
        key={index}
        text={LINES[index]}
        className="text-[min(2.25rem,6.5cqi)] font-medium tracking-tight"
      />
      <ScrambleText
        text="hover to replay"
        trigger="hover"
        className="cursor-default text-sm text-muted-foreground"
      />
    </div>
  )
}
