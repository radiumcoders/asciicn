"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type TerminalLine =
  | {
      type: "command"
      /** Typed out one character at a time after the prompt. */
      text: string
    }
  | {
      type: "output"
      /** Printed all at once. */
      text: string
      /** Milliseconds to wait before printing. Waits of 400ms or more show a spinner. */
      delay?: number
    }

export interface TerminalProps {
  /** The script to play, top to bottom. */
  lines: TerminalLine[]
  /**
   * Average milliseconds per typed character. Each keystroke varies a little, like a person typing.
   * @defaultValue 45
   */
  typingSpeed?: number
  /**
   * Replay the script after a pause once it finishes.
   * @defaultValue false
   */
  loop?: boolean
  /**
   * Characters shown before each command.
   * @defaultValue "$"
   */
  prompt?: string
  /** Text centered in the title bar. */
  title?: string
  /**
   * Wait until the terminal scrolls into view before playing.
   * @defaultValue true
   */
  startOnView?: boolean
}

const SPINNER = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

// Where playback is: lines before `line` are done; `chars` of the current command are typed.
type Playhead = { line: number; chars: number; pending: boolean }

export function Terminal({
  lines,
  typingSpeed = 45,
  loop = false,
  prompt = "$",
  title,
  startOnView = true,
  className,
  ...props
}: TerminalProps & React.HTMLAttributes<HTMLDivElement>) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const bodyRef = React.useRef<HTMLDivElement>(null)
  const [started, setStarted] = React.useState(!startOnView)
  const [reduced, setReduced] = React.useState(false)
  const [head, setHead] = React.useState<Playhead>({ line: 0, chars: 0, pending: false })

  // Inline arrays get a new identity every render; only restart when the script changes.
  const script = JSON.stringify(lines)
  const linesRef = React.useRef(lines)
  linesRef.current = lines

  React.useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
  }, [])

  React.useEffect(() => {
    if (!startOnView) {
      setStarted(true)
      return
    }
    const root = rootRef.current
    if (!root) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setStarted(true)
        observer.disconnect()
      }
    })
    observer.observe(root)
    return () => observer.disconnect()
  }, [startOnView])

  React.useEffect(() => {
    const script = linesRef.current
    if (reduced) {
      setHead({ line: script.length, chars: 0, pending: false })
      return
    }
    if (!started) return

    let cancelled = false
    const timers: number[] = []
    const wait = (ms: number) =>
      new Promise<void>((resolve) => timers.push(window.setTimeout(resolve, ms)))
    // A person types unevenly and pauses a beat after spaces and punctuation.
    const keystroke = (ch: string) =>
      typingSpeed * (0.45 + Math.random() * 1.1) + (/[\s/.\-@]/.test(ch) ? typingSpeed * 0.8 : 0)

    const play = async () => {
      do {
        setHead({ line: 0, chars: 0, pending: false })
        for (let i = 0; i < script.length; i++) {
          const line = script[i]
          if (line.type === "command") {
            setHead({ line: i, chars: 0, pending: false })
            await wait(i === 0 ? 500 : 420)
            for (let c = 1; c <= line.text.length; c++) {
              if (cancelled) return
              setHead({ line: i, chars: c, pending: false })
              await wait(keystroke(line.text[c - 1]))
            }
            await wait(280)
          } else {
            const delay = line.delay ?? 120
            setHead({ line: i, chars: 0, pending: delay >= 400 })
            await wait(delay)
          }
          if (cancelled) return
          setHead({ line: i + 1, chars: 0, pending: false })
        }
        if (!loop) return
        await wait(2600)
      } while (!cancelled)
    }
    play()

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [script, started, reduced, typingSpeed, loop])

  // Keep the newest line in view.
  React.useLayoutEffect(() => {
    const body = bodyRef.current
    if (body) body.scrollTop = body.scrollHeight
  }, [head])

  const promptEl = <span className="mr-[1ch] text-muted-foreground/70 select-none">{prompt}</span>
  const current = lines[head.line]

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex h-72 flex-col overflow-hidden rounded-xl bg-muted/60 font-mono text-[13px] leading-6 shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_32px_-12px_rgb(0_0_0/0.18)]",
        className
      )}
      {...props}
    >
      <style href="asciicn-terminal" precedence="default">
        {"@keyframes asciicn-terminal-blink{50%{opacity:0}}"}
      </style>
      <div className="relative flex h-9 shrink-0 items-center gap-1.5 px-3.5">
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        {title ? (
          <span className="absolute inset-x-16 truncate text-center text-[12px] text-muted-foreground">{title}</span>
        ) : null}
      </div>
      <div
        ref={bodyRef}
        role="log"
        aria-label={title ?? "Terminal"}
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 [scrollbar-width:none]"
      >
        {/* Screen readers get the whole script at once instead of keystrokes. */}
        <div className="sr-only">
          {lines.map((line, i) => (
            <p key={i}>{line.type === "command" ? `${prompt} ${line.text}` : line.text}</p>
          ))}
        </div>
        <div aria-hidden>
          {lines.slice(0, head.line).map((line, i) =>
            line.type === "command" ? (
              <div key={i} className="break-all whitespace-pre-wrap text-foreground">
                {promptEl}
                {line.text}
              </div>
            ) : (
              <div key={i} className="whitespace-pre-wrap text-muted-foreground">
                {line.text}
              </div>
            )
          )}
          {current?.type === "command" ? (
            <div className="break-all whitespace-pre-wrap text-foreground">
              {promptEl}
              {current.text.slice(0, head.chars)}
              <Cursor blinking={head.chars === 0} />
            </div>
          ) : current?.type === "output" && head.pending ? (
            <Spinner />
          ) : head.line >= lines.length ? (
            <div>
              {promptEl}
              <Cursor blinking={!reduced} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function Cursor({ blinking }: { blinking: boolean }) {
  return (
    <span
      className="ml-px inline-block h-[1.15em] w-[0.6em] translate-y-[0.2em] bg-foreground/75"
      style={blinking ? { animation: "asciicn-terminal-blink 1.06s steps(1, end) infinite" } : undefined}
    />
  )
}

function Spinner() {
  const [frame, setFrame] = React.useState(0)

  React.useEffect(() => {
    const id = setInterval(() => setFrame((f) => (f + 1) % SPINNER.length), 80)
    return () => clearInterval(id)
  }, [])

  return <div className="text-muted-foreground">{SPINNER[frame]}</div>
}
