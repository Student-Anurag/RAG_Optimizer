export const PIPELINE_LABELS = {
  vectorless: "Vectorless RAG",
  vectored:   "Vectored RAG",
} as const

export const PIPELINE_COLORS = {
  vectorless: "#8b5cf6",
  vectored:   "#10b981",
} as const

export const SCORE_METRICS = [
  { key: "accuracy",         label: "Accuracy"     },
  { key: "completeness",     label: "Completeness" },
  { key: "clarity",          label: "Clarity"      },
  { key: "conciseness",      label: "Conciseness"  },
  { key: "citation_quality", label: "Citation"     },
] as const

export const HALLUCINATION_RISK = {
  low:    { label: "Low risk",    className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  medium: { label: "Medium risk", className: "border-amber-200  bg-amber-50   text-amber-700"   },
  high:   { label: "High risk",   className: "border-red-200    bg-red-50     text-red-700"     },
} as const

export const GROUNDING_BADGE: Record<string, { label: string; className: string }> = {
  hallucinated:        { label: "Hallucinated",    className: "bg-red-50     text-red-700     border-red-200"     },
  abstained:           { label: "Abstained",        className: "bg-blue-50    text-blue-700    border-blue-200"    },
  general_fallback:    { label: "General fallback", className: "bg-amber-50   text-amber-700   border-amber-200"   },
  context_unavailable: { label: "No context",       className: "bg-gray-50    text-gray-600    border-gray-200"    },
  none:                { label: "Grounded",          className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
}