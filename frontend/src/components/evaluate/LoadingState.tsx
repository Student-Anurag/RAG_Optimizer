import { Skeleton } from "@/components/ui/skeleton"

const STEPS = [
  "Building document tree…",
  "Running Vectorless pipeline…",
  "Running Vectored pipeline…",
  "LLM judge scoring answers…",
]

export default function LoadingState() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          Evaluation in progress
        </p>
        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <span
                className="h-2 w-2 rounded-full bg-violet-500 animate-pulse"
                style={{ animationDelay: `${i * 0.35}s` }}
              />
              <span className="text-sm text-muted-foreground">{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="space-y-3 rounded-2xl border border-border bg-card p-5"
          >
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <div className="space-y-2.5 pt-2">
              {["Accuracy", "Completeness", "Clarity", "Conciseness", "Citation"].map(
                (m) => (
                  <div key={m} className="space-y-1.5">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}