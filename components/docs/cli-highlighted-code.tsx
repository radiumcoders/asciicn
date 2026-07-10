export function CliHighlightedCode({ code }: { code: string }) {
  return (
    <div className="border-t border-border px-3">
      <pre className="docs-scroll overflow-x-auto bg-transparent p-2 text-[13px] not-prose">
        <code className="font-mono text-foreground">{code}</code>
      </pre>
    </div>
  )
}