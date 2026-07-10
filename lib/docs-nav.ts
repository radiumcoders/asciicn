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
  let rootPages: DocsNavPage[] = []

  const flushRootPages = () => {
    if (rootPages.length === 0) return
    groups.push({ title: "Documentation", pages: rootPages })
    rootPages = []
  }

  for (const node of tree.children) {
    if (node.type === "page" && !node.external) {
      rootPages.push({ title: toTitle(node.name), url: node.url })
      continue
    }

    flushRootPages()

    if (node.type === "folder") {
      const pages = folderPages(node)
      if (pages.length > 0) {
        groups.push({ title: toTitle(node.name), pages })
      }
    }
  }

  flushRootPages()

  return groups
}

export function isNavLinkActive(pathname: string, url: string) {
  if (url === "/") return pathname === "/"
  if (pathname === url) return true
  // /docs is the docs index; don't match sibling /docs/* routes.
  if (url === "/docs") return false
  return pathname.startsWith(`${url}/`)
}

export function getDefaultDocsPage() {
  const pages = source
    .getPages()
    .sort((a, b) => a.url.localeCompare(b.url))

  return pages[0] ?? null
}