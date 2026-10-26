import { llmsFull } from "@/lib/llm"

export const dynamic = "force-static"

export async function GET() {
  return new Response(await llmsFull(), { headers: { "Content-Type": "text/markdown; charset=utf-8" } })
}
