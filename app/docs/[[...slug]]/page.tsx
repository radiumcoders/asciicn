import { execFileSync } from "node:child_process"
import { join } from "node:path"

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { getMDXComponents } from "@/components/docs/mdx"
import { PageActions } from "@/components/docs/page-actions"
import { PageTitle } from "@/components/docs/page-title"
import { PageProvider, type PageLink } from "@/components/site/page-provider"
import { Toc } from "@/components/site/toc"
import { site } from "@/lib/site"
import { source } from "@/lib/source"

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await props.params
  const page = source.getPage(slug)
  if (!page) notFound()

  const MDX = page.data.body
  const [prev, next] = neighboursOf(page.url)
  const editUrl = `${site.github}/blob/master/content/docs/${page.path}`
  const updated = lastUpdated(join("content/docs", page.path))

  return (
    <PageProvider title={page.data.title} toc={page.data.toc} prev={prev} next={next}>
      <div className="mx-auto flex max-w-[76rem] gap-12 px-5 pt-8 pb-24 md:px-10 md:pt-12">
        <article className="min-w-0 flex-1">
          <header className="mb-10">
            <div className="flex items-start justify-between gap-4">
              <PageTitle title={page.data.title} />
              <PageActions markdownUrl={`${page.url}.md`} githubUrl={editUrl} className="mt-1.5 shrink-0" />
            </div>
            {page.data.description ? (
              <p className="mt-3 max-w-2xl text-[16.5px] leading-relaxed text-dim">{page.data.description}</p>
            ) : null}
          </header>

          <div className="prose">
            <MDX components={getMDXComponents()} />
          </div>

          <Pager prev={prev} next={next} />

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-6 font-mono text-[11.5px] text-dim border-t border-dashed border-line">
            <span>{updated ? `last updated ${updated}` : "asciicn docs"}</span>
            <span className="flex gap-5">
              <a href={editUrl} target="_blank" rel="noreferrer" className="transition-colors hover:text-ink">
                edit on github ↗
              </a>
              <a
                href={`${site.github}/issues/new?title=${encodeURIComponent(`docs: ${page.data.title}`)}`}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-ink"
              >
                report an issue ↗
              </a>
            </span>
          </footer>
        </article>
        <Toc editUrl={editUrl} />
      </div>
    </PageProvider>
  )
}

function Pager({ prev, next }: { prev: PageLink | null; next: PageLink | null }) {
  return (
    <nav className="mt-20 grid gap-2 sm:grid-cols-2">
      {[prev, next].map((link, i) =>
        link ? (
          <Link
            key={link.url}
            href={link.url}
            className={`group flex flex-col gap-1 border border-line px-5 py-4 transition-colors duration-200 hover:bg-plate ${i === 1 ? "items-end text-right sm:col-start-2" : ""}`}
          >
            <span className="flex items-center gap-2 font-mono text-[11px] text-dim">
              {i === 0 ? "previous" : "next"}
            </span>
            <span className="flex items-center gap-2 text-[15px] font-medium">
              {i === 0 ? <Arrow className="rotate-180 group-hover:-translate-x-1" /> : null}
              {link.title}
              {i === 1 ? <Arrow className="group-hover:translate-x-1" /> : null}
            </span>
          </Link>
        ) : null
      )}
    </nav>
  )
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-3.5 text-dim transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${className}`}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function lastUpdated(file: string) {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", file], { encoding: "utf8" }).trim() || null
  } catch {
    return null
  }
}

function neighboursOf(url: string): [PageLink | null, PageLink | null] {
  const pages = source.getPages()
  const order = flatten(source.getPageTree().children)
  const sorted = order.map((u) => pages.find((p) => p.url === u)).filter((p) => p !== undefined)
  const index = sorted.findIndex((p) => p.url === url)
  const toLink = (p?: (typeof sorted)[number]) => (p ? { url: p.url, title: p.data.title } : null)
  return [toLink(sorted[index - 1]), toLink(sorted[index + 1])]
}

function flatten(nodes: ReturnType<typeof source.getPageTree>["children"]): string[] {
  return nodes.flatMap((node) =>
    node.type === "page" ? [node.url] : node.type === "folder" ? flatten(node.children) : []
  )
}

export function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: { params: Promise<{ slug?: string[] }> }): Promise<Metadata> {
  const { slug } = await props.params
  const page = source.getPage(slug)
  if (!page) notFound()
  const image = `/og${page.url.replace(/^\/docs/, "")}`
  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: { images: image },
    twitter: { card: "summary_large_image", images: image },
    alternates: { types: { "text/markdown": `${page.url}.md` } },
  }
}
