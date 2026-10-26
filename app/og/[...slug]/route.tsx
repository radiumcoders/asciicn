import { notFound } from "next/navigation"

import { ogImage } from "@/lib/og"
import { source } from "@/lib/source"

// Social card for a docs page: /og/components/terminal. A catch-all can't hold an
// opengraph-image file, so the docs page points its metadata here.
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const page = source.getPage(slug)
  if (!page) notFound()
  return ogImage({ title: page.data.title, description: page.data.description, path: `cd ~${page.url}` })
}

export function generateStaticParams() {
  return source.generateParams().filter((params) => params.slug.length > 0)
}
