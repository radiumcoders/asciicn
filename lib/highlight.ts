import { codeToHtml } from "shiki"

export function highlight(code: string, lang = "tsx") {
  return codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "vesper" },
    defaultColor: false,
  })
}
