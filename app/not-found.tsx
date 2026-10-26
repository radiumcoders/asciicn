import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 font-mono">
      <pre className="text-dim">{"404 :: page not found"}</pre>
      <Link href="/" className="text-[13px] underline underline-offset-4">
        cd ~
      </Link>
    </div>
  )
}
