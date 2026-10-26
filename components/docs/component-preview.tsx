import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { PreviewTabs } from "@/components/docs/preview-tabs"
import { highlight } from "@/lib/highlight"
import { getItem } from "@/lib/registry"

// Shows the live demo, and the exact file the CLI installs under "Code".
export async function ComponentPreview({ name }: { name: string }) {
  const item = getItem(name)
  // Scoped to registry/ so the build doesn't trace the whole project.
  const file = item.files[0].path.replace(/^registry\//, "")
  const code = await readFile(join(process.cwd(), "registry", file), "utf8")

  return <PreviewTabs name={name} code={code} html={await highlight(code)} />
}
