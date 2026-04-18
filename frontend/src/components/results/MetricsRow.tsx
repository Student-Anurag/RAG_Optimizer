import { Zap, Database, BarChart2 } from "lucide-react"
import { cn, formatLatency } from "@/lib/utils"

interface MetricsRowProps {
  latency:      number | null
  cacheHit:     boolean | null
  rerankScores?: number[] | null
}

export default function MetricsRow({
  latency,
  cacheHit,
  rerankScores,
}: MetricsRowProps) {
  const hasContent =
    latency !== null ||
    cacheHit !== null ||
    (rerankScores && rerankScores.length > 0)

  if (!hasContent) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Latency */}
      {latency !== null && (
        <span className="flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-0.5 text-xs text-muted-foreground">
          <Zap className="h-3 w-3" />
          {formatLatency(latency)}
        </span>
      )}

      {/* Cache status */}
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

      {/* Rerank scores */}
      {rerankScores?.map((score, i) => (
        <span
          key={i}
          className="flex items-center gap-1 rounded-full border border-border/60 px-2.5 py-0.5 text-xs text-muted-foreground"
        >
          <BarChart2 className="h-3 w-3" />
          Chunk {i + 1}: {score.toFixed(3)}
        </span>
      ))}
    </div>
  )
}