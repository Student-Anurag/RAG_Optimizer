"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import confetti from "canvas-confetti"
import type { EvaluateResponse } from "@/types"
import RecommendationCard from "./RecommendationCard"
import PipelineCard       from "./PipelineCard"
import ComparisonChart    from "./ComparisonChart"

export default function ResultsPanel({ result }: { result: EvaluateResponse }) {
  const { vectorless_answer, vectored_answer, recommendation, query, filename } =
    result

  const firedRef = useRef(false)

  useEffect(() => {
    // Only fire once per result, and only when there's a clear winner
    if (firedRef.current) return
    if (recommendation.winner === "tie") return

    firedRef.current = true

    const isVectorless = recommendation.winner === "vectorless"
    const color = isVectorless ? "#8b5cf6" : "#10b981"
    const neutral = "#ffffff"

    // First burst — centre
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.55 },
      colors: [color, neutral, color],
      scalar: 0.9,
      gravity: 1.2,
    })

    // Second burst — left + right flanks with slight delay
    setTimeout(() => {
      confetti({
        particleCount: 40,
        spread: 80,
        origin: { y: 0.5, x: 0.3 },
        colors: [color, neutral],
        scalar: 0.8,
        gravity: 1.1,
      })
      confetti({
        particleCount: 40,
        spread: 80,
        origin: { y: 0.5, x: 0.7 },
        colors: [color, neutral],
        scalar: 0.8,
        gravity: 1.1,
      })
    }, 150)
  }, [recommendation.winner])

  return (
    <div className="space-y-5">
      {/* Context bar */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0, ease: "easeOut" }}
        className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-border/50 bg-muted/20 px-4 py-2.5 text-sm"
      >
        <span className="text-muted-foreground">
          File: <span className="font-medium text-foreground">{filename}</span>
        </span>
        <span className="text-muted-foreground">
          Query:{" "}
          <span className="font-medium italic text-foreground">"{query}"</span>
        </span>
      </motion.div>

      {/* Winner callout */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
      >
        <RecommendationCard report={recommendation} />
      </motion.div>

      {/* Pipeline cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
        >
          <PipelineCard
            pipelineName="Vectorless RAG"
            pipelineKey="vectorless"
            answer={vectorless_answer}
            scores={recommendation.scores.vectorless}
            grounding={recommendation.grounding.vectorless}
            scan={recommendation.hallucination_scan.vectorless}
            isWinner={recommendation.winner === "vectorless"}
            isTie={recommendation.winner === "tie"}
            chunks={[]}
            latency={null}
            cacheHit={null}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
        >
          <PipelineCard
            pipelineName="Vectored RAG"
            pipelineKey="vectored"
            answer={vectored_answer.answer}
            scores={recommendation.scores.vectored}
            grounding={recommendation.grounding.vectored}
            scan={recommendation.hallucination_scan.vectored}
            isWinner={recommendation.winner === "vectored"}
            isTie={recommendation.winner === "tie"}
            chunks={vectored_answer.retrieved_chunks}
            latency={vectored_answer.latency_seconds}
            cacheHit={vectored_answer.cache_hit}
          />
        </motion.div>
      </div>

      {/* Chart — fades in last */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.4, ease: "easeOut" }}
      >
        <ComparisonChart
          scores={recommendation.scores}
          reasoning={recommendation.reasoning}
        />
      </motion.div>
    </div>
  )
}