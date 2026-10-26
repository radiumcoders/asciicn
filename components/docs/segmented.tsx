"use client"

import { motion } from "motion/react"
import * as React from "react"

import { cn } from "@/lib/utils"

// A row of text tabs with a pill that springs to the active one.
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  className?: string
}) {
  const id = React.useId()

  return (
    <div role="tablist" className={cn("flex items-center gap-0.5", className)}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          role="tab"
          aria-selected={value === option}
          onClick={() => onChange(option)}
          className={cn(
            "relative h-7 px-2.5 text-[13px] font-medium transition-colors",
            value === option ? "text-ink" : "text-dim hover:text-ink"
          )}
        >
          {value === option ? (
            <motion.span
              layoutId={id}
              className="absolute inset-0 bg-wash"
              transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            />
          ) : null}
          <span className="relative">{option}</span>
        </button>
      ))}
    </div>
  )
}
