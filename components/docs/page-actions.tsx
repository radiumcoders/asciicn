"use client"

import { Menu } from "@base-ui/react/menu"
import { AnimatePresence, motion } from "motion/react"
import * as React from "react"

import { cn } from "@/lib/utils"
import { ScrambleText } from "@/components/site/scramble-text"

// "Copy page" plus a menu that hands the page's Markdown to other tools.
export function PageActions({
  markdownUrl,
  githubUrl,
  className,
}: {
  /** Where the page's Markdown lives, e.g. `/docs/installation.md`. */
  markdownUrl: string
  /** The page's source file on GitHub. */
  githubUrl: string
  className?: string
}) {
  const [copied, setCopied] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [origin, setOrigin] = React.useState("")
  const markdown = React.useRef<Promise<string> | null>(null)

  React.useEffect(() => setOrigin(window.location.origin), [])

  React.useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1600)
    return () => clearTimeout(id)
  }, [copied])

  // Start the fetch on hover so the click copies at once.
  const load = () => {
    markdown.current ??= fetch(markdownUrl).then((response) => {
      if (!response.ok) throw new Error(`${response.status}`)
      return response.text()
    })
    markdown.current.catch(() => (markdown.current = null))
    return markdown.current
  }

  const copy = async () => {
    const text = load()
    try {
      // Safari only allows clipboard writes inside the click, so hand it the pending text.
      await navigator.clipboard.write([
        new ClipboardItem({ "text/plain": text.then((value) => new Blob([value], { type: "text/plain" })) }),
      ])
    } catch {
      await navigator.clipboard.writeText(await text)
    }
    setCopied(true)
  }

  const absolute = origin ? new URL(markdownUrl, origin).href : markdownUrl
  const prompt = encodeURIComponent(`Read ${absolute} and answer questions about it.`)

  return (
    <div className={cn("inline-flex h-8 items-center border border-line bg-sheet text-[13px] font-medium", className)}>
      <button
        type="button"
        onClick={copy}
        onPointerEnter={load}
        onFocus={load}
        className="inline-flex h-full items-center gap-1.5 pr-2.5 pl-2 text-dim transition-colors hover:bg-wash hover:text-ink active:scale-[0.98]"
      >
        <span className="relative size-3.5">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.svg
              key={copied ? "check" : "copy"}
              initial={{ opacity: 0, scale: 0.5, filter: "blur(2px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.5, filter: "blur(2px)" }}
              transition={{ type: "spring", duration: 0.3, bounce: 0.25 }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("absolute inset-0 size-3.5", copied && "text-ink")}
            >
              {copied ? (
                <path d="M5 12.5 10 17 19 7.5" />
              ) : (
                <>
                  <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" />
                  <path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
                </>
              )}
            </motion.svg>
          </AnimatePresence>
        </span>
        {/* The label is mono, so its width is exact in ch and can spring between the two words. */}
        <motion.span
          initial={false}
          animate={{ width: copied ? "6ch" : "9ch" }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
          className="inline-block overflow-hidden text-left font-mono text-[12.5px]"
        >
          <ScrambleText key={String(copied)} text={copied ? "Copied" : "Copy page"} duration={copied ? 360 : 300} className={copied ? "text-ink" : undefined} />
        </motion.span>
      </button>

      <span aria-hidden className="h-full w-px bg-line" />

      <Menu.Root open={open} onOpenChange={setOpen}>
        <Menu.Trigger
          aria-label="More page actions"
          className="inline-flex h-full w-7 items-center justify-center text-dim transition-colors hover:bg-wash hover:text-ink data-[popup-open]:bg-wash data-[popup-open]:text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("size-3.5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]", open && "rotate-180")}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={6} align="end" className="z-50">
            <Menu.Popup className="w-64 origin-[var(--transform-origin)] border border-line bg-sheet p-1 transition-[opacity,scale,translate] duration-250 ease-[cubic-bezier(0.34,1.3,0.64,1)] outline-none data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[ending-style]:duration-150 data-[ending-style]:ease-out data-[starting-style]:-translate-y-1 data-[starting-style]:scale-95 data-[starting-style]:opacity-0 dark:bg-plate dark:shadow-[0_16px_40px_-12px_rgb(0_0_0/0.6),0_0_0_1px_rgb(255_255_255/0.06)]">
              <Item href={markdownUrl} label="View as Markdown" hint="Plain text of this page" icon={<MarkdownIcon />} />
              <Item href={`https://chatgpt.com/?hints=search&q=${prompt}`} label="Open in ChatGPT" hint="Ask about this page" icon={<ChatIcon />} />
              <Item href={`https://claude.ai/new?q=${prompt}`} label="Open in Claude" hint="Ask about this page" icon={<SparkIcon />} />
              <Menu.Separator className="rule-dashed mx-2 my-1 h-px" />
              <Item href={githubUrl} label="Edit on GitHub" hint="Suggest a change" icon={<GithubIcon />} />
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    </div>
  )
}

function Item({ href, label, hint, icon }: { href: string; label: string; hint: string; icon: React.ReactNode }) {
  return (
    <Menu.LinkItem
      href={href}
      target="_blank"
      rel="noreferrer"
      closeOnClick
      className="group/item flex items-center gap-3 px-2.5 py-2 text-ink outline-none select-none data-[highlighted]:inv data-[highlighted]:bg-cursor"
    >
      <span className="flex size-7 shrink-0 items-center justify-center border border-line text-dim group-data-[highlighted]/item:text-ink">
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[13px] font-medium">{label}</span>
        <span className="truncate text-[12px] text-dim">{hint}</span>
      </span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-3 -translate-x-1 translate-y-1 text-dim opacity-0 transition-[opacity,translate] duration-200 group-data-[highlighted]/item:translate-0 group-data-[highlighted]/item:opacity-100"
      >
        <path d="M7 17 17 7M8 7h9v9" />
      </svg>
    </Menu.LinkItem>
  )
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "size-3.5",
}

function MarkdownIcon() {
  return (
    <svg {...iconProps}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
      <path d="M6.5 15V9l2.5 3 2.5-3v6M15 9v6m0 0 2.5-2.5M15 15l-2.5-2.5" />
    </svg>
  )
}

function ChatIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20 11.5a7.5 7.5 0 0 1-11 6.6L4 19.5l1.4-4.6A7.5 7.5 0 1 1 20 11.5Z" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3 6.3 17.7" />
    </svg>
  )
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
      <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02a9.58 9.58 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
    </svg>
  )
}
