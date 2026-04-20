"use client"
import { AnimatePresence, motion } from "framer-motion"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { useEvaluate }  from "@/hooks/useEvaluate"
import EvaluateForm     from "@/components/evaluate/EvaluateForm"
import LoadingState     from "@/components/evaluate/LoadingState"
import ResultsPanel     from "@/components/results/ResultsPanel"
import { Button }       from "@/components/ui/button"

export default function EvaluatePage() {
  const { evaluate, isLoading, result, error, reset } = useEvaluate()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Evaluate your RAG pipeline</h1>
        <p className="mt-2 text-muted-foreground">
          Upload a PDF and ask a question — we handle the rest.
        </p>
      </div>

      <EvaluateForm
        onSubmit={evaluate}
        isLoading={isLoading}
        onReset={result ? reset : undefined}
      />

      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-10"
          >
            <LoadingState />
          </motion.div>
        )}

        {result && !isLoading && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-10"
          >
            <ResultsPanel result={result} />
          </motion.div>
        )}

        {error && !isLoading && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mt-10"
          >
            <div className="rounded-2xl border border-red-500/20 bg-red-950/30 p-8 text-center">
              {/* Icon */}
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                <AlertTriangle className="h-7 w-7 text-red-400" />
              </div>

              {/* Heading */}
              <h2 className="mb-2 text-lg font-semibold text-foreground">
                Evaluation failed
              </h2>

              {/* Human-readable message */}
              <p className="mx-auto mb-1 max-w-md text-sm text-muted-foreground">
                Something went wrong while processing your document. This is usually
                caused by a backend timeout, an unsupported PDF, or a network issue.
              </p>

              {/* Raw error detail — collapsed, smaller */}
              <p className="mx-auto mb-6 max-w-lg truncate text-xs text-red-400/70">
                {error}
              </p>

              {/* Actions */}
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={reset}
                  className="gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Try again
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-muted-foreground hover:text-foreground"
                >
                  <a
                    href="https://github.com/Student-Anurag/RAG_Optimizer/issues/new"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Report issue
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}