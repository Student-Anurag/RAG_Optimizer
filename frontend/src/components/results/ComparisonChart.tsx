"use client"
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Legend, Tooltip,
} from "recharts"
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion"
import type { EvaluationReport } from "@/types"

interface ComparisonChartProps {
  scores:    EvaluationReport["scores"]
  reasoning: EvaluationReport["reasoning"]
}

export default function ComparisonChart({ scores, reasoning }: ComparisonChartProps) {
  const data = [
    { metric: "Accuracy",     vectorless: scores.vectorless.accuracy,         vectored: scores.vectored.accuracy,         fullMark: 10 },
    { metric: "Completeness", vectorless: scores.vectorless.completeness,     vectored: scores.vectored.completeness,     fullMark: 10 },
    { metric: "Clarity",      vectorless: scores.vectorless.clarity,          vectored: scores.vectored.clarity,          fullMark: 10 },
    { metric: "Conciseness",  vectorless: scores.vectorless.conciseness,      vectored: scores.vectored.conciseness,      fullMark: 10 },
    { metric: "Citation",     vectorless: scores.vectorless.citation_quality, vectored: scores.vectored.citation_quality, fullMark: 10 },
  ]

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-6 text-sm font-semibold">Score comparison</h3>

      {/* Radar chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fontSize: 12, fill: "#ffffff" }}
            />
            <Radar
              name="Vectorless"
              dataKey="vectorless"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Radar
              name="Vectored"
              dataKey="vectored"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Legend
              formatter={(v) => (
                <span style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>
                  {v}
                </span>
              )}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Reasoning accordion */}
      <div className="mt-6 border-t border-border/60 pt-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Judge's reasoning
        </p>
        <Accordion type="multiple" className="space-y-1">
          {Object.entries(reasoning).map(([key, value]) => (
            <AccordionItem
              key={key}
              value={key}
              className="rounded-lg border border-border/60 px-3"
            >
              <AccordionTrigger className="py-2.5 text-sm font-medium capitalize hover:no-underline">
                {key.replace(/_/g, " ")}
              </AccordionTrigger>
              <AccordionContent className="pb-3 text-sm leading-relaxed text-muted-foreground">
                {value}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}