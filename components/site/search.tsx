"use client"

import { Dialog } from "@base-ui/react/dialog"
import { motion } from "motion/react"
import { useRouter } from "next/navigation"
import * as React from "react"

import { cn } from "@/lib/utils"

export type SearchPage = { title: string; description?: string; url: string; group?: string }

const SearchContext = React.createContext<() => void>(() => {})

// The site is small, so search filters the page list in the browser.
export function SearchProvider({ pages, children }: { pages: SearchPage[]; children: React.ReactNode }) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [active, setActive] = React.useState(0)
  const listRef = React.useRef<HTMLUListElement>(null)

  // Keep the keyboard selection in view.
  React.useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" })
  }, [active])

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

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    // Title hits rank above description hits; groups stay together.
    const score = (page: SearchPage) =>
      !q ? 0 : page.title.toLowerCase().includes(q) ? 0 : (page.description ?? "").toLowerCase().includes(q) ? 1 : -1
    return pages
      .filter((page) => score(page) >= 0)
      .sort(
        (a, b) =>
          Number(groupOf(a.url) === "Components") - Number(groupOf(b.url) === "Components") ||
          score(a) - score(b) ||
          a.title.localeCompare(b.title)
      )
  }, [pages, query])

  const go = (page: SearchPage | undefined) => {
    if (!page) return
    setOpen(false)
    router.push(page.url)
  }

  return (
    <SearchContext.Provider value={() => setOpen(true)}>
      {children}
      <Dialog.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (next) {
            setQuery("")
            setActive(0)
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:bg-black/50" />
          <Dialog.Popup className="fixed top-[18vh] left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl bg-sheet shadow-[0_24px_60px_-12px_rgb(0_0_0/0.3),0_0_0_1px_rgb(0_0_0/0.04)] transition-[opacity,scale] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0 dark:bg-plate">
            <Dialog.Title className="sr-only">Search docs</Dialog.Title>
            <input
              autoFocus
              value={query}
              placeholder="Search docs..."
              onChange={(event) => {
                setQuery(event.target.value)
                setActive(0)
              }}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault()
                  setActive((i) => Math.min(i + 1, results.length - 1))
                } else if (event.key === "ArrowUp") {
                  event.preventDefault()
                  setActive((i) => Math.max(i - 1, 0))
                } else if (event.key === "Enter") {
                  go(results[active])
                }
              }}
              className="h-13 w-full bg-transparent px-5 text-[15px] outline-none placeholder:text-dim"
            />
            <ul ref={listRef} className="relative max-h-80 overflow-y-auto p-1.5 shadow-[inset_0_1px_0_var(--border)]">
              {results.length === 0 ? (
                <li className="px-3 py-8 text-center font-mono text-[13px] text-dim">
                  no match for <span className="text-ink">&quot;{query}&quot;</span>
                </li>
              ) : (
                results.map((page, i) => {
                  const group = groupOf(page.url)
                  return (
                    <li key={page.url}>
                      {i === 0 || groupOf(results[i - 1].url) !== group ? (
                        <p className="px-3 pt-2.5 pb-1 font-mono text-[11px] tracking-wide text-dim/70 uppercase">{group}</p>
                      ) : null}
                      <button
                        type="button"
                        data-index={i}
                        onMouseMove={() => setActive(i)}
                        onClick={() => go(page)}
                        className="relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left"
                      >
                        {i === active ? (
                          <motion.span
                            layoutId="search-active"
                            className="absolute inset-0 rounded-lg bg-wash"
                            transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
                          />
                        ) : null}
                        <span className="relative flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-[14px] font-medium">
                            <Highlight text={page.title} query={query} />
                          </span>
                          {page.description ? (
                            <span className="line-clamp-1 text-[13px] text-dim">
                              <Highlight text={page.description} query={query} />
                            </span>
                          ) : null}
                        </span>
                        <span
                          aria-hidden
                          className={cn("relative font-mono text-[12px] text-dim transition-opacity", i === active ? "opacity-100" : "opacity-0")}
                        >
                          ↵
                        </span>
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
            <div className="flex items-center gap-4 px-4 py-2.5 font-mono text-[11px] text-dim shadow-[inset_0_1px_0_var(--border)]">
              <span>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd> move
              </span>
              <span>
                <Kbd>↵</Kbd> open
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
        "flex h-8 w-full items-center justify-between rounded-md bg-wash/60 px-2.5 text-[13px] text-dim transition-colors hover:bg-wash hover:text-ink",
        className
      )}
    >
      Search
      <kbd className="font-mono text-[11px] text-dim/80">⌘K</kbd>
    </button>
  )
}

const groupOf = (url: string) => (url.startsWith("/docs/components/") ? "Components" : "Get started")

function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  const at = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1
  if (at < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-[3px] bg-ink/10 text-ink">{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  )
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="mr-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded bg-wash px-1 font-mono text-[10px] text-ink">{children}</kbd>
}
