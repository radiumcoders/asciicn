"use client"

import * as React from "react"

import { defineControls, type ControlValues } from "@/lib/controls"

import { ScrambleText } from "./scramble-text"

const LINES = ["text-mode components", "copy. paste. own it.", "made of characters"]

export const controls = defineControls({
  duration: { type: "number", default: 900, min: 200, max: 3000, step: 50 },
  sequential: { type: "boolean", default: true },
  glyphs: { type: "select", default: "!<>-_\\/[]{}=+*^?#%&@$", options: ["!<>-_\\/[]{}=+*^?#%&@$", "01", "░▒▓█", "abcdefghijklmnopqrstuvwxyz"] },
})

export default function ScrambleTextDemo(props: Partial<ControlValues<typeof controls>>) {
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
        {...props}
        className="text-[min(2.25rem,6.5cqi)] font-medium tracking-tight"
      />
      <ScrambleText text="hover to replay" trigger="hover" {...props} className="cursor-default text-sm text-muted-foreground" />
    </div>
  )
}
