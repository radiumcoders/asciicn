import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import type { Metadata, Viewport } from "next"
import { ThemeProvider } from "next-themes"
import type { ReactNode } from "react"

import { SearchProvider, type SearchPage } from "@/components/site/search"
import { registryUrl, site } from "@/lib/site"
import { orderedPages } from "@/lib/pages"
import { cn } from "@/lib/utils"

import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: text-mode components`, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, type: "website" },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#efefee" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0c" },
  ],
}

export default function RootLayout({ children }: { children: ReactNode }) {
  const pages: SearchPage[] = orderedPages().map(({ page, group }) => {
    const component = page.url.startsWith("/docs/components/") ? page.url.split("/").pop() : undefined
    return {
      title: page.data.title,
      description: page.data.description,
      url: page.url,
      group,
      headings: page.data.structuredData.headings.map((heading) => ({ title: heading.content, url: `#${heading.id}` })),
      install: component ? registryUrl(component) : undefined,
    }
  })

  return (
    <html lang="en" suppressHydrationWarning className={cn(GeistSans.variable, GeistMono.variable)}>
      <body className="font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SearchProvider pages={pages}>{children}</SearchProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
