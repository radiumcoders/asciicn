import { ogImage, ogSize } from "@/lib/og"
import { site } from "@/lib/site"

export const alt = `${site.name}: text-mode components for React`
export const size = ogSize
export const contentType = "image/png"

export default function Image() {
  return ogImage({ title: "text-mode components", description: site.description, path: "cd ~/docs" })
}
