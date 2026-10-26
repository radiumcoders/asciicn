"use client"

import { AnimatePresence, motion } from "motion/react"
import * as React from "react"

import { CopyButton } from "@/components/docs/copy-button"
import { Segmented } from "@/components/docs/segmented"
import { cn } from "@/lib/utils"
import { demos } from "@/registry/demos"

const TABS = ["Preview", "Code"] as const

export function PreviewTabs({
  name,
  code,
  html,
  className,
}: {
  name: string
  code: string
  html: string
  className?: string
}) {
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("Preview")
  const [run, setRun] = React.useState(0)
  const Demo = demos[name]

  return (
    <div className={cn("not-prose my-6 rounded-2xl bg-plate p-1", className)}>
      <div className="flex items-center justify-between p-0.5">
        <Segmented options={TABS} value={tab} onChange={setTab} />
        {tab === "Preview" ? (
          <button
            type="button"
            onClick={() => setRun((n) => n + 1)}
            className="h-7 rounded-md px-2.5 text-[13px] font-medium text-dim transition-colors hover:bg-wash hover:text-ink"
          >
            Replay
          </button>
        ) : (
          <CopyButton value={code} className="size-7" />
        )}
      </div>
      <div className="relative mt-1 h-[24rem] overflow-hidden rounded-xl bg-stage sm:h-[26rem]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {tab === "Preview" ? (
              <div className="@container flex size-full items-center justify-center">
                {Demo ? <Demo key={run} /> : null}
              </div>
            ) : (
              <div
                className="size-full overflow-auto p-4 font-mono text-[13px] leading-6 [&_pre]:bg-transparent!"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
