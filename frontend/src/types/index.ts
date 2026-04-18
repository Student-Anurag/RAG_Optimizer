export interface PipelineScores {
  accuracy: number
  completeness: number
  clarity: number
  conciseness: number
  citation_quality: number
  total: number
}

export interface HallucinationScan {
  context_available: boolean
  admission_detected: boolean
  specificity_leakage: boolean
  generic_pivot: boolean
  verdict: string
}

export interface EvaluationReport {
  scores: {
    vectorless: PipelineScores
    vectored: PipelineScores
  }
  grounding: {
    vectorless: string
    vectored: string
  }
  hallucination_scan: {
    vectorless: HallucinationScan
    vectored: HallucinationScan
  }
  winner: "vectorless" | "vectored" | "tie"
  winner_note: string
  reasoning: {
    accuracy: string
    completeness: string
    clarity: string
    conciseness: string
    citation_quality: string
  }
  summary: string
  recommendation: string
  hallucination_risk: "low" | "medium" | "high"
  score_diff: number
}

export interface PipelineResult {
  pipeline: string
  answer: string
  retrieved_chunks: string[]
  latency_seconds: number
  cache_hit: boolean
  rerank_scores: number[]
  query_variants: string[]
}

export interface EvaluateResponse {
  filename: string
  query: string
  vectorless_answer: string
  vectored_answer: PipelineResult
  recommendation: EvaluationReport
}