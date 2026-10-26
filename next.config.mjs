import { createMDX } from "fumadocs-mdx/next"

const withMDX = createMDX()

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    return [{ source: "/docs", destination: "/docs/introduction", permanent: false }]
  },
  // Every docs page also reads as Markdown: /docs/installation.md
  async rewrites() {
    return [{ source: "/docs/:path*.md", destination: "/llms.mdx/:path*" }]
  },
}

export default withMDX(config)
