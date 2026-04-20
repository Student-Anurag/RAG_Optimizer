import axios from "axios"
import type { EvaluateResponse } from "@/types"

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  timeout: 180_000,
})

export async function runEvaluation(
  file: File,
  query: string
): Promise<EvaluateResponse> {
  const form = new FormData()
  form.append("file", file)
  form.append("query", query)

  const { data } = await client.post<EvaluateResponse>("/evaluate", form, {
    headers: { "Content-Type": "multipart/form-data" },
  })

  return data
}

export async function checkHealth(): Promise<boolean> {
  try {
    await client.get("/health")
    return true
  } catch {
    return false
  }
}