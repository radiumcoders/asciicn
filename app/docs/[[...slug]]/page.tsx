import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { getMDXComponents } from "@/components/docs/mdx"
import { PageTitle } from "@/components/docs/page-title"
import { Toc } from "@/components/site/toc"
import { source } from "@/lib/source"

export default async function Page(props: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await props.params
  const page = source.getPage(slug)
  if (!page) notFound()

  const MDX = page.data.body
  const neighbours = neighboursOf(page.url)

  return (
    <div className="mx-auto flex max-w-6xl gap-12 px-5 pt-10 pb-16 md:px-10 md:pt-14">
      <article className="min-w-0 flex-1">
        <header className="mb-8">
          <PageTitle title={page.data.title} />
          {page.data.description ? (
            <p className="mt-3 max-w-2xl text-[16px] leading-relaxed text-dim">{page.data.description}</p>
          ) : null}
        </header>
        <div className="prose">
          <MDX components={getMDXComponents()} />
        </div>
        <nav className="mt-16 grid gap-2 sm:grid-cols-2">
          {neighbours.map((item, i) =>
            item ? (
              <Link
                key={item.url}
                href={item.url}
                className={`group flex flex-col rounded-xl bg-plate px-4 py-3 transition-colors hover:bg-wash ${i === 1 ? "items-end sm:col-start-2" : ""}`}
              >
                <span className="font-mono text-[11px] text-dim">{i === 0 ? "prev" : "next"}</span>
                <span className="flex items-center gap-1.5 text-[14px] font-medium">
                  {i === 0 ? <Arrow className="rotate-180 group-hover:-translate-x-0.5" /> : null}
                  {item.title}
                  {i === 1 ? <Arrow className="group-hover:translate-x-0.5" /> : null}
                </span>
              </Link>
            ) : null
          )}
        </nav>
      </article>
      <Toc items={page.data.toc} />
    </div>
  )
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`size-3.5 text-dim transition-transform duration-200 ease-out ${className}`}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function neighboursOf(url: string) {
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
  return { title: page.data.title, description: page.data.description }
}
