import * as React from "react"

import { TabsView } from "@/components/docs/tabs-view"

type TabProps = { value: string; children: React.ReactNode }

// <Tab> children are sorted into panels on the server; the view only switches.
export function Tabs({
  items,
  groupId,
  defaultValue,
  children,
}: {
  items: string[]
  groupId?: string
  defaultValue?: string
  children: React.ReactNode
}) {
  const panels: Record<string, React.ReactNode> = {}
  for (const child of React.Children.toArray(children)) {
    if (React.isValidElement<TabProps>(child) && child.type === Tab) panels[child.props.value] = child.props.children
  }
  return <TabsView items={items} groupId={groupId} defaultValue={defaultValue} panels={panels} />
}

export function Tab({ children }: TabProps) {
  return <>{children}</>
}
