import Link from "next/link"
import { Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
            <Cpu className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight">RAG Optimizer</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Home</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/evaluate">Evaluate</Link>
          </Button>
          <Button
            size="sm"
            className="ml-2 bg-violet-600 text-white hover:bg-violet-700"
            asChild
          >
            <Link href="/evaluate">Try it free</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}