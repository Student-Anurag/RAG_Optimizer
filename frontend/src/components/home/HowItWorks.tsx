import { Upload, Cpu, BarChart3 } from "lucide-react"

const STEPS = [
  {
    icon: Upload,
    step: "01",
    title: "Upload your document",
    description:
      "Drop any PDF — research papers, reports, policies, product docs. It's processed for both pipelines simultaneously.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "Ask your question",
    description:
      "Type a natural language query. Vectorless and Vectored RAG run in parallel and return independent answers.",
  },
  {
    icon: BarChart3,
    step: "03",
    title: "Get a data-driven verdict",
    description:
      "An LLM judge scores both answers on five dimensions and runs a hallucination scan — then declares a winner.",
  },
]

export default function HowItWorks() {
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-14 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight">How it works</h2>
          <p className="text-muted-foreground">
            Three steps to know exactly which RAG pipeline serves your data best.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.step} className="relative flex flex-col gap-4">
              {i < STEPS.length - 1 && (
                <div className="absolute right-0 top-6 hidden h-px w-1/2 bg-gradient-to-r from-border to-transparent md:block" />
              )}
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-200 bg-violet-50">
                  <step.icon className="h-5 w-5 text-violet-600" />
                </div>
                <span className="font-mono text-xs font-medium text-muted-foreground">
                  {step.step}
                </span>
              </div>
              <h3 className="text-base font-semibold">{step.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}