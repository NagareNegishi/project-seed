import { useLocation } from "react-router"

// Spread onto a Link's props - { state: { from: location.pathname } } - so a page
// like LegalPage (via BackButton) can navigate back to wherever it was clicked from.
export function useFromLinkState() {
  const location = useLocation()
  return { state: { from: location.pathname } }
}
