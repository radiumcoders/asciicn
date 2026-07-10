"use client"

import {
  BunIcon,
  NpmIcon,
  PnpmIcon,
  YarnIcon,
} from "@/assets/icons/package-managers"
import { CliHighlightedCode } from "@/components/docs/cli-highlighted-code"
import { CopyButton } from "@/components/docs/copy-button"
import { useConfig, type PackageManager } from "@/hooks/use-config"
import { cn } from "@/lib/utils"

const packageCommands: Record<PackageManager, string> = {
  npm: "npx shadcn@latest add",
  yarn: "yarn shadcn@latest add",
  bun: "bunx --bun shadcn@latest add",
  pnpm: "pnpm dlx shadcn@latest add",
}

const managers: PackageManager[] = ["pnpm", "npm", "yarn", "bun"]

const managerMeta: Record<
  PackageManager,
  {
    icon: typeof NpmIcon
    activeTextClassName: string
  }
> = {
  npm: {
    icon: NpmIcon,
    activeTextClassName: "text-[#C3292F]",
  },
  yarn: {
    icon: YarnIcon,
    activeTextClassName: "text-[#3592BD]",
  },
  bun: {
    icon: BunIcon,
    activeTextClassName: "text-foreground",
  },
  pnpm: {
    icon: PnpmIcon,
    activeTextClassName: "text-[#FAAF18]",
  },
}

export function CliBlock({ commands }: { commands: string[] }) {
  const { packageManager, setConfig } = useConfig()
  const value =
    `${packageCommands[packageManager]} ${commands.join(" ")}`.trim()

  return (
    <div className="group my-4 overflow-hidden border border-border bg-transparent">
      <div className="flex h-10 items-center justify-between gap-2 px-3">
        <div className="docs-scroll flex min-h-8 min-w-0 items-center gap-0.5 overflow-x-auto">
          {managers.map((manager) => {
            const { icon: Icon, activeTextClassName } = managerMeta[manager]

            return (
              <button
                key={manager}
                type="button"
                onClick={() => setConfig({ packageManager: manager })}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 px-2 text-xs font-semibold leading-none text-muted-foreground transition hover:text-foreground",
                  manager === packageManager && activeTextClassName
                )}
              >
                <span className="inline-flex size-3.5 shrink-0 items-center justify-center">
                  <Icon className="size-3.5" />
                </span>
                <span className="leading-none">{manager}</span>
              </button>
            )
          })}
        </div>
        <CopyButton className="shrink-0 self-center" code={value} />
      </div>
      <CliHighlightedCode code={value} />
    </div>
  )
}