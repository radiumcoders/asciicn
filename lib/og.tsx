import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"

export const ogSize = { width: 1200, height: 630 }

const fonts = join(process.cwd(), "node_modules/geist/dist/fonts")
const load = (file: string) => readFile(join(fonts, file))

const RAMP = " .:-=+*#%@"
const COLS = 112
const ROWS = 25

// A still frame of the ASCII field, seeded so each page gets its own weather. It fades out to the left, under the text.
function field(seed: number) {
  const rows: string[] = []
  for (let r = 0; r < ROWS; r++) {
    let row = ""
    for (let c = 0; c < COLS; c++) {
      const v =
        Math.sin(c * 0.11 + seed + Math.sin(r * 0.27 + seed * 0.5) * 1.6) +
        Math.cos(r * 0.31 - c * 0.045 + seed * 1.3) +
        Math.sin((c + r * 1.7) * 0.06 + seed * 0.7)
      const t = Math.max(0, Math.min(0.999, (v + 1.6) / 4.4))
      row += RAMP[Math.floor(t * RAMP.length)]
    }
    rows.push(row)
  }
  return rows
}

const hash = (text: string) => [...text].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 9973, 7) / 997

export async function ogImage({ title, description, path }: { title: string; description?: string; path: string }) {
  const [mono, monoBold, sans] = await Promise.all([
    load("geist-mono/GeistMono-Regular.ttf"),
    load("geist-mono/GeistMono-SemiBold.ttf"),
    load("geist-sans/Geist-Regular.ttf"),
  ])

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#0d0d0c", color: "#ecebe7", position: "relative" }}>
        {/* The field sits behind everything, brightest top right. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            fontFamily: "Geist Mono",
            fontSize: 18,
            lineHeight: "25.2px",
            color: "#34332f",
            whiteSpace: "pre",
            paddingLeft: 4,
          }}
        >
          {field(hash(title)).map((row, i) => (
            <div key={i} style={{ display: "flex" }}>
              {row}
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            backgroundImage: "linear-gradient(90deg, #0d0d0c 0%, #0d0d0c 34%, rgba(13,13,12,0.55) 66%, rgba(13,13,12,0) 100%)",
          }}
        />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", padding: "64px 72px" }}>
          <div style={{ display: "flex", alignItems: "center", fontFamily: "Geist Mono", fontWeight: 600, fontSize: 30 }}>
            <span style={{ color: "#8f8e89", marginRight: 14 }}>{">_"}</span>
            asciicn
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "Geist Mono", fontWeight: 600, fontSize: title.length > 18 ? 76 : 96, letterSpacing: -3, lineHeight: 1.05 }}>
              {title}
            </div>
            {description ? (
              <div style={{ marginTop: 24, maxWidth: 860, fontFamily: "Geist", fontSize: 32, lineHeight: 1.4, color: "#8f8e89" }}>{description}</div>
            ) : null}
            <div style={{ display: "flex", marginTop: 44, fontFamily: "Geist Mono", fontSize: 22, color: "#5c5b57" }}>
              <span style={{ color: "#8f8e89" }}>$</span>
              <span style={{ marginLeft: 14 }}>{path}</span>
              <span style={{ marginLeft: 6, width: 13, height: 26, background: "#ecebe7" }} />
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Geist Mono", data: mono, weight: 400, style: "normal" },
        { name: "Geist Mono", data: monoBold, weight: 600, style: "normal" },
        { name: "Geist", data: sans, weight: 400, style: "normal" },
      ],
    }
  )
}
