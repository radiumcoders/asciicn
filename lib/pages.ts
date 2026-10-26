import { source } from "@/lib/source"

type Node = ReturnType<typeof source.getPageTree>["children"][number]

// Docs pages in sidebar order, each tagged with the sidebar group it sits under.
export function orderedPages() {
  const pages = new Map(source.getPages().map((page) => [page.url, page]))
  const out: { page: NonNullable<ReturnType<typeof source.getPage>>; group: string }[] = []
  const walk = (nodes: Node[], group: string) => {
    for (const node of nodes) {
      if (node.type === "separator") group = String(node.name ?? "")
      else if (node.type === "folder") walk(node.children, String(node.name ?? group))
      else {
        const page = pages.get(node.url)
        if (page) out.push({ page, group })
      }
    }
  }
  walk(source.getPageTree().children, "Docs")
  return out
}
