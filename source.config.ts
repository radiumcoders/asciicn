import { rehypeCodeDefaultOptions } from "fumadocs-core/mdx-plugins"
import { defineDocs, defineConfig } from "fumadocs-mdx/config"

import { docsShikiThemes } from "./lib/docs-shiki"

export const docs = defineDocs({
  dir: "content/docs",
})

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      ...rehypeCodeDefaultOptions,
      addLanguageClass: true,
      themes: docsShikiThemes,
    },
  },
})
