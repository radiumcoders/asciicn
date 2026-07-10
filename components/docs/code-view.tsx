import {
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react"

import { getIconForLanguageExtension } from "@/assets/language/icons"
import { CopyButton } from "@/components/docs/copy-button"
import { docsShikiThemeClass } from "@/lib/docs-shiki"
import { cn } from "@/lib/utils"

type DocsCodeViewProps = ComponentProps<"pre"> & {
  icon?: ReactNode
  title?: string
}

function extractTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map((child) => extractTextContent(child)).join("")
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractTextContent(node.props.children)
  }

  return ""
}

function resolveLanguage(
  title?: string,
  ...classNames: Array<string | undefined>
): string {
  if (title) return title

  for (const className of classNames) {
    const match = className?.match(/language-([\w+-]+)/)
    if (match) return match[1]
  }

  return "txt"
}

export function DocsCodeView(props: DocsCodeViewProps) {
  const { className, children, icon, title, ...rest } = props
  const child = children as ReactElement<{
    className?: string
    children?: ReactNode
  }>

  if (isValidElement(child)) {
    const language = resolveLanguage(
      title,
      className,
      child.props.className
    )
    const code = extractTextContent(child.props.children).trimEnd()

    if (code) {
      return (
        <div
          data-code-block-wrapper=""
          className="docs-code-view my-4 overflow-hidden border border-border bg-background"
        >
          <div className="flex h-10 items-center justify-between gap-2 px-3">
            <div
              className="flex h-8 min-w-0 items-center gap-1.5 text-xs leading-none text-muted-foreground [&_svg]:size-3.5"
              data-language={language}
            >
              {icon ? (
                typeof icon === "string" ? (
                  <span
                    className="inline-flex size-3.5 shrink-0 items-center justify-center [&_svg]:size-3.5"
                    dangerouslySetInnerHTML={{ __html: icon }}
                  />
                ) : (
                  <span className="inline-flex size-3.5 shrink-0 items-center justify-center [&_svg]:size-3.5">
                    {icon}
                  </span>
                )
              ) : (
                <span className="inline-flex size-3.5 shrink-0 items-center justify-center font-mono text-[10px] leading-none">
                  {getIconForLanguageExtension(language)}
                </span>
              )}
              <span className="font-mono leading-none">{language}</span>
            </div>
            <CopyButton className="shrink-0 self-center" code={code} />
          </div>
          <div className="border-t border-border px-3">
            <pre
              className={cn(
                "docs-scroll shiki shiki-themes overflow-x-auto bg-transparent p-2 text-sm not-prose",
                docsShikiThemeClass,
                className
              )}
              {...rest}
            >
              {children}
            </pre>
          </div>
        </div>
      )
    }
  }

  return (
    <pre
      className={cn(
        "docs-scroll overflow-x-auto bg-transparent p-0 text-sm",
        className
      )}
      {...rest}
    >
      {children}
    </pre>
  )
}

export function DocsInlineCode({
  className,
  children,
  ...props
}: ComponentProps<"code">) {
  if (typeof children === "string") {
    return (
      <code
        className={cn(
          "bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground",
          className
        )}
        {...props}
      >
        {children}
      </code>
    )
  }

  return (
    <code className={cn("font-mono text-sm", className)} {...props}>
      {children}
    </code>
  )
}