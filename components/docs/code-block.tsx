"use client"

import * as React from "react"

import { CopyButton } from "@/components/docs/copy-button"
import { cn } from "@/lib/utils"

type PreProps = React.ComponentProps<"pre"> & {
  title?: string
  icon?: string
  allowCopy?: string
}

// MDX `pre` override. With a `title` it gets a quiet file row and the code sits
// on an inset stage; without one it's a single plate with a hover copy button.
export function CodeBlock({ title, icon: _icon, allowCopy, className, children, ...props }: PreProps) {
  const ref = React.useRef<HTMLPreElement>(null)
  const copy = allowCopy !== "false"
  const value = () => ref.current?.textContent ?? ""

  const pre = (
    <pre ref={ref} className={cn("code-block", className)} {...props}>
      {children}
    </pre>
  )

  return title ? (
    <CodeFrame title={title} copy={copy ? value : undefined}>
      {pre}
    </CodeFrame>
  ) : (
    <div className="not-prose group relative my-5 border border-line bg-plate">
      {pre}
      {copy ? (
        <CopyButton
          value={value}
          className="absolute top-2 right-2 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        />
      ) : null}
    </div>
  )
}

// A titled frame: file row on the plate, code on the stage inside it.
export function CodeFrame({
  title,
  copy,
  html,
  children,
}: {
  title: string
  copy?: string | (() => string)
  html?: string
  children?: React.ReactNode
}) {
  const ref = React.useRef<HTMLDivElement>(null)

  return (
    <figure className="not-prose my-5 border border-line bg-plate">
      <figcaption className="flex h-9 items-center gap-2 border-b border-line pr-1 pl-3 font-mono text-[12px] text-dim">
        <FileGlyph name={title} />
        <span className="min-w-0 flex-1 truncate">
          <Path value={title} />
        </span>
        {copy !== undefined || html ? (
          <CopyButton
            value={copy ?? (() => ref.current?.textContent ?? "")}
            className="size-7"
          />
        ) : null}
      </figcaption>
      {html ? (
        <div ref={ref} className="code-frame bg-stage" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div ref={ref} className="code-frame bg-stage">
          {children}
        </div>
      )}
    </figure>
  )
}

// Directories recede so the file name carries the row.
function Path({ value }: { value: string }) {
  const at = value.lastIndexOf("/")
  if (at < 0) return <span className="text-ink">{value}</span>
  return (
    <>
      <span className="text-dim/70">{value.slice(0, at + 1)}</span>
      <span className="text-ink">{value.slice(at + 1)}</span>
    </>
  )
}

function FileGlyph({ name }: { name: string }) {
  const shell = /\.(sh|bash|zsh)$/.test(name) || !name.includes(".")
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5 shrink-0 text-dim/70"
    >
      {shell ? (
        <path d="M3.5 5 6.5 8l-3 3M8.5 11.5h4" />
      ) : (
        <>
          <path d="M9 1.75H4.5a1.25 1.25 0 0 0-1.25 1.25v10a1.25 1.25 0 0 0 1.25 1.25h7a1.25 1.25 0 0 0 1.25-1.25V5.5Z" />
          <path d="M9 1.75V5.5h3.75" />
        </>
      )}
    </svg>
  )
}
