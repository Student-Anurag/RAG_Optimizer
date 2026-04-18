"use client"
import { useState } from "react"
import { RotateCcw, Send } from "lucide-react"
import { Button }   from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label }    from "@/components/ui/label"
import DropZone     from "./DropZone"

interface EvaluateFormProps {
  onSubmit:  (file: File, query: string) => void
  isLoading: boolean
  onReset?:  () => void
}

export default function EvaluateForm({
  onSubmit,
  isLoading,
  onReset,
}: EvaluateFormProps) {
  const [file,  setFile]  = useState<File | null>(null)
  const [query, setQuery] = useState("")

  const canSubmit = !!file && query.trim().length > 0 && !isLoading

  function handleSubmit() {
    if (file && query.trim()) onSubmit(file, query.trim())
  }

  function handleReset() {
    setFile(null)
    setQuery("")
    onReset?.()
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Document (PDF)</Label>
          <DropZone
            file={file}
            onFileSelect={setFile}
            onFileRemove={() => setFile(null)}
            disabled={isLoading}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="query" className="text-sm font-medium">
            Your question
          </Label>
          <Textarea
            id="query"
            placeholder="e.g. What optimisation algorithm does the paper use?"
            className="min-h-[128px] resize-none rounded-xl text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Ask something document-specific for the most meaningful comparison.
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-5">
        <p className="text-xs text-muted-foreground">
          Both pipelines run in parallel — expect 20–60 s
        </p>
        <div className="flex gap-2">
          {onReset && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isLoading}
              className="gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          )}
          <Button
            size="sm"
            className="gap-2 bg-violet-600 px-6 text-white hover:bg-violet-700"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            <Send className="h-3.5 w-3.5" />
            {isLoading ? "Evaluating…" : "Run Evaluation"}
          </Button>
        </div>
      </div>
    </div>
  )
}