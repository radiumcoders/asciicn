"use client"

import { AnimatePresence, motion } from "motion/react"
import * as React from "react"

import { ControlRow } from "@/components/docs/controls"
import { CopyButton } from "@/components/docs/copy-button"
import { Segmented } from "@/components/docs/segmented"
import { defaultValues, type DemoModule } from "@/lib/controls"
import { cn } from "@/lib/utils"
import { useDemo } from "@/components/docs/use-demo"

const TABS = ["Preview", "Code"] as const
const spring = { type: "spring", duration: 0.45, bounce: 0.18 } as const

export function PreviewTabs({
  name,
  component,
  code,
  html,
}: {
  name: string
  component: string
  code: string
  html: string
}) {
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("Preview")
  const [run, setRun] = React.useState(0)
  const mod = useDemo(name)
  const [values, setValues] = React.useState<Record<string, unknown>>({})
  const [tweaking, setTweaking] = React.useState(false)

  React.useEffect(() => {
    if (mod) setValues(defaultValues(mod.controls))
  }, [mod])

  const Demo = mod?.default

  return (
    <div className="not-prose my-6 rounded-2xl bg-plate p-1">
      <div className="flex items-center justify-between p-0.5">
        <Segmented options={TABS} value={tab} onChange={setTab} />
        <AnimatePresence mode="popLayout" initial={false}>
          {tab === "Preview" ? (
            <motion.div key="replay" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <ReplayButton onReplay={() => setRun((n) => n + 1)} />
            </motion.div>
          ) : (
            <motion.div key="copy" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <CopyButton value={code} className="size-7" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="relative mt-1 h-[24rem] overflow-hidden rounded-xl bg-stage sm:h-[26rem]">
        <AnimatePresence initial={false}>
          {tab === "Preview" ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              {/* The demo makes room for the open panel on wider screens. */}
              <div
                className={cn(
                  "absolute inset-y-0 left-0 transition-[right] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  tweaking ? "right-0 sm:right-[17rem]" : "right-0"
                )}
              >
                <div className="@container relative flex size-full items-center justify-center">
                  {Demo ? <Demo key={run} {...values} /> : <StageLoader />}
                </div>
              </div>
              {mod?.controls && Object.keys(mod.controls).length ? (
                <Tweaks
                  open={tweaking}
                  onOpenChange={setTweaking}
                  controls={mod.controls}
                  values={values}
                  component={component}
                  onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
                  onReset={() => setValues(defaultValues(mod.controls))}
                />
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0, filter: "blur(6px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.25 }}
              className="code-view absolute inset-0 overflow-auto py-4 font-mono text-[13px] leading-6"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function ReplayButton({ onReplay }: { onReplay: () => void }) {
  const [turns, setTurns] = React.useState(0)

  return (
    <button
      type="button"
      onClick={() => {
        setTurns((n) => n + 1)
        onReplay()
      }}
      className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium text-dim transition-colors hover:bg-wash hover:text-ink"
    >
      <motion.svg
        animate={{ rotate: turns * -360 }}
        transition={{ type: "spring", duration: 0.7, bounce: 0.2 }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-3.5"
      >
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </motion.svg>
      Replay
    </button>
  )
}

function StageLoader() {
  return <span className="animate-pulse font-mono text-[12px] text-dim">loading…</span>
}

// A pill in the corner of the stage that morphs into a panel of live props.
function Tweaks({
  open,
  onOpenChange: setOpen,
  controls,
  values,
  component,
  onChange,
  onReset,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  controls: NonNullable<DemoModule["controls"]>
  values: Record<string, unknown>
  component: string
  onChange: (key: string, value: unknown) => void
  onReset: () => void
}) {
  const id = React.useId()
  const changed = Object.entries(values).filter(([key, value]) => controls[key] && value !== controls[key].default)
  const snippet = `<${component}${changed
    .map(([key, value]) => ` ${key}=${typeof value === "string" ? JSON.stringify(value) : `{${JSON.stringify(value)}}`}`)
    .join("")} />`

  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <div className="pointer-events-none absolute inset-0 flex items-end justify-end p-2.5">
      <AnimatePresence initial={false} mode="popLayout">
        {open ? (
          <motion.div
            key="panel"
            layoutId={id}
            transition={spring}
            style={{ borderRadius: 16 }}
            className="pointer-events-auto flex max-h-full w-64 flex-col overflow-hidden bg-sheet shadow-[0_16px_40px_-12px_rgb(0_0_0/0.25),0_0_0_1px_rgb(0_0_0/0.04)] dark:bg-plate dark:shadow-[0_16px_40px_-12px_rgb(0_0_0/0.7),0_0_0_1px_rgb(255_255_255/0.05)]"
          >
            <motion.div
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)", transition: { delay: 0.08, duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.05 } }}
              className="flex min-h-0 flex-col"
            >
              <div className="flex items-center justify-between py-2 pr-2 pl-3.5">
                <span className="text-[13px] font-medium">Tweak</span>
                <div className="flex items-center gap-0.5">
                  <AnimatePresence initial={false}>
                    {changed.length ? (
                      <motion.button
                        type="button"
                        onClick={onReset}
                        initial={{ opacity: 0, x: 6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 6 }}
                        className="h-7 rounded-md px-2 text-[12px] text-dim hover:bg-wash hover:text-ink"
                      >
                        Reset
                      </motion.button>
                    ) : null}
                  </AnimatePresence>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => setOpen(false)}
                    className="inline-flex size-7 items-center justify-center rounded-md text-dim hover:bg-wash hover:text-ink"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-3.5">
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex min-h-0 flex-col gap-1.5 overflow-y-auto px-2 pb-2">
                {Object.entries(controls).map(([key, control]) => (
                  <ControlRow key={key} name={key} control={control} value={values[key]} onChange={(value) => onChange(key, value)} />
                ))}
              </div>
              <div className="flex items-center gap-1 bg-wash/50 py-1 pr-1 pl-3">
                <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-dim">{snippet}</code>
                <CopyButton value={snippet} className="size-7 shrink-0" />
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.button
            key="pill"
            layoutId={id}
            type="button"
            onClick={() => setOpen(true)}
            transition={spring}
            style={{ borderRadius: 999 }}
            whileTap={{ scale: 0.96 }}
            className="pointer-events-auto flex h-8 items-center gap-1.5 bg-sheet px-3 text-[12.5px] font-medium text-dim shadow-[0_4px_14px_-4px_rgb(0_0_0/0.2),0_0_0_1px_rgb(0_0_0/0.04)] transition-colors hover:text-ink dark:bg-plate dark:shadow-[0_4px_14px_-4px_rgb(0_0_0/0.6),0_0_0_1px_rgb(255_255_255/0.05)]"
          >
            <motion.svg layout="position" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-3.5">
              <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
              <circle cx="16" cy="7" r="2" />
              <circle cx="10" cy="17" r="2" />
            </motion.svg>
            <motion.span layout="position">Tweak</motion.span>
            {changed.length ? (
              <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-ink font-mono text-[10px] text-sheet">{changed.length}</span>
            ) : null}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
