"use client"

import { Dialog } from "@base-ui/react/dialog"
import { motion } from "motion/react"
import * as React from "react"

import { isTyping } from "@/components/site/page-provider"

const ShortcutsContext = React.createContext<() => void>(() => {})

export const useShortcuts = () => React.useContext(ShortcutsContext)

const KEYS: { keys: string[]; label: string }[] = [
  { keys: ["⌘", "K"], label: "search the docs" },
  { keys: ["/"], label: "search, without the chord" },
  { keys: ["["], label: "previous page" },
  { keys: ["]"], label: "next page" },
  { keys: ["D"], label: "switch light and dark" },
  { keys: ["?"], label: "this page" },
  { keys: ["esc"], label: "close whatever is open" },
  { keys: ["q"], label: "close this manual" },
]

// `?` opens the shortcuts as a man page. `/` opens search.
export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      if (event.key === "?") {
        event.preventDefault()
        setOpen((value) => !value)
      } else if (event.key === "q") {
        setOpen(false)
      } else if (event.key === "/") {
        event.preventDefault()
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <ShortcutsContext.Provider value={() => setOpen(true)}>
      {children}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/20 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 dark:bg-black/50" />
          <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 border border-line bg-sheet p-6 outline-none font-mono text-[13px] transition-[opacity,scale] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] data-[ending-style]:scale-[0.97] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.97] data-[starting-style]:opacity-0">
            <div className="flex justify-between text-[11.5px] text-dim">
              <span>ASCIICN(1)</span>
              <span className="hidden sm:inline">Keyboard Manual</span>
              <span>ASCIICN(1)</span>
            </div>

            <Dialog.Title className="mt-6 font-semibold">NAME</Dialog.Title>
            <Dialog.Description className="mt-1.5 pl-6 text-dim">
              shortcuts <span className="text-dim/60">-</span> move around the docs without a mouse
            </Dialog.Description>

            <p className="mt-6 font-semibold">KEYS</p>
            <ul className="mt-2 flex flex-col">
              {KEYS.map((row, i) => (
                <motion.li
                  key={row.label}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", duration: 0.4, bounce: 0, delay: 0.05 + i * 0.03 }}
                  className="flex items-center gap-4 py-1 pl-6"
                >
                  <span className="flex w-16 shrink-0 gap-1">
                    {row.keys.map((key) => (
                      <kbd
                        key={key}
                        className="inline-flex h-5 min-w-5 items-center justify-center border border-line px-1 text-[11px] text-ink"
                      >
                        {key}
                      </kbd>
                    ))}
                  </span>
                  <span className="text-dim">{row.label}</span>
                </motion.li>
              ))}
            </ul>

            <div className="mt-8 flex justify-between text-[11.5px] text-dim">
              <span>asciicn 0.1.0</span>
              <Dialog.Close className="px-1 outline-none transition-colors hover:text-ink focus-visible:bg-wash focus-visible:text-ink">[ q ]</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </ShortcutsContext.Provider>
  )
}
