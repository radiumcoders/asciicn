import { codeToHtml } from "shiki"

import { CodeFrame } from "@/components/docs/code-block"
import { site } from "@/lib/site"

// A titled code block whose `{{site}}` placeholders become this deployment's URL,
// so the snippets people copy always point at the registry they're reading.
// `highlight` takes 1-based line numbers to mark.
export async function SiteCode({
  code,
  title,
  lang = "tsx",
  highlight = [],
}: {
  code: string
  title: string
  lang?: string
  highlight?: number[]
}) {
  const value = code.replaceAll("{{site}}", site.url).trim()
  const html = await codeToHtml(value, {
    lang,
    themes: { light: "github-light", dark: "vesper" },
    defaultColor: false,
    transformers: [
      {
        pre(node) {
          this.addClassToHast(node, "code-block")
          if (highlight.length) this.addClassToHast(node, "has-highlighted")
        },
        line(node, line) {
          if (highlight.includes(line)) this.addClassToHast(node, "highlighted")
        },
      },
    ],
  })

  return <CodeFrame title={title} copy={value} html={html} />
}
