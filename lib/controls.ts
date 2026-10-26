import type { ComponentType } from "react"

// Live knobs for a demo. Each demo exports `controls` and receives the values as props.
export type Control =
  | { type: "number"; default: number; min: number; max: number; step?: number }
  | { type: "boolean"; default: boolean }
  | { type: "select"; default: string; options: readonly string[] }
  | { type: "text"; default: string }

export type Controls = Record<string, Control>

export function defineControls<const T extends Controls>(controls: T) {
  return controls
}

export type ControlValues<T extends Controls> = {
  [K in keyof T]: T[K] extends { type: "select"; options: readonly (infer O)[] }
    ? O
    : T[K] extends { type: "number" }
      ? number
      : T[K] extends { type: "boolean" }
        ? boolean
        : string
}

export type DemoModule = {
  default: ComponentType<Record<string, unknown>>
  controls?: Controls
}

export function defaultValues(controls: Controls = {}) {
  return Object.fromEntries(Object.entries(controls).map(([key, control]) => [key, control.default]))
}
