import type * as React from "react"

// Wraps `###` headings: each one becomes a numbered stop on a thin rail.
// Headings stay real headings, so they keep anchors and land in the outline.
export function Steps({ children }: { children: React.ReactNode }) {
  return <div className="steps">{children}</div>
}
