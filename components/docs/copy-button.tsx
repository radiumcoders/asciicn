"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"

export function CopyButton({
  value,
  className,
}: {
  value: string | (() => string)
  className?: string
}) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1400)
    return () => clearTimeout(id)
  }, [copied])

  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : "Copy"}
      onClick={() => {
        navigator.clipboard.writeText(typeof value === "function" ? value() : value)
        setCopied(true)
      }}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-dim transition-colors hover:bg-wash hover:text-ink",
        className
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.svg
          key={copied ? "check" : "copy"}
          initial={{ opacity: 0, scale: 0.6, filter: "blur(2px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.6, filter: "blur(2px)" }}
          transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
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
    </button>
  )
}
