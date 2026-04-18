"use client"
import { useState } from "react"
import { toast } from "sonner"
import { runEvaluation } from "@/lib/api"
import type { EvaluateResponse } from "@/types"

export function useEvaluate() {
  const [isLoading, setIsLoading] = useState(false)
  const [result,    setResult]    = useState<EvaluateResponse | null>(null)
  const [error,     setError]     = useState<string | null>(null)

  async function evaluate(file: File, query: string) {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const data = await runEvaluation(file, query)
      setResult(data)

      const winnerLabel =
        data.recommendation.winner === "tie"        ? "Tie"
        : data.recommendation.winner === "vectorless" ? "Vectorless RAG"
        :                                               "Vectored RAG"

      toast.success("Evaluation complete", {
        description: `Winner: ${winnerLabel}`,
      })
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ?? err?.message ?? "Evaluation failed"
      setError(message)
      toast.error("Evaluation failed", { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  function reset() {
    setResult(null)
    setError(null)
  }

  return { evaluate, isLoading, result, error, reset }
}