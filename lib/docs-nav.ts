import { flattenTree } from "fumadocs-core/page-tree"
import type * as PageTree from "fumadocs-core/page-tree"
import type { ReactNode } from "react"

import { source } from "@/lib/source"

export type DocsNavPage = {
  title: string
  url: string
}

export type DocsNavGroup = {
  title: string
  pages: DocsNavPage[]
}

function toTitle(value: ReactNode) {
  return typeof value === "string" ? value : String(value ?? "Untitled")
}

function folderPages(folder: PageTree.Folder): DocsNavPage[] {
  const pages: DocsNavPage[] = []

  if (folder.index && !folder.index.external) {
    pages.push({
      title: toTitle(folder.index.name),
      url: folder.index.url,
    })
  }

  for (const item of flattenTree(folder.children)) {
    if (item.external) continue
    pages.push({
      title: toTitle(item.name),
      url: item.url,
    })
  }

  return pages
}

export function getDocsNavGroups(): DocsNavGroup[] {
  const tree = source.getPageTree()
  const groups: DocsNavGroup[] = []

  for (const node of tree.children) {
    if (node.type === "folder") {
      const pages = folderPages(node)
      if (pages.length > 0) {
        groups.push({ title: toTitle(node.name), pages })
      }
      continue
    }

    if (node.type === "page" && !node.external) {
      groups.push({
        title: "Guide",
        pages: [{ title: toTitle(node.name), url: node.url }],
      })
    }
  }

  return groups
}

export function getDefaultDocsPage() {
  const pages = source
    .getPages()
    .sort((a, b) => a.url.localeCompare(b.url))

  return pages[0] ?? null
}