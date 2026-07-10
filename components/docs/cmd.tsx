import { isValidElement, type ReactNode } from "react"

import { CliBlock } from "@/components/docs/cli-block"

type CmdProps = {
  children: ReactNode
}

function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map((child) => extractText(child)).join("")
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractText(node.props.children)
  }

  return ""
}

export function Cmd({ children }: CmdProps) {
  const commands = extractText(children)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  return <CliBlock commands={commands} />
}