# asciicn

Text-mode components for React, distributed as a [shadcn](https://ui.shadcn.com) registry.

```bash
npx shadcn@latest add <site>/r/scramble-text.json
```

## Develop

```bash
pnpm install
pnpm dev
```

## Add a component

`registry.json` is the only list of components. To add one:

1. Write `registry/<name>/<name>.tsx`, with its own props in an exported `<Name>Props` interface.
2. Write `registry/<name>/demo.tsx`, which should fill the preview stage and show the effect on the first frame.
3. Add the item to `registry.json`.
4. Add `content/docs/components/<name>.mdx` with the same title.

`pnpm registry` checks that all four exist and regenerates the demo map. The sidebar, landing grid, code view and props table all build from these files.
