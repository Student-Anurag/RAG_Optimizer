import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

export function scoreToBarColor(score: number): string {
  if (score >= 8) return "bg-emerald-500"
  if (score >= 6) return "bg-violet-500"
  if (score >= 4) return "bg-amber-500"
  return "bg-red-500"
}

export function scoreToTextColor(score: number): string {
  if (score >= 8) return "text-emerald-600"
  if (score >= 6) return "text-violet-600"
  if (score >= 4) return "text-amber-600"
  return "text-red-600"
}

export function truncateFilename(name: string, maxLength = 28): string {
  if (name.length <= maxLength) return name
  const ext  = name.slice(name.lastIndexOf("."))
  const base = name.slice(0, name.lastIndexOf("."))
  const keep = maxLength - ext.length - 1
  return base.slice(0, keep) + "…" + ext
}