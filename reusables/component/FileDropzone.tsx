/* ── INTRO (delete this block once you know the file) ──────────
 * WHAT: FileDropzone — drag-and-drop / click-to-browse file picker
 *   with type and size validation. No library.
 * USE WHEN: Uploads of any kind; it hands you validated File
 *   objects and stops there.
 * NOTES: Selection + validation only — previews, progress, and the
 *   actual upload stay in the app. `accept` uses the native input
 *   syntax: ".csv,image/*,application/pdf".
 * ─────────────────────────────────────────────────────────────── */

// Drag-and-drop file picker with type/size validation.

import { useRef, useState, type DragEvent, type ReactNode } from "react"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"

/** A file that failed validation and why. */
export interface FileRejection {
  file: File
  reason: "type" | "size"
}

/** True when `file` matches the `accept` list (native input syntax). */
export function isAcceptedType(file: File, accept: string): boolean {
  return accept.split(",").some(raw => {
    const token = raw.trim().toLowerCase()
    if (token === "") return false
    // ".csv" style: match the file extension.
    if (token.startsWith(".")) return file.name.toLowerCase().endsWith(token)
    // "image/*" style: match the mime type family.
    if (token.endsWith("/*")) return file.type.toLowerCase().startsWith(token.slice(0, -1))
    return file.type.toLowerCase() === token
  })
}

interface FileDropzoneProps {
  /** Receives the files that passed validation; not called when none did. */
  onFiles: (files: File[]) => void
  /** Receives the files that failed, e.g. to show an error. */
  onReject?: (rejections: FileRejection[]) => void
  /** Allowed types in native input syntax, e.g. ".csv,image/*". */
  accept?: string
  maxSizeBytes?: number
  multiple?: boolean
  disabled?: boolean
  /** Replaces the default icon + prompt content. */
  children?: ReactNode
  className?: string
}

/** Drop target + hidden file input; validates and reports selected files. */
export function FileDropzone({
  onFiles,
  onReject,
  accept,
  maxSizeBytes,
  multiple = false,
  disabled = false,
  children,
  className,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return
    const files = multiple ? Array.from(list) : [list[0]]

    const accepted: File[] = []
    const rejected: FileRejection[] = []
    for (const file of files) {
      if (accept && !isAcceptedType(file, accept)) rejected.push({ file, reason: "type" })
      else if (maxSizeBytes !== undefined && file.size > maxSizeBytes) rejected.push({ file, reason: "size" })
      else accepted.push(file)
    }

    if (accepted.length > 0) onFiles(accepted)
    if (rejected.length > 0) onReject?.(rejected)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!disabled) handleFiles(e.dataTransfer.files)
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled || undefined}
      aria-label="Upload files"
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={e => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      // dragover must be cancelled for the element to be a drop target.
      onDragOver={e => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-input p-8 text-center text-sm text-muted-foreground transition-colors",
        dragging && "border-primary bg-accent",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={e => {
          handleFiles(e.target.files)
          // Reset so picking the same file again still fires change.
          e.target.value = ""
        }}
      />
      {children ?? (
        <>
          <Upload aria-hidden className="size-8 text-muted-foreground/60" />
          <p>
            Drag and drop {multiple ? "files" : "a file"} here, or click to browse
          </p>
        </>
      )}
    </div>
  )
}
