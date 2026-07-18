// Authenticated fetch wrapper for a token + refresh-cookie auth scheme.
//
// `createApiClient(config)` returns an `apiFetch` that:
//   1. attaches `Authorization: Bearer <token>`
//   2. sends cookies (`credentials: "include"`) so the refresh cookie rides along
//   3. on 401, does a single-flight token refresh and retries the request once
//   4. if the refresh fails, clears the token and calls `onSessionExpired`
//
// Plus `handleResponse` / `handleEmptyResponse` helpers that throw a typed
// `ApiError` (carrying the HTTP status) on non-2xx responses.
//
// Project-agnostic: no base URL, no maintenance window, no hardcoded routes.
// Pass full URLs to `apiFetch`; supply endpoints and callbacks via config.

import { parseApiErrorBody } from "./apiError"

/** Error carrying the HTTP status alongside a message. */
export class ApiError extends Error {
  public status: number
  /** Machine-readable code from the ApiErrorBody contract, when the server sent one. */
  public code?: string
  /** Validation messages keyed by field name, when the server sent them. */
  public fieldErrors?: Record<string, string[]>
  constructor(status: number, message: string, code?: string, fieldErrors?: Record<string, string[]>) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export interface ApiClientConfig {
  /** Endpoint that mints a new access token from the refresh cookie (POST, credentials included). */
  refreshUrl: string
  getToken: () => string | null
  setToken: (token: string) => void
  clearToken: () => void
  /** Field on the refresh response holding the new access token. Default: "accessToken". */
  tokenField?: string
  /** Called after a failed refresh clears the token — e.g. redirect to a login page. */
  onSessionExpired?: () => void
  /**
   * Whether a 401 from this URL is a credentials error (login/refresh) rather than
   * a session expiry, so it should not trigger a refresh+retry. Default: url contains "/auth/".
   */
  isAuthEndpoint?: (input: string) => boolean
}

export function createApiClient(config: ApiClientConfig) {
  const {
    refreshUrl, getToken, setToken, clearToken,
    tokenField = "accessToken",
    onSessionExpired,
    isAuthEndpoint = (input: string) => input.includes("/auth/"),
  } = config

  // Holds an in-flight refresh so concurrent 401s share one refresh instead of each starting their own.
  let refreshPromise: Promise<string> | null = null

  // Uses plain fetch (not apiFetch) to avoid an infinite retry loop when refresh itself fails.
  async function silentRefresh(): Promise<string> {
    if (refreshPromise) return refreshPromise

    refreshPromise = fetch(refreshUrl, { method: "POST", credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Refresh failed")
        const data = await res.json()
        const token = data[tokenField] as string
        setToken(token)
        return token
      })
      .finally(() => { refreshPromise = null })

    return refreshPromise
  }

  /** Drop-in for fetch that attaches auth, sends cookies, and refresh-retries once on 401. */
  async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
    const token = getToken()

    const response = await fetch(input, {
      ...init,
      credentials: "include",
      headers: {
        ...init.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (response.status !== 401) return response

    // 401 on an auth endpoint is bad credentials, not an expired session — don't retry.
    if (isAuthEndpoint(input)) return response

    // Otherwise: silent refresh, then retry the original request once.
    try {
      const newToken = await silentRefresh()
      return fetch(input, {
        ...init,
        credentials: "include",
        headers: { ...init.headers, Authorization: `Bearer ${newToken}` },
      })
    } catch {
      clearToken()
      onSessionExpired?.()
      throw new Error("Session expired")
    }
  }

  return { apiFetch, silentRefresh, handleResponse, handleEmptyResponse }
}

// Safe client-authored fallback — never echoes the server's message verbatim.
function genericFallbackMessage(status: number): string {
  if (status >= 500) return "Something went wrong on our end. Please try again shortly."
  return "Something went wrong. Please try again."
}

// Parses the body per the ApiErrorBody contract (see apiError.ts — also covers
// legacy shapes), then throws ApiError with status, message (generic fallback
// when none), and any code / field errors. Never returns.
async function throwApiError(response: Response): Promise<never> {
  const body = await response.json().catch(() => null)
  const { message, code, fieldErrors } = parseApiErrorBody(body)

  throw new ApiError(
    response.status,
    message ?? genericFallbackMessage(response.status),
    code,
    fieldErrors,
  )
}

/** Parses JSON on a 2xx response; throws ApiError otherwise. */
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) await throwApiError(response)
  return response.json()
}

/** Resolves on a 2xx response with no body; throws ApiError otherwise. */
export async function handleEmptyResponse(response: Response): Promise<void> {
  if (!response.ok) await throwApiError(response)
}
