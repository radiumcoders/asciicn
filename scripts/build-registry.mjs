import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const componentsDir = path.join(root, "components", "asciicn")
const registryPath = path.join(root, "registry.json")
const outputDir = path.join(root, "public", "r")

/**
 * Recursively collect component files under components/asciicn.
 * Supports both flat files (button.tsx) and folders (button/button.tsx).
 */
function collectComponentFiles(dir, base = "") {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    return []
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name
    const abs = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...collectComponentFiles(abs, rel))
      continue
    }

    if (!/\.(tsx|ts|jsx|js|css)$/.test(entry.name)) continue
    if (entry.name.startsWith(".")) continue
    if (entry.name === "index.ts" || entry.name === "index.tsx") continue

    files.push({
      abs,
      rel: rel.replace(/\\/g, "/"),
      name: path.basename(entry.name, path.extname(entry.name)),
      ext: path.extname(entry.name),
    })
  }

  return files
}

function titleCase(name) {
  return name
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

/**
 * Group files by component name.
 * - button.tsx → component "button"
 * - button/button.tsx + button/styles.css → component "button"
 */
function groupByComponent(files) {
  const groups = new Map()

  for (const file of files) {
    const segments = file.rel.split("/")
    const key = segments.length > 1 ? segments[0] : file.name

    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key).push(file)
  }

  return groups
}

/**
 * Best-effort parse of shadcn registryDependencies from imports.
 * Matches: from "@/components/ui/button" or from '@/components/ui/button'
 */
function detectRegistryDependencies(filePaths) {
  const deps = new Set()

  for (const filePath of filePaths) {
    if (!/\.(tsx?|jsx?)$/.test(filePath)) continue
    const source = fs.readFileSync(filePath, "utf8")
    const re =
      /from\s+["']@\/components\/ui\/([a-zA-Z0-9_-]+)["']/g
    let match
    while ((match = re.exec(source)) !== null) {
      deps.add(match[1])
    }
  }

  return [...deps].sort()
}

function buildItems() {
  const files = collectComponentFiles(componentsDir)
  const groups = groupByComponent(files)
  const items = []

  for (const [name, groupFiles] of groups) {
    const absPaths = groupFiles.map((f) => f.abs)
    const registryDependencies = detectRegistryDependencies(absPaths)

    items.push({
      name,
      type: "registry:ui",
      title: titleCase(name),
      description: `ASCII-styled ${titleCase(name)} component from asciicn.`,
      ...(registryDependencies.length > 0 ? { registryDependencies } : {}),
      files: groupFiles.map((f) => ({
        path: `components/asciicn/${f.rel}`,
        type: "registry:ui",
        target: `components/asciicn/${f.rel}`,
      })),
    })
  }

  // Stable order for diffs
  items.sort((a, b) => a.name.localeCompare(b.name))
  return items
}

function main() {
  const items = buildItems()

  const registry = {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "asciicn",
    homepage: "https://asciicn.local/docs",
    items,
  }

  fs.writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`)
  console.log(
    `✓ Wrote registry.json (${items.length} item${items.length === 1 ? "" : "s"})`
  )

  fs.mkdirSync(outputDir, { recursive: true })

  if (items.length === 0) {
    // Still emit an empty built index so consumers can list the registry.
    const emptyBuilt = {
      $schema: "https://ui.shadcn.com/schema/registry.json",
      name: "asciicn",
      homepage: "https://asciicn.local/docs",
      items: [],
    }
    fs.writeFileSync(
      path.join(outputDir, "registry.json"),
      `${JSON.stringify(emptyBuilt, null, 2)}\n`
    )
    console.log("✓ No components yet — wrote empty public/r/registry.json")
    return
  }

  execSync("pnpm dlx shadcn@latest build registry.json --output public/r", {
    cwd: root,
    stdio: "inherit",
  })

  console.log("✓ Built registry JSON files → public/r")
}

main()
