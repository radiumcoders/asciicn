import { notFound } from "next/navigation"

import { pageMarkdown } from "@/lib/llm"
import { source } from "@/lib/source"

// Served at /docs/<slug>.md through a rewrite in next.config.mjs.
export async function GET(_request: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const page = source.getPage(slug)
  if (!page) notFound()
  return new Response(await pageMarkdown(page), { headers: { "Content-Type": "text/markdown; charset=utf-8" } })
}

export function generateStaticParams() {
  return source.generateParams()
}
