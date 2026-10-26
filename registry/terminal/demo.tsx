"use client"

import { defineControls, type ControlValues } from "@/lib/controls"

import { Terminal, type TerminalLine } from "./terminal"

const LINES: TerminalLine[] = [
  { type: "command", text: "npx shadcn@latest add @asciicn/terminal" },
  { type: "output", text: "✔ Checking registry.", delay: 700 },
  { type: "output", text: "✔ Installing dependencies.", delay: 500 },
  { type: "output", text: "✔ Created 1 file:", delay: 260 },
  { type: "output", text: "  - components/ui/terminal.tsx" },
  { type: "command", text: "pnpm dev" },
  { type: "output", text: "▲ Next.js 16 ready on http://localhost:3000", delay: 900 },
]

export const controls = defineControls({
  typingSpeed: { type: "number", default: 45, min: 10, max: 150, step: 5 },
  loop: { type: "boolean", default: true },
  prompt: { type: "select", default: "$", options: ["$", ">", "❯", "~ %"] },
  title: { type: "text", default: "~/my-app" },
})

export default function TerminalDemo(props: Partial<ControlValues<typeof controls>>) {
  return (
    <Terminal
      lines={LINES}
      loop
      title="~/my-app"
      {...props}
      className="h-[min(18.5rem,62cqi)] w-[min(36rem,calc(100cqi-2rem))] text-[clamp(10px,2.6cqi,13px)]"
    />
  )
}
