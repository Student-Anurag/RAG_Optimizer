"use client"
import { AnimatePresence, motion } from "framer-motion"
import { useEvaluate }  from "@/hooks/useEvaluate"
import EvaluateForm     from "@/components/evaluate/EvaluateForm"
import LoadingState     from "@/components/evaluate/LoadingState"
import ResultsPanel     from "@/components/results/ResultsPanel"

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
            className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <strong>Error:</strong> {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}