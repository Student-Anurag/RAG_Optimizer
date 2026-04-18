"use client"
import { useState } from "react"
import { motion }   from "framer-motion"
import { Trophy, Minus, ChevronDown, ChevronUp, Zap, Database } from "lucide-react"
import { Badge }  from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, formatLatency, scoreToBarColor, scoreToTextColor } from "@/lib/utils"
import { SCORE_METRICS, GROUNDING_BADGE } from "@/lib/constants"
import type { PipelineScores, HallucinationScan } from "@/types"

interface PipelineCardProps {
  pipelineName: string
  pipelineKey:  "vectorless" | "vectored"
  answer:       string
  scores:       PipelineScores
  grounding:    string
  scan:         HallucinationScan
  isWinner:     boolean
  isTie:        boolean
  chunks:       string[]
  latency:      number | null
  cacheHit:     boolean | null
}

export default function PipelineCard({
  pipelineName, pipelineKey, answer, scores, grounding, isWinner, isTie,
  chunks, latency, cacheHit,
}: PipelineCardProps) {
  const [showChunks, setShowChunks] = useState(false)
  const isVectorless = pipelineKey === "vectorless"
  const groundingCfg = GROUNDING_BADGE[grounding] ?? GROUNDING_BADGE["none"]

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
        isWinner && isVectorless  && "ring-2 ring-violet-400  ring-offset-2",
        isWinner && !isVectorless && "ring-2 ring-emerald-400 ring-offset-2",
      )}
    >
      {/* ── Header ── */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "h-2.5 w-2.5 rounded-full",
              isVectorless ? "bg-violet-500" : "bg-emerald-500"
            )}
          />
          <h3 className="text-sm font-semibold">{pipelineName}</h3>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {isWinner && (
            <Badge className="gap-1 border-amber-200 bg-amber-50 text-amber-700 text-xs">
              <Trophy className="h-3 w-3" /> Winner
            </Badge>
          )}
          {isTie && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Minus className="h-3 w-3" /> Tie
            </Badge>
          )}
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-xs font-semibold",
              isVectorless
                ? "border-violet-200  text-violet-700"
                : "border-emerald-200 text-emerald-700"
            )}
          >
            {scores.total}/50
          </Badge>
        </div>
      </div>

      {/* ── Grounding verdict ── */}
      {grounding && grounding !== "none" && (
        <div
          className={cn(
            "mb-3 rounded-lg border px-3 py-1.5 text-xs font-medium",
            groundingCfg.className
          )}
        >
          {groundingCfg.label}
        </div>
      )}

      {/* ── Answer ── */}
      <div className="mb-4 max-h-48 overflow-y-auto rounded-xl bg-muted/40 p-3 text-sm leading-relaxed">
        {answer}
      </div>

      {/* ── Score bars ── */}
      <div className="mb-4 space-y-2.5">
        {SCORE_METRICS.map(({ key, label }, i) => {
          const score = scores[key as keyof PipelineScores] as number
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-xs text-muted-foreground">
                {label}
              </span>
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className={cn("h-full rounded-full", scoreToBarColor(score))}
                  initial={{ width: 0 }}
                  animate={{ width: `${(score / 10) * 100}%` }}
                  transition={{ duration: 0.65, delay: i * 0.07, ease: "easeOut" }}
                />
              </div>
              <span
                className={cn(
                  "w-5 text-right font-mono text-xs font-medium",
                  scoreToTextColor(score)
                )}
              >
                {score}
              </span>
            </div>
          )
        })}
      </div>

      {/* ── Metadata chips ── */}
      {(latency !== null || cacheHit !== null) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {latency !== null && (
            <span className="flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-0.5 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              {formatLatency(latency)}
            </span>
          )}
          {cacheHit !== null && (
            <span
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs",
                cacheHit
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-border/60 text-muted-foreground"
              )}
            >
              <Database className="h-3 w-3" />
              {cacheHit ? "Cache hit" : "Cache miss"}
            </span>
          )}
        </div>
      )}

      {/* ── Retrieved chunks ── */}
      {chunks.length > 0 && (
        <div className="mt-auto">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowChunks(!showChunks)}
          >
            {showChunks ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            {chunks.length} retrieved chunk{chunks.length !== 1 ? "s" : ""}
          </Button>

          {showChunks && (
            <div className="mt-2 space-y-2">
              {chunks.map((chunk, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-muted/40 p-2.5 text-xs leading-relaxed text-muted-foreground"
                >
                  <span className="mb-0.5 block font-medium text-foreground/60">
                    Chunk {i + 1}
                  </span>
                  {chunk.slice(0, 320)}
                  {chunk.length > 320 ? "…" : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}