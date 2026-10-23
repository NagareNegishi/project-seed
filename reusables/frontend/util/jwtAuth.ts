// In-memory access-token store + generic JWT claim reader.
// Generalized from `auth.ts` - the app's tier/demo-account checks are left out.
//
// The refresh token typically lives in an httpOnly cookie set by the server -
// never accessible here. On page refresh this resets to null; call your
// refresh endpoint to restore it before the app assumes "logged out".

let accessToken: string | null = null

export function getToken(): string | null {
  return accessToken
}

export function setToken(token: string): void {
  accessToken = token
}

export function clearToken(): void {
  accessToken = null
}

// Decode the JWT payload (middle section) and read one claim.
// The payload is base64url-encoded JSON - readable by anyone, not encrypted.
export function getClaim<T = unknown>(claim: string): T | null {
  if (!accessToken) return null
  try {
    // base64url swaps +→- and /→_ for URL safety; atob() needs them swapped back
    const b64 = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")
    const payload = JSON.parse(atob(b64))
    return payload[claim] ?? null
  } catch {
    return null
  }
}

// Reads a role claim, normalizing the single-string/array-of-strings shape
// (common with .NET Identity, which emits a bare string for one role) to string[].
export function getRoles(claim = "role"): string[] {
  const role = getClaim<string | string[]>(claim)
  if (!role) return []
  return Array.isArray(role) ? role : [role]
}

export function hasRole(role: string, claim = "role"): boolean {
  return getRoles(claim).includes(role)
}
