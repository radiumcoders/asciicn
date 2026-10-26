import { createGenerator } from "fumadocs-typescript"

import { getItem } from "@/lib/registry"

const generator = createGenerator()

// Read straight from the component's TypeScript, so the table can't drift.
export async function PropsTable({ name, type }: { name: string; type: string }) {
  const [doc] = await generator.generateTypeTable({
    path: getItem(name).files[0].path,
    name: type,
  })
  if (!doc) return null

  return (
    <div className="not-prose my-5 overflow-x-auto rounded-xl bg-plate">
      <table className="w-full text-left text-[13px]">
        <thead className="text-dim">
          <tr>
            <th className="px-4 pt-3 pb-2 font-medium">Prop</th>
            <th className="px-4 pt-3 pb-2 font-medium">Type</th>
            <th className="px-4 pt-3 pb-2 font-medium">Default</th>
          </tr>
        </thead>
        <tbody>
          {doc.entries.map((entry) => {
            const fallback = entry.tags.find((tag) => tag.name === "defaultValue")?.text
            return (
              <tr key={entry.name} className="align-top [&+&]:shadow-[inset_0_1px_0_var(--border)]">
                <td className="px-4 py-3">
                  <code className="font-mono font-medium text-ink">
                    {entry.name}
                    {entry.required ? "" : "?"}
                  </code>
                  {entry.description ? (
                    <p className="mt-1 max-w-xs leading-5 text-dim">{entry.description}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <code className="font-mono break-words text-ink">{displayType(entry)}</code>
                </td>
                <td className="px-4 py-3">
                  <code className="font-mono whitespace-nowrap text-dim">{fallback ?? "—"}</code>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// Spell out short unions like `"dots" | "line"`; the simplifier would print "union".
function displayType(entry: { type: string; simplifiedType: string; required: boolean }) {
  const full = entry.required ? entry.type : entry.type.replace(/ \| undefined$/, "")
  return full.length <= 64 ? full : entry.simplifiedType
}
