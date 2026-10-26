import registry from "@/registry.json"

export type RegistryItem = {
  name: string
  type: string
  title: string
  description: string
  registryDependencies?: string[]
  dependencies?: string[]
  files: { path: string; type: string }[]
}

export const items: RegistryItem[] = registry.items as RegistryItem[]

export function getItem(name: string) {
  const item = items.find((entry) => entry.name === name)
  if (!item) throw new Error(`Unknown registry item: ${name}`)
  return item
}
