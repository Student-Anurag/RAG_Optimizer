"use client"
import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { FileText, Upload, X } from "lucide-react"
import { cn, truncateFilename } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface DropZoneProps {
  file: File | null
  onFileSelect: (file: File) => void
  onFileRemove: () => void
  disabled?: boolean
}

export default function DropZone({
  file,
  onFileSelect,
  onFileRemove,
  disabled,
}: DropZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => { if (accepted[0]) onFileSelect(accepted[0]) },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled,
  })

  if (file) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100">
            <FileText className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-medium">{truncateFilename(file.name)}</p>
            <p className="text-xs text-muted-foreground">
              {(file.size / 1024 / 1024).toFixed(2)} MB · PDF
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onFileRemove}
          disabled={disabled}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
        isDragActive
          ? "border-violet-400 bg-violet-50"
          : "border-border hover:border-violet-300 hover:bg-muted/20",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <input {...getInputProps()} />
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <Upload className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">
        {isDragActive ? "Drop it here" : "Drag & drop your PDF"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>
    </div>
  )
}