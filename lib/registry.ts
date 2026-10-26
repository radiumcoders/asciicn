import registry from "@/registry.json"

export type RegistryItem = (typeof registry.items)[number]

export const items: RegistryItem[] = registry.items

export function getItem(name: string) {
  const item = items.find((entry) => entry.name === name)
  if (!item) throw new Error(`Unknown registry item: ${name}`)
  return item
}
