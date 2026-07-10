import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"
import Link from "next/link"

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <Link
          href="/"
          className="font-heading text-sm tracking-tight text-foreground"
        >
          asciicn
        </Link>
      ),
    },
    links: [
      {
        text: "Registry",
        url: "/docs/registry",
        active: "nested-url",
      },
      {
        text: "Components",
        url: "/docs/components",
        active: "nested-url",
      },
    ],
  }
}
