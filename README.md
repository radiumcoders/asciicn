
<p align="center">
  <a href="https://github.com/radiumcoders/asciicn/stargazers">
    <img src="https://shieldcn.dev/github/stars/radiumcoders/asciicn.svg?variant=secondary" alt="GitHub stars" />
  </a>
  <a href="https://github.com/radiumcoders/asciicn/commits/master">
    <img src="https://shieldcn.dev/github/last-commit/radiumcoders/asciicn.svg?variant=secondary" alt="last commit" />
  </a>
  <a href="https://ui.shadcn.com">
    <img src="https://shieldcn.dev/badge/shadcn-registry-outline.svg?variant=secondary&logo=shadcnui" alt="shadcn registry" />
  </a>
  <a href="https://www.typescriptlang.org">
    <img src="https://shieldcn.dev/badge/TypeScript-3178C6.svg?variant=secondary&logo=typescript" alt="TypeScript" />
  </a>
</p>

**asciicn** is a monochrome component library distributed as a [shadcn/ui](https://ui.shadcn.com) registry. Drop ASCII-styled UI primitives into any React project with a single CLI command — no package lock-in, just copy-paste components you own.

## Features

- **shadcn registry** — install components with `npx shadcn@latest add @asciicn/{name}`
- **Monochrome aesthetic** — terminal-inspired, ASCII-friendly styling
- **Live docs** — previews and install commands powered by [Fumadocs](https://fumadocs.dev)
- **Auto-built registry** — JSON regenerated from source on every `dev` / `build`

## Quick start

Add the asciicn registry to your consumer `components.json`:

```json
{
  "registries": {
    "@asciicn": "https://your-domain.com/r/{name}.json"
  }
}
```

Install a component:

```bash
npx shadcn@latest add @asciicn/ascii-badge
```

Use it in your app:

```tsx
import { AsciiBadge } from "@/components/asciicn/ascii-badge"

export function Example() {
  return (
    <>
      <AsciiBadge>default</AsciiBadge>
      <AsciiBadge variant="outline">outline</AsciiBadge>
    </>
  )
}
```

## Local development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000/docs](http://localhost:3000/docs) to browse components and previews.

`pnpm dev` and `pnpm build` regenerate registry JSON from `components/asciicn` automatically. To rebuild the registry manually:

```bash
pnpm registry
```

## Project structure

```
components/asciicn/   # Registry component source
content/docs/         # Fumadocs documentation
public/r/             # Generated registry JSON
registry.json         # Registry manifest
```

## Adding a component

1. Create a file under `components/asciicn/`
2. Register it in `registry.json`
3. Run `pnpm registry` or restart `pnpm dev`
4. Document it under `content/docs/components/`

## Links

- [Documentation](https://github.com/radiumcoders/asciicn/tree/master/content/docs)
- [Components](https://github.com/radiumcoders/asciicn/tree/master/content/docs/components)
- [shadcn/ui](https://ui.shadcn.com)
