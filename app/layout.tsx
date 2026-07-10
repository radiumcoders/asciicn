import { GeistMono } from "geist/font/mono"
import { GeistPixelSquare } from "geist/font/pixel"
import { GeistSans } from "geist/font/sans"
import { RootProvider } from "fumadocs-ui/provider/next"
import type { ReactNode } from "react"

import "./globals.css"
import { ThemeHotkey } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        GeistSans.variable,
        GeistMono.variable,
        GeistPixelSquare.variable
      )}
    >
      <body className="flex h-full min-h-svh flex-col bg-background font-sans text-foreground">
        <RootProvider
          theme={{
            enabled: true,
            defaultTheme: "system",
          }}
        >
          <ThemeHotkey />
          <div className="m-1 flex min-h-[calc(100svh-0.5rem)] flex-1 flex-col overflow-hidden bg-background">
            {children}
          </div>
        </RootProvider>
      </body>
    </html>
  )
}