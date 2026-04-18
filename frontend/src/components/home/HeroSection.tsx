import Link from "next/link"
import { ArrowRight, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-border/40 bg-background pb-24 pt-20 md:pb-32 md:pt-28">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-900/20 blur-3xl" />
        <div className="absolute right-1/4 top-16 h-64 w-64 rounded-full bg-indigo-900/15 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <Badge
          variant="secondary"
          className="mb-6 gap-1.5 border border-violet-200 bg-violet-50 text-violet-700"
        >
          <Zap className="h-3 w-3" />
          LLM-as-Judge · 5-dimension evaluation
        </Badge>

        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          Stop guessing which{" "}
          <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
            RAG pipeline
          </span>{" "}
          works best
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground leading-relaxed">
          Upload your document, ask a question — RAG Optimizer runs Vectorless and
          Vectored pipelines in parallel, then scores them on accuracy, completeness,
          hallucination risk, and more.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="gap-2 bg-violet-600 px-8 text-white hover:bg-violet-700"
            asChild
          >
            <Link href="/evaluate">
              Start Evaluating <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          
          {/* FIXED: Added the missing <a> tag properly inside the Button */}
          <Button size="lg" variant="outline" className="px-8" asChild>
            <a 
              href="https://github.com/Student-Anurag/RAG_Optimizer" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 border-t border-border/40 pt-10">
          {[
            { value: "2",  label: "Pipelines compared"     },
            { value: "5",  label: "Evaluation dimensions"  },
            { value: "0",  label: "Guesswork involved"     },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-3xl font-bold text-violet-600">{s.value}</span>
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}