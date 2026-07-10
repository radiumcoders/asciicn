import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createRelativeLink } from "fumadocs-ui/mdx"

import { getMDXComponents } from "@/components/mdx"
import { PageToc } from "@/components/page-toc"
import { getDefaultDocsPage } from "@/lib/docs-nav"
import { source } from "@/lib/source"

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const params = await props.params
  const page =
    params.slug && params.slug.length > 0
      ? source.getPage(params.slug)
      : getDefaultDocsPage()

  if (!page) notFound()

  const MDX = page.data.body

  return (
    <div className="relative mx-auto w-full max-w-3xl px-6 pb-10 pt-14 md:px-8 md:pt-10 xl:max-w-6xl xl:pr-56">
      <div className="mb-8 flex flex-col gap-3">
        <h1 className="font-heading text-3xl tracking-tight text-foreground md:text-4xl">
          {page.data.title}
        </h1>
        {page.data.description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {page.data.description}
          </p>
        ) : null}
      </div>

      <article className="docs-content prose min-w-0 dark:prose-invert">
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </article>

      <aside className="fixed top-8 right-6 hidden w-44 xl:block">
        <div className="docs-scroll flex max-h-[calc(100dvh-4rem)] flex-col gap-2 overflow-y-auto border-l border-border pl-4">
          <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
            On this page
          </p>
          <PageToc />
        </div>
      </aside>
    </div>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>
}): Promise<Metadata> {
  const params = await props.params
  const page =
    params.slug && params.slug.length > 0
      ? source.getPage(params.slug)
      : getDefaultDocsPage()

  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
  }
}