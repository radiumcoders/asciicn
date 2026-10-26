import registry from "@/registry.json"

export type RegistryItem = {
  name: string
  type: string
  title: string
  description: string
  registryDependencies?: string[]
  dependencies?: string[]
  categories?: string[]
  files: { path: string; type: string }[]
}

// An item's first category is its docs section.
export const docsUrl = (item: Pick<RegistryItem, "name" | "categories">) => `/docs/${item.categories?.[0] ?? "components"}/${item.name}`

// Docs sections that hold registry items, so their pages get live previews.
export const isItemPage = (url: string) => /^\/docs\/(components|backgrounds)\/[^/]+$/.test(url)

export const items: RegistryItem[] = registry.items as RegistryItem[]

export function getItem(name: string) {
  const item = items.find((entry) => entry.name === name)
  if (!item) throw new Error(`Unknown registry item: ${name}`)
  return item
}
