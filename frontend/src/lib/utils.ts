import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a millisecond latency value into a human-readable string */
export function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

/**
 * Tailwind bg-* class for a score bar fill (0-10 scale)
 * 7+  → emerald  (great)
 * 5+  → violet   (good — brand colour, feels positive not alarming)
 * 3+  → amber    (okay)
 * <3  → red      (poor)
 */
export function scoreToBarColor(score: number): string {
  if (score >= 7) return "bg-emerald-500"
  if (score >= 5) return "bg-violet-500"
  if (score >= 3) return "bg-amber-500"
  return "bg-red-500"
}

/**
 * Tailwind text-* class for a score number (0-10 scale)
 * Mirrors scoreToBarColor thresholds exactly.
 */
export function scoreToTextColor(score: number): string {
  if (score >= 7) return "text-emerald-500"
  if (score >= 5) return "text-violet-400"
  if (score >= 3) return "text-amber-500"
  return "text-red-500"
}

/** Truncate a filename to a max display length, preserving the extension */
export function truncateFilename(name: string, maxLength = 28): string {
  if (name.length <= maxLength) return name
  const ext  = name.slice(name.lastIndexOf("."))
  const base = name.slice(0, name.lastIndexOf("."))
  const keep = maxLength - ext.length - 1
  return base.slice(0, keep) + "…" + ext
}