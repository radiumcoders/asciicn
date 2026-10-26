"use client"

import { AnimatePresence, motion } from "motion/react"
import * as React from "react"

import { cn } from "@/lib/utils"

// h2/h3 that link to themselves. Clicking one also copies the link, and the # says so.
export function Heading({ as: Tag, id, children, className, ...props }: React.ComponentProps<"h2"> & { as: "h2" | "h3" }) {
  const [copied, setCopied] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined)

  React.useEffect(() => () => clearTimeout(timer.current), [])

  if (!id) return <Tag className={className} {...props}>{children}</Tag>

  return (
    <Tag id={id} className={cn("group", className)} {...props}>
      <a
        href={`#${id}`}
        onClick={() => {
          navigator.clipboard?.writeText(`${location.origin}${location.pathname}#${id}`).then(() => {
            setCopied(true)
            clearTimeout(timer.current)
            timer.current = setTimeout(() => setCopied(false), 1400)
          })
        }}
        className="inline-flex items-center gap-2"
      >
        {children}
        <span aria-hidden className="relative inline-flex font-mono text-[0.8em] font-normal text-dim/50">
          <AnimatePresence mode="popLayout" initial={false}>
            {copied ? (
              <motion.span
                key="copied"
                initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
                transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                className="text-[0.7em] whitespace-nowrap text-dim"
              >
                link copied
              </motion.span>
            ) : (
              <motion.span
                key="hash"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              >
                <span className="inline-block -translate-x-1 opacity-0 transition-[opacity,translate] duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                  #
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </span>
      </a>
    </Tag>
  )
}
