import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { getMDXComponents } from "@/components/docs/mdx"
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
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{page.data.title}</h1>
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
                className={`rounded-xl bg-plate px-4 py-3 transition-colors hover:bg-wash ${i === 1 ? "sm:col-start-2 sm:text-right" : ""}`}
              >
                <span className="block font-mono text-[11px] text-dim uppercase">{i === 0 ? "Previous" : "Next"}</span>
                <span className="text-[14px] font-medium">{item.title}</span>
              </Link>
            ) : null
          )}
        </nav>
      </article>
      <Toc items={page.data.toc} />
    </div>
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
