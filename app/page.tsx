import Link from "next/link"

import { ComponentGrid } from "@/components/site/component-grid"
import { GithubLink } from "@/components/site/github-link"
import { HeroField, HeroTitle } from "@/components/site/hero-field"
import { Logo } from "@/components/site/logo"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { items } from "@/lib/registry"
import { site } from "@/lib/site"

export default function Home() {
  return (
    <div className="p-2">
      <section className="relative flex min-h-[calc(100svh-1rem)] flex-col overflow-hidden bg-sheet">
        <HeroField />
        <nav className="relative z-10 flex items-center justify-between px-5 py-4 sm:px-8">
          <Logo />
          <div className="flex items-center gap-1">
            <Link href="/docs" className="h-8 px-3 text-[13.5px] leading-8 text-dim transition-colors hover:bg-wash hover:text-ink">
              Docs
            </Link>
            <GithubLink />
            <ThemeToggle />
          </div>
        </nav>
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
          <HeroTitle />
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-dim">{site.description}</p>
          <div className="mt-8 flex items-center gap-2">
            <Link href="/docs" className="h-10 bg-ink px-5 text-[14px] leading-10 font-medium text-sheet transition-opacity hover:opacity-85">
              Get started
            </Link>
            <Link href="#components" className="h-10 bg-plate px-5 text-[14px] leading-10 font-medium transition-colors hover:bg-wash">
              Components
            </Link>
          </div>
        </div>
      </section>

      <section id="components" className="mx-auto max-w-6xl scroll-mt-4 px-3 pt-20 pb-10 sm:px-6">
        <div className="mb-6 flex items-baseline justify-between px-1">
          <h2 className="text-xl font-semibold tracking-tight">Components</h2>
          <span className="font-mono text-[12px] text-dim">{items.length} items</span>
        </div>
        <ComponentGrid items={items.map(({ name, title, description }) => ({ name, title, description }))} />
      </section>

      <footer className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8 font-mono text-[12px] text-dim sm:px-7">
        <span>asciicn</span>
        <a href={site.github} className="hover:text-ink">
          github
        </a>
      </footer>
    </div>
  )
}
