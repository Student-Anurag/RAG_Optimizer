import { Trophy, Minus, AlertTriangle } from "lucide-react"
import { Badge }  from "@/components/ui/badge"
import { cn }     from "@/lib/utils"
import { HALLUCINATION_RISK } from "@/lib/constants"
import type { EvaluationReport } from "@/types"

const WINNER_CONFIG = {
  vectorless: {
    label:    "Vectorless RAG wins",
    gradient: "from-violet-950/80 to-zinc-900",
    border:   "border-violet-500/40",
    iconBg:   "bg-violet-500/20 text-violet-400",
    badge:    "bg-violet-600 text-white border-violet-600",
  },
  vectored: {
    label:    "Vectored RAG wins",
    gradient: "from-emerald-950/80 to-zinc-900",
    border:   "border-emerald-500/40",
    iconBg:   "bg-emerald-500/20 text-emerald-400",
    badge:    "bg-emerald-600 text-white border-emerald-600",
  },
  tie: {
    label:    "It's a tie",
    gradient: "from-amber-950/80 to-zinc-900",
    border:   "border-amber-500/40",
    iconBg:   "bg-amber-500/20 text-amber-400",
    badge:    "bg-amber-500 text-white border-amber-500",
  },
}

export default function RecommendationCard({
  report,
}: {
  report: EvaluationReport
}) {
  const {
    winner, summary, recommendation, hallucination_risk,
    score_diff, scores,
  } = report

  const wc  = WINNER_CONFIG[winner]
  const rc  = HALLUCINATION_RISK[hallucination_risk]

  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-br p-4 shadow-sm sm:p-6",
        wc.gradient,
        wc.border,
      )}
    >
      {/* ── Top row ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              wc.iconBg
            )}
          >
            {winner === "tie" ? (
              <Minus className="h-5 w-5" />
            ) : (
              <Trophy className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold sm:text-lg">{wc.label}</h2>
              <Badge className={cn("text-xs", wc.badge)}>
                {winner === "vectorless"
                  ? "Vectorless"
                  : winner === "vectored"
                  ? "Vectored"
                  : "Tie"}
              </Badge>
            </div>
            {winner !== "tie" && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                by {Math.abs(score_diff)} point
                {Math.abs(score_diff) !== 1 ? "s" : ""} · {scores.vectorless.total}{" "}
                vs {scores.vectored.total}
              </p>
            )}
          </div>
        </div>

        {/* Hallucination risk badge */}
        <div
          className={cn(
            "flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
            rc.className
          )}
        >
          <AlertTriangle className="h-3 w-3" />
          {rc.label}
        </div>
      </div>

      {/* ── Summary ── */}
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {summary}
      </p>

      {/* ── Actionable recommendation ── */}
      <div className="mt-4 rounded-xl border border-border/50 bg-background/60 p-3 sm:p-4">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Recommendation
        </p>
        <p className="text-sm leading-relaxed">{recommendation}</p>
      </div>
    </div>
  )
}