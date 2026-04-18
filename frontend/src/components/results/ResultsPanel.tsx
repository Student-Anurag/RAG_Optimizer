import type { EvaluateResponse } from "@/types"
import RecommendationCard from "./RecommendationCard"
import PipelineCard       from "./PipelineCard"
import ComparisonChart    from "./ComparisonChart"

export default function ResultsPanel({ result }: { result: EvaluateResponse }) {
  const { vectorless_answer, vectored_answer, recommendation, query, filename } =
    result

  return (
    <div className="space-y-5">
      {/* Context bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-border/50 bg-muted/20 px-4 py-2.5 text-sm">
        <span className="text-muted-foreground">
          File: <span className="font-medium text-foreground">{filename}</span>
        </span>
        <span className="text-muted-foreground">
          Query:{" "}
          <span className="font-medium italic text-foreground">"{query}"</span>
        </span>
      </div>

      {/* Winner callout */}
      <RecommendationCard report={recommendation} />

      {/* Pipeline cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
      </div>

      {/* Chart + reasoning */}
      <ComparisonChart
        scores={recommendation.scores}
        reasoning={recommendation.reasoning}
      />
    </div>
  )
}