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

export function PreviewTabs({ name, component, code, html }: { name: string; component: string; code: string; html: string }) {
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("Preview")
  const [run, setRun] = React.useState(0)
  const mod = useDemo(name)
  const [values, setValues] = React.useState<Record<string, unknown>>({})

  React.useEffect(() => {
    if (mod) setValues(defaultValues(mod.controls))
  }, [mod])

  const Demo = mod?.default

  const controls = mod?.controls && Object.keys(mod.controls).length ? mod.controls : null

  return (
    <div className="not-prose my-6">
      <div className="border border-line bg-plate">
        <div className="flex items-center justify-between border-b border-line p-1">
          <Segmented options={TABS} value={tab} onChange={setTab} />
          <AnimatePresence mode="popLayout" initial={false}>
            {tab === "Preview" ? (
              <motion.div
                key="replay"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <ReplayButton onReplay={() => setRun((n) => n + 1)} />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <CopyButton value={code} className="size-7" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative h-[24rem] overflow-hidden bg-stage sm:h-[26rem]">
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
                <div className="@container relative flex size-full items-center justify-center">
                  {Demo ? <Demo key={run} {...values} /> : <StageLoader />}
                </div>
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
      {controls ? (
        <Playground
          controls={controls}
          values={values}
          component={component}
          onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
          onReset={() => setValues(defaultValues(controls))}
        />
      ) : null}
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
      className="flex h-7 items-center gap-1.5 px-2.5 text-[13px] font-medium text-dim transition-colors hover:bg-wash hover:text-ink"
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

// Live props for the preview, in their own panel under it. The snippet is the code you'd write.
function Playground({
  controls,
  values,
  component,
  onChange,
  onReset,
}: {
  controls: NonNullable<DemoModule["controls"]>
  values: Record<string, unknown>
  component: string
  onChange: (key: string, value: unknown) => void
  onReset: () => void
}) {
  const changed = Object.entries(values).filter(([key, value]) => controls[key] && value !== controls[key].default)
  const snippet = `<${component}${changed
    .map(([key, value]) => ` ${key}=${typeof value === "string" ? JSON.stringify(value) : `{${JSON.stringify(value)}}`}`)
    .join("")} />`

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={spring} className="mt-3 border border-line">
      <div className="flex h-10 items-center justify-between border-b border-line pr-1.5 pl-4">
        <span className="text-[13px] font-medium">Playground</span>
        <AnimatePresence initial={false}>
          {changed.length ? (
            <motion.button
              type="button"
              onClick={onReset}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 6 }}
              className="h-7 px-2.5 font-mono text-[12px] text-dim transition-colors hover:bg-wash hover:text-ink"
            >
              reset
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        {Object.entries(controls).map(([key, control]) => (
          <ControlRow key={key} name={key} control={control} value={values[key] ?? control.default} onChange={(value) => onChange(key, value)} />
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-line py-1 pr-1 pl-4">
        <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink">{snippet}</code>
        <CopyButton value={snippet} className="size-7 shrink-0" />
      </div>
    </motion.div>
  )
}
