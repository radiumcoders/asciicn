import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { createGenerator } from "fumadocs-typescript"

import { getItem, items } from "@/lib/registry"
import { registryUrl, site } from "@/lib/site"
import { orderedPages } from "@/lib/pages"
import type { source } from "@/lib/source"

type Page = NonNullable<ReturnType<typeof source.getPage>>

const generator = createGenerator()

export const markdownUrl = (url: string) => `${url}.md`

// One docs page as plain Markdown: our MDX components expanded into the code and tables they render.
export async function pageMarkdown(page: Page) {
  const raw = await page.data.getText("raw")
  const body = raw.replace(/^---\n[\s\S]*?\n---\n/, "")
  const head = [`# ${page.data.title}`, page.data.description ? `> ${page.data.description}` : null]
    .filter(Boolean)
    .join("\n\n")
  return `${head}\n\n${(await expand(body)).trim()}\n`
}

// Split on fenced code so tags inside examples stay untouched.
async function expand(mdx: string) {
  const parts = mdx.split(/(^```[\s\S]*?^```)/m)
  const out = await Promise.all(parts.map((part) => (part.startsWith("```") ? part : expandProse(part))))
  return out.join("").replace(/\n{3,}/g, "\n\n")
}

const SELF_CLOSING = /<([A-Z][\w.]*)((?:\s+[\w-]+(?:=(?:"[^"]*"|'[^']*'|\{[^}]*\}))?)*)\s*\/>/g
const PAIRED = /<([A-Z][\w.]*)((?:\s+[\w-]+(?:=(?:"[^"]*"|'[^']*'|\{[^}]*\}))?)*)\s*>([\s\S]*?)<\/\1>/g

async function expandProse(text: string): Promise<string> {
  // Self-closing components first; they may be async (source files, prop tables).
  const swaps: Promise<string>[] = []
  text = text.replace(SELF_CLOSING, (_, name: string, attrs: string) => {
    swaps.push(selfClosing(name, parseAttrs(attrs)))
    return `\u0000${swaps.length - 1}\u0000`
  })

  // Paired components, innermost first, until none are left.
  let previous
  do {
    previous = text
    text = text.replace(PAIRED, (_, name: string, attrs: string, inner: string) => paired(name, parseAttrs(attrs), inner))
  } while (text !== previous)

  // Point site links at the Markdown twin, absolute, so they work outside the browser.
  text = text.replace(/\]\((\/docs\/[^)#\s]+)(#[^)\s]*)?\)/g, (_, path: string, hash = "") => `](${site.url}${markdownUrl(path)}${hash})`)

  const resolved = await Promise.all(swaps)
  return text.replace(/\u0000(\d+)\u0000/g, (_, i: string) => resolved[Number(i)])
}

function parseAttrs(attrs: string) {
  const out: Record<string, string> = {}
  for (const [, key, double, single, braced] of attrs.matchAll(/([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\}))?/g)) {
    out[key] = double ?? single ?? braced?.replace(/^["'`]|["'`]$/g, "") ?? ""
  }
  return out
}

async function selfClosing(name: string, attrs: Record<string, string>) {
  switch (name) {
    case "ComponentPreview":
      return componentSource(attrs.name)
    case "Install":
      return fence("bash", `npx shadcn@latest add ${registryUrl(attrs.name)}`)
    case "PropsTable":
      return propsTable(attrs.name, attrs.type)
    case "ComponentIndex":
      return items
        .map((item) => `- [${item.title}](${site.url}${markdownUrl(`/docs/components/${item.name}`)}): ${item.description}`)
        .join("\n")
    case "RegistryConfig":
      return fence("json", JSON.stringify({ registries: { "@asciicn": `${site.url}/r/{name}.json` } }, null, 2))
    default:
      // Anything else is visual only; keep a label if it has one.
      return attrs.title ?? attrs.name ?? ""
  }
}

function paired(name: string, attrs: Record<string, string>, inner: string) {
  const text = inner.replace(/^\n+|\n+$/g, "")
  switch (name) {
    case "Callout": {
      const lines = (attrs.title ? `**${attrs.title}** ` : "") + text.trim()
      return lines
        .split("\n")
        .map((line) => `> ${line}`.trimEnd())
        .join("\n")
    }
    case "Kbd":
      return `\`${text}\``
    default: {
      // Steps, tabs, file trees: keep the content, promote a title to bold.
      const label = attrs.title ?? attrs.value ?? attrs.name
      return label ? `**${label}**\n\n${text}` : text
    }
  }
}

async function componentSource(name: string) {
  const item = getItem(name)
  const files = await Promise.all(
    item.files.map(async (file) => {
      const code = await readFile(join(process.cwd(), "registry", file.path.replace(/^registry\//, "")), "utf8")
      return fence(`tsx title="${file.path.replace(/^registry\/[^/]+\//, "components/ui/")}"`, code.trimEnd())
    })
  )
  return files.join("\n\n")
}

async function propsTable(name: string, type: string) {
  const [doc] = await generator.generateTypeTable({ path: getItem(name).files[0].path, name: type })
  if (!doc) return ""
  const cell = (value: string) => value.replace(/\|/g, "\\|").replace(/\n/g, " ")
  const rows = doc.entries.map((entry) => {
    const fallback = entry.tags.find((tag) => tag.name === "defaultValue")?.text
    const full = entry.required ? entry.type : entry.type.replace(/ \| undefined$/, "")
    const typeText = full.length <= 64 ? full : entry.simplifiedType
    return `| \`${entry.name}${entry.required ? "" : "?"}\` | \`${cell(typeText)}\` | ${fallback ? `\`${cell(fallback)}\`` : "-"} | ${cell(entry.description ?? "")} |`
  })
  return ["| Prop | Type | Default | Description |", "| --- | --- | --- | --- |", ...rows].join("\n")
}

const fence = (lang: string, code: string) => `\`\`\`${lang}\n${code}\n\`\`\``

// llms.txt: https://llmstxt.org
export function llmsIndex() {
  const line = (page: Page) =>
    `- [${page.data.title}](${site.url}${markdownUrl(page.url)})${page.data.description ? `: ${page.data.description}` : ""}`
  // One section per sidebar group.
  const groups = new Map<string, Page[]>()
  for (const { page, group } of orderedPages()) groups.set(group, [...(groups.get(group) ?? []), page])

  return [
    `# ${site.name}`,
    `> ${site.description}`,
    "Each component is a single React file built on `cn`, installed with `npx shadcn@latest add <url>`. Every page below is available as Markdown; component pages include the full source.",
    ...[...groups].map(([group, pages]) => `## ${group}\n\n${pages.map(line).join("\n")}`),
    `## Optional\n\n- [Full docs in one file](${site.url}/llms-full.txt)\n- [Registry index](${site.url}/r/registry.json)\n- [Source on GitHub](${site.github})`,
  ].join("\n\n") + "\n"
}

export async function llmsFull() {
  const pages = await Promise.all(orderedPages().map(({ page }) => pageMarkdown(page)))
  return pages.join("\n---\n\n")
}
