// No custom domain yet: fall back to the Vercel production URL, then localhost.
const host =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000")

export const site = {
  name: "asciicn",
  description: "Text-mode components for React. Copy them into your project with the shadcn CLI.",
  url: host.replace(/\/$/, ""),
  github: "https://github.com/radiumcoders/asciicn",
}

export const registryUrl = (name: string) => `${site.url}/r/${name}.json`
