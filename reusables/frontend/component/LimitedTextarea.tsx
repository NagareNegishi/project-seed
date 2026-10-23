import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface LimitedTextareaProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  maxLength: number
  rows?: number
}

// Paste is handled manually since native maxLength caps pasted text at the cursor instead of
// trimming existing content, silently dropping most of what was pasted.
export default function LimitedTextarea({ id, label, value, onChange, maxLength, rows = 3 }: LimitedTextareaProps) {
  const [pasteTruncated, setPasteTruncated] = useState(false)

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text")
    const { selectionStart, selectionEnd } = e.currentTarget
    const merged = value.slice(0, selectionStart) + pasted + value.slice(selectionEnd)
    setPasteTruncated(merged.length > maxLength)
    onChange(merged.slice(0, maxLength))
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setPasteTruncated(false)
    onChange(e.target.value)
  }

  return (
    <div className="space-y-1.5 min-w-0">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        className="resize-y"
        value={value}
        onChange={handleChange}
        onPaste={handlePaste}
        rows={rows}
        maxLength={maxLength}
      />
      {pasteTruncated && (
        <p className="text-xs text-destructive">
          Pasted text was trimmed to fit the {maxLength} character limit.
        </p>
      )}
      <p className="text-xs text-muted-foreground text-right">{value.length} / {maxLength}</p>
    </div>
  )
}
