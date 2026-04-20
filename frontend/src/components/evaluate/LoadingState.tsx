"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const STEPS = [
  { label: "Building document tree…",      duration: 6000  },
  { label: "Running Vectorless pipeline…", duration: 15000 },
  { label: "Running Vectored pipeline…",   duration: 15000 },
  { label: "LLM judge scoring answers…",   duration: 10000 },
]

export default function LoadingState() {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    let current = 0

    function advance() {
      current += 1
      if (current < STEPS.length) {
        setActiveStep(current)
        timer = setTimeout(advance, STEPS[current].duration)
      }
    }

    let timer = setTimeout(advance, STEPS[0].duration)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-4 text-sm font-medium text-muted-foreground">
          Evaluation in progress
        </p>
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const isDone    = i < activeStep
            const isActive  = i === activeStep
            const isPending = i > activeStep

            return (
              <div key={step.label} className="flex items-center gap-3">
                {/* Indicator dot */}
                <span
                  className={cn(
                    "h-2 w-2 rounded-full transition-all duration-500",
                    isDone   && "bg-emerald-500",
                    isActive && "bg-violet-500 animate-pulse",
                    isPending && "bg-muted-foreground/30"
                  )}
                />

                {/* Step label */}
                <span
                  className={cn(
                    "text-sm transition-colors duration-500",
                    isDone   && "text-emerald-500 line-through decoration-emerald-500/50",
                    isActive && "text-foreground font-medium",
                    isPending && "text-muted-foreground/50"
                  )}
                >
                  {step.label}
                </span>

                {/* Done checkmark */}
                {isDone && (
                  <span className="ml-auto text-xs text-emerald-500">✓</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Skeleton pipeline cards */}
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