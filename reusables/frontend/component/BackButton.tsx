import { useLocation, useNavigate } from "react-router"

interface BackButtonProps {
  fallback: string
  className?: string
}

// "← Back" to wherever state.from says the caller came from, or `fallback` for a
// direct visit. Never window.history - the tab's history can hold pages outside this app.
export function BackButton({ fallback, className = "mb-4" }: BackButtonProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const from: string = location.state?.from ?? fallback

  return (
    <button
      onClick={() => navigate(from)}
      className={`flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground ${className}`}
    >
      ← Back
    </button>
  )
}
