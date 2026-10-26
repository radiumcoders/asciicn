"use client"

import { AnchorProvider, type TOCItemType } from "fumadocs-core/toc"
import { useRouter } from "next/navigation"
import * as React from "react"

export type PageLink = { url: string; title: string }

type PageContext = {
  title: string
  toc: TOCItemType[]
  prev: PageLink | null
  next: PageLink | null
}

const Context = React.createContext<PageContext>({ title: "", toc: [], prev: null, next: null })

export const usePage = () => React.useContext(Context)

export const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))

// Everything the page chrome needs to know about the current page, plus [ and ] to move between pages.
export function PageProvider({ children, ...page }: PageContext & { children: React.ReactNode }) {
  const router = useRouter()
  const { prev, next } = page

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTyping(event.target)) return
      const to = event.key === "[" ? prev : event.key === "]" ? next : null
      if (to) router.push(to.url)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [prev, next, router])

  return (
    <Context.Provider value={page}>
      <AnchorProvider toc={page.toc} single>
        {children}
      </AnchorProvider>
    </Context.Provider>
  )
}
