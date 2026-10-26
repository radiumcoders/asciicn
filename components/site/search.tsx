"use client"

import { Dialog } from "@base-ui/react/dialog"
import { AnimatePresence, motion } from "motion/react"
import { useTheme } from "next-themes"
import { usePathname, useRouter } from "next/navigation"
import * as React from "react"

import { site } from "@/lib/site"
import { cn } from "@/lib/utils"
import { ScrambleText } from "@/components/site/scramble-text"

export type SearchPage = {
  title: string
  description?: string
  url: string
  group: string
  headings: { title: string; url: string }[]
  /** Registry URL, for component pages. */
  install?: string
}

type Entry = {
  id: string
  kind: "page" | "heading" | "action"
  group: string
  title: string
  description?: string
  /** The page a heading belongs to. */
  parent?: string
  url?: string
  icon: React.ReactNode
  /** Extra words an action answers to. */
  keywords?: string
  /** Actions: return a confirmation to flash before closing. */
  run?: () => string | void | Promise<string | void>
}

type Result = Entry & { score: number; marks: number[]; descMarks: number[] }

const SearchContext = React.createContext<() => void>(() => {})

export const useOpenSearch = () => React.useContext(SearchContext)

// The site is small, so search ranks pages, their sections and a few actions in the browser.
export function SearchProvider({ pages, children }: { pages: SearchPage[]; children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(0)
  const [flash, setFlash] = React.useState<{ id: string; text: string } | null>(null)
  const listRef = React.useRef<HTMLUListElement>(null)
  // Keyboard moves scroll the list; pointer moves must not.
  const viaKeyboard = React.useRef(false)

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Every opening starts fresh, however it was opened.
  React.useEffect(() => {
    if (!open) return
    setQuery("")
    setActive(0)
    setFlash(null)
  }, [open])

  const current = pages.find((page) => page.url === pathname)

  const entries = React.useMemo<Entry[]>(() => {
    const docs = pages.flatMap<Entry>((page) => [
      {
        id: page.url,
        kind: "page",
        group: page.group,
        title: page.title,
        description: page.description,
        url: page.url,
        icon: page.install ? <ComponentIcon /> : <PageIcon />,
      },
      ...page.headings.map<Entry>((heading) => ({
        id: `${page.url}${heading.url}`,
        kind: "heading",
        group: "Sections",
        title: heading.title,
        parent: page.title,
        url: `${page.url}${heading.url}`,
        icon: <span className="font-mono text-[13px]">#</span>,
      })),
    ])

    const actions: Entry[] = [
      {
        id: "action:theme",
        kind: "action",
        group: "Actions",
        title: resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode",
        icon: resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />,
        keywords: "theme dark light mode toggle appearance",
        run: () => switchTheme(resolvedTheme === "dark" ? "light" : "dark", setTheme),
      },
    ]
    if (current?.install) {
      const command = `${runner()} shadcn@latest add ${current.install}`
      actions.push({
        id: "action:install",
        kind: "action",
        group: "Actions",
        title: `Copy install command for ${current.title}`,
        keywords: "install add cli shadcn npx pnpm",
        description: command,
        icon: <span className="font-mono text-[12px]">$_</span>,
        run: async () => {
          await navigator.clipboard.writeText(command)
          return "Copied install command"
        },
      })
    }
    if (current) {
      actions.push({
        id: "action:markdown",
        kind: "action",
        group: "Actions",
        title: "Copy page as Markdown",
        keywords: "markdown md llm ai chatgpt claude",
        description: `${current.url}.md`,
        icon: <MarkdownIcon />,
        run: async () => {
          const text = fetch(`${current.url}.md`).then((response) => response.text())
          try {
            await navigator.clipboard.write([new ClipboardItem({ "text/plain": text.then((value) => new Blob([value], { type: "text/plain" })) })])
          } catch {
            await navigator.clipboard.writeText(await text)
          }
          return "Copied page as Markdown"
        },
      })
    }
    actions.push(
      {
        id: "action:github",
        kind: "action",
        group: "Actions",
        title: "Open GitHub",
        keywords: "source repo code star",
        description: site.github.replace("https://", ""),
        icon: <GithubIcon />,
        run: () => void window.open(site.github, "_blank", "noreferrer"),
      },
      {
        id: "action:llms",
        kind: "action",
        group: "Actions",
        title: "View llms.txt",
        keywords: "llm ai markdown agents",
        description: "Every page, indexed for language models",
        icon: <span className="font-mono text-[10px] tracking-tight">txt</span>,
        run: () => void window.open("/llms.txt", "_blank"),
      }
    )
    return [...docs, ...actions]
  }, [pages, current, resolvedTheme, setTheme])

  const results = React.useMemo(() => {
    const order = [...new Set(pages.map((page) => page.group)), "Sections", "Actions"]
    return search(entries, query, order)
  }, [pages, entries, query])

  // Keep the keyboard selection in view.
  React.useEffect(() => {
    if (!viaKeyboard.current) return
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" })
  }, [active])

  const choose = async (entry: Result | undefined) => {
    if (!entry || flash) return
    if (entry.url) {
      setOpen(false)
      router.push(entry.url)
      return
    }
    if (entry.id === "action:theme") {
      // Let the dialog fade before the theme sweeps across the page.
      setOpen(false)
      setTimeout(() => entry.run?.(), 180)
      return
    }
    const message = await entry.run?.()
    if (!message) return setOpen(false)
    setFlash({ id: entry.id, text: message })
    setTimeout(() => {
      setOpen(false)
      setFlash(null)
    }, 750)
  }

  const move = (delta: number) => {
    viaKeyboard.current = true
    setActive((i) => (results.length ? (i + delta + results.length) % results.length : 0))
  }

  return (
    <SearchContext.Provider value={() => setOpen(true)}>
      {children}
      <Dialog.Root
        open={open}
        onOpenChange={setOpen}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:bg-black/50" />
          <Dialog.Popup className="fixed top-[14vh] left-1/2 z-50 flex max-h-[min(34rem,76vh)] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col overflow-hidden border border-line bg-sheet transition-[opacity,scale,translate] duration-250 ease-[cubic-bezier(0.34,1.25,0.64,1)] outline-none data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[ending-style]:duration-150 data-[ending-style]:ease-out data-[starting-style]:-translate-y-2 data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0">
            <Dialog.Title className="sr-only">Search docs</Dialog.Title>
            <div className="flex items-center gap-3 px-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-4 shrink-0 text-dim">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                autoFocus
                value={query}
                placeholder="Search docs, sections, actions..."
                aria-label="Search"
                role="combobox"
                aria-expanded
                aria-controls="search-results"
                aria-activedescendant={results[active] ? `search-${active}` : undefined}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActive(0)
                  viaKeyboard.current = true
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown" || (event.ctrlKey && event.key === "n")) {
                    event.preventDefault()
                    move(1)
                  } else if (event.key === "ArrowUp" || (event.ctrlKey && event.key === "p")) {
                    event.preventDefault()
                    move(-1)
                  } else if (event.key === "Enter") {
                    event.preventDefault()
                    choose(results[active])
                  }
                }}
                className="h-14 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-dim/80"
              />
              <span className="shrink-0 font-mono text-[11px] text-dim/70 tabular-nums">
                {query.trim() ? `${results.length} ${results.length === 1 ? "result" : "results"}` : null}
              </span>
            </div>
            <ul
              ref={listRef}
              id="search-results"
              role="listbox"
              onPointerMove={() => (viaKeyboard.current = false)}
              className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-line p-1.5"
            >
              {results.length === 0 ? (
                <li className="flex flex-col items-center gap-2 px-3 py-12 text-center font-mono text-[13px] text-dim">
                  <span aria-hidden className="text-[15px] text-dim/60">
                    ¯\_(ツ)_/¯
                  </span>
                  <span>
                    no match for <span className="text-ink">&quot;{query}&quot;</span>
                  </span>
                </li>
              ) : (
                results.map((entry, i) => {
                  const isActive = i === active
                  const flashing = flash?.id === entry.id
                  return (
                    <li key={entry.id}>
                      {i === 0 || results[i - 1].group !== entry.group ? (
                        <p className={cn("px-3 pb-1 font-mono text-[11px] tracking-wide text-dim/70 uppercase", i === 0 ? "pt-1.5" : "pt-3.5")}>
                          {entry.group}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        role="option"
                        id={`search-${i}`}
                        aria-selected={isActive}
                        data-index={i}
                        onPointerMove={() => i !== active && setActive(i)}
                        onClick={() => choose(entry)}
                        className={cn("relative flex w-full items-center gap-3 px-2.5 py-2 text-left outline-none", isActive && "inv")}
                      >
                        {isActive ? (
                          <motion.span
                            layoutId="search-active"
                            className="absolute inset-0 bg-cursor"
                            transition={{ type: "spring", duration: 0.3, bounce: 0.12 }}
                          />
                        ) : null}
                        <span
                          className={cn(
                            "relative flex size-7 shrink-0 items-center justify-center border transition-colors duration-150",
                            isActive ? "border-line bg-plate text-ink" : "border-line bg-sheet text-dim"
                          )}
                        >
                          <AnimatePresence mode="popLayout" initial={false}>
                            <motion.span
                              key={flashing ? "done" : "icon"}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={{ type: "spring", duration: 0.3, bounce: 0.3 }}
                              className="flex"
                            >
                              {flashing ? <CheckIcon /> : entry.icon}
                            </motion.span>
                          </AnimatePresence>
                        </span>
                        <span className="relative flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="flex min-w-0 items-baseline gap-1.5 text-[14px]">
                            {entry.parent ? (
                              <span className="shrink-0 font-mono text-[12px] text-dim">
                                {entry.parent}
                                <span className="px-1 text-dim/50">›</span>
                              </span>
                            ) : null}
                            <span className="truncate font-medium">
                              {flashing ? <ScrambleText text={flash.text} duration={360} /> : <Highlight text={entry.title} marks={entry.marks} />}
                            </span>
                          </span>
                          {entry.description ? (
                            <span className={cn("truncate text-[12.5px] text-dim", entry.kind === "action" && "font-mono text-[11.5px]")}>
                              <Highlight text={entry.description} marks={entry.descMarks} />
                            </span>
                          ) : null}
                        </span>
                        <span
                          aria-hidden
                          className={cn(
                            "relative font-mono text-[12px] text-dim transition-[opacity,translate] duration-200",
                            isActive ? "translate-x-0 opacity-100" : "-translate-x-1 opacity-0"
                          )}
                        >
                          ↵
                        </span>
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
            <div className="flex items-center gap-4 px-4 py-2.5 font-mono text-[11px] text-dim border-t border-line">
              <span>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> move
              </span>
              <span>
                <Kbd>↵</Kbd> {results[active]?.kind === "action" ? "run" : "open"}
              </span>
              <span className="ml-auto">
                <Kbd>esc</Kbd> close
              </span>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </SearchContext.Provider>
  )
}

export function SearchTrigger({ className }: { className?: string }) {
  const open = React.useContext(SearchContext)

  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        "group flex h-8 w-full items-center gap-2 border border-line bg-sheet px-2.5 text-[13px] text-dim transition-colors hover:border-ink/30 hover:text-ink",
        className
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-3.5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-rotate-12">
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </svg>
      Search
      <kbd className="ml-auto font-mono text-[11px] text-dim/80">⌘K</kbd>
    </button>
  )
}

// Ranks: prefix, then word start, then substring, then letters in order. Sections trail their pages.
function search(entries: Entry[], query: string, order: string[]): Result[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    return entries
      .filter((entry) => entry.kind !== "heading")
      .map((entry) => ({ ...entry, score: 0, marks: [], descMarks: [] }))
      .sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group))
  }

  const results: Result[] = []
  for (const entry of entries) {
    const title = match(entry.title, q)
    const parent = entry.parent && q.includes(" ") ? match(`${entry.parent} ${entry.title}`, q) : null
    const desc = entry.description ? matchSubstring(entry.description, q) : null
    const keyword = entry.keywords?.split(" ").some((word) => word.startsWith(q)) ? 1.5 : null
    let score = title?.score ?? keyword ?? (parent ? parent.score + 3 : desc ? 6 : -1)
    if (score < 0) continue
    if (entry.kind === "heading") score += 0.5
    if (entry.kind === "action") score += 0.25
    results.push({ ...entry, score, marks: title?.marks ?? [], descMarks: title ? [] : (desc?.marks ?? []) })
  }

  // Groups appear in the order of their best hit; inside a group, best first.
  const best = new Map<string, number>()
  for (const result of results) best.set(result.group, Math.min(best.get(result.group) ?? Infinity, result.score))
  return results.sort(
    (a, b) =>
      best.get(a.group)! - best.get(b.group)! ||
      order.indexOf(a.group) - order.indexOf(b.group) ||
      a.score - b.score
  )
}

function match(text: string, q: string): { score: number; marks: number[] } | null {
  const lower = text.toLowerCase()
  const range = (start: number, length = q.length) => Array.from({ length }, (_, i) => start + i)
  const wordStart = (i: number) => i === 0 || !/[a-z0-9]/.test(lower[i - 1])

  const at = lower.indexOf(q)
  if (at === 0) return { score: 0, marks: range(0) }
  for (let i = at; i > 0; i = lower.indexOf(q, i + 1)) if (wordStart(i)) return { score: 1, marks: range(i) }
  if (at > 0) return { score: 2, marks: range(at) }

  // Forgive a last letter that differs: "theme" still finds Theming.
  if (q.length >= 4) {
    const stem = q.slice(0, -1)
    for (let i = lower.indexOf(stem); i >= 0; i = lower.indexOf(stem, i + 1)) {
      if (wordStart(i)) return { score: i === 0 ? 0.8 : 1.8, marks: range(i, stem.length) }
    }
  }

  const letters = q.replace(/\s+/g, "")
  if (letters.length < 2) return null

  // Word prefixes: "st" and "scte" both find Scramble Text.
  const prefixes = (qi: number, from: number): number[] | null => {
    if (qi === letters.length) return []
    for (let i = from; i < lower.length; i++) {
      if (lower[i] !== letters[qi] || !wordStart(i)) continue
      // Take as much of this word as matches, then jump to a later word for the rest.
      for (let run = 1; i + run <= lower.length && lower[i + run - 1] === letters[qi + run - 1]; run++) {
        const rest = prefixes(qi + run, i + run)
        if (rest) return [...range(i, run), ...rest]
      }
    }
    return null
  }
  const initials = prefixes(0, 0)
  if (initials) return { score: 2.5, marks: initials }

  // Letters close together, in order: "scrmbl".
  const marks: number[] = []
  let from = 0
  for (const char of letters) {
    const next = lower.indexOf(char, from)
    if (next < 0) return null
    marks.push(next)
    from = next + 1
  }
  const spread = marks[marks.length - 1] - marks[0] - marks.length + 1
  return letters.length >= 3 && spread <= 2 && wordStart(marks[0]) ? { score: 3 + spread / 10, marks } : null
}

function matchSubstring(text: string, q: string) {
  const at = text.toLowerCase().indexOf(q)
  return at < 0 ? null : { marks: Array.from({ length: q.length }, (_, i) => at + i) }
}

function Highlight({ text, marks }: { text: string; marks: number[] }) {
  if (!marks.length) return <>{text}</>
  const set = new Set(marks)
  const runs: { text: string; marked: boolean }[] = []
  for (let i = 0; i < text.length; i++) {
    const marked = set.has(i)
    const last = runs[runs.length - 1]
    if (last && last.marked === marked) last.text += text[i]
    else runs.push({ text: text[i], marked })
  }
  return (
    <>
      {runs.map((run, i) =>
        run.marked ? (
          <mark key={i} className="bg-ink/10 text-ink underline decoration-ink/30 underline-offset-[3px]">
            {run.text}
          </mark>
        ) : (
          run.text
        )
      )}
    </>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="mr-1 inline-flex h-[18px] min-w-[18px] items-center justify-center border border-line bg-sheet px-1 font-mono text-[10px] text-ink">{children}</kbd>
}

// Same package manager the install blocks remember.
function runner() {
  const runners: Record<string, string> = { pnpm: "pnpm dlx", npm: "npx", yarn: "yarn dlx", bun: "bunx --bun" }
  try {
    return runners[localStorage.getItem("asciicn:pm") ?? ""] ?? runners.pnpm
  } catch {
    return runners.pnpm
  }
}

// The new theme spreads from the middle of the screen, where the palette was.
function switchTheme(next: "light" | "dark", setTheme: (theme: string) => void) {
  const apply = () => {
    document.documentElement.classList.toggle("dark", next === "dark")
    document.documentElement.style.colorScheme = next
    setTheme(next)
  }
  if (!document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return apply()
  const x = innerWidth / 2
  const y = innerHeight * 0.2
  const root = document.documentElement.style
  root.setProperty("--vt-x", `${x}px`)
  root.setProperty("--vt-y", `${y}px`)
  root.setProperty("--vt-r", `${Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))}px`)
  document.startViewTransition(apply)
}

const icon = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "size-3.5",
}

function PageIcon() {
  return (
    <svg {...icon}>
      <path d="M6.5 3.5h7l4 4v13h-11z" />
      <path d="M13.5 3.5v4h4M9 12.5h6M9 16h4" />
    </svg>
  )
}

function ComponentIcon() {
  return (
    <svg {...icon}>
      <path d="M8 7 3.5 12 8 17M16 7l4.5 5-4.5 5" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg {...icon}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg {...icon}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </svg>
  )
}

function MarkdownIcon() {
  return (
    <svg {...icon}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
      <path d="M6.5 15V9l2.5 3 2.5-3v6M15 9v6m0 0 2.5-2.5M15 15l-2.5-2.5" />
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

function CheckIcon() {
  return (
    <svg {...icon} strokeWidth={2.25}>
      <path d="M5 12.5 10 17 19 7.5" />
    </svg>
  )
}
