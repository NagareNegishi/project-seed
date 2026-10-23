import { Navigate } from "react-router"

/**
 * Auth-gate for a route tree: renders `children` when authenticated, otherwise
 * redirects to `redirectTo`.
 *
 * Uses `replace` on the redirect, not a pushed navigation, so the history
 * stack swaps the current entry instead of growing it - otherwise hitting
 * Back from a page reached post-redirect just redirects again.
 */
export default function ProtectedRoute({
  isAuthenticated, redirectTo, children,
}: {
  isAuthenticated: boolean
  redirectTo: string
  children: React.ReactNode
}) {
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }
  return children
}
