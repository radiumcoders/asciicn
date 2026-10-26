import * as React from "react"

import { FilesTree, type Node } from "@/components/docs/files-tree"

type FileProps = { name: string; note?: string }
type FolderProps = FileProps & { defaultOpen?: boolean; children?: React.ReactNode }

// <Files>, <Folder> and <File> are read on the server into plain data, so the
// tree knows which row closes each branch before it draws a single glyph.
function toNodes(children: React.ReactNode): Node[] {
  return React.Children.toArray(children).flatMap((child): Node[] => {
    if (!React.isValidElement(child)) return []
    if (child.type === Folder) {
      const props = child.props as FolderProps
      return [{ kind: "folder", name: props.name, note: props.note, open: props.defaultOpen ?? true, children: toNodes(props.children) }]
    }
    if (child.type === File) {
      const props = child.props as FileProps
      return [{ kind: "file", name: props.name, note: props.note }]
    }
    return []
  })
}

export function Files({ children }: { children: React.ReactNode }) {
  return <FilesTree nodes={toNodes(children)} />
}

export function Folder(_: FolderProps) {
  return null
}

export function File(_: FileProps) {
  return null
}
