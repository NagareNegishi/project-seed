# Cookie Storage for JWTs + apiFetch Pattern

> Covers: why httpOnly cookies are used for the refresh token, the full auth flow end-to-end, and how `apiFetch` in `src/lib/api.ts` implements silent token refresh with a concurrency lock.

---

# Cookie Storage for JWTs

When people say "store JWTs in cookies," they almost always mean **httpOnly cookies** — and there's a critical distinction:

| Cookie type | Readable by JS? | Protected from XSS? |
|---|---|---|
| Regular cookie | Yes (`document.cookie`) | No — same as localStorage |
| httpOnly cookie | No | Yes |

The `httpOnly` flag tells the browser: never expose this to JavaScript, ever. Only the browser itself sends it automatically on requests to the matching domain. This is what makes it safer than localStorage.

---

## What "httpOnly cookie" auth looks like end-to-end

### Login flow

1. Frontend POSTs credentials to `/auth/login`
2. Backend responds with `Set-Cookie: refreshToken=<value>; HttpOnly; Secure; SameSite=Strict`
3. Browser stores the cookie — JS never sees it
4. Backend also returns the `accessToken` in the JSON body — stored in memory (React state)

### Every subsequent request

- The access token goes in `Authorization: Bearer <token>` header — the JS layer sends it
- The refresh cookie is sent automatically by the browser to the domain — the browser handles it automatically

### On 401 / page refresh

- Call `/auth/refresh` — browser auto-sends the cookie
- Backend validates the refresh token cookie and returns a new access token in the JSON body
- Store new access token in memory

The refresh token is never readable by JavaScript at all. An XSS attack can steal the access token (15 min lifetime, limited damage) but cannot steal the refresh token.

---

## Is it better than localStorage?

Yes, meaningfully so — for a specific threat:

| Threat | localStorage | httpOnly cookie |
|---|---|---|
| XSS stealing refresh token | Vulnerable | Protected |
| CSRF attack | Not vulnerable (JS must set the header) | Needs `SameSite=Strict` or a CSRF token |
| Logout on tab close | No (persists) | Possible (session cookie) |

The cookie approach is the industry standard for "production" auth. localStorage is fine for learning/internal tools but wouldn't be used for a real user-facing product.

---

## What it requires on the backend

This is the catch — the ASP.NET backend needs changes:

1. **Login endpoint** — instead of returning `{ accessToken, refreshToken }` in JSON body, it needs to:
   - Return `accessToken` in the JSON body (as now)
   - Set `refreshToken` as an httpOnly cookie via `Response.Cookies.Append()`

2. **Refresh endpoint** — instead of reading the refresh token from the request body, it reads from `Request.Cookies["refreshToken"]`

3. **Logout endpoint** — deletes the cookie via `Response.Cookies.Delete()`

4. **CORS** — needs `credentials: 'include'` on the frontend and `AllowCredentials()` + explicit origin (not wildcard) on the backend CORS policy. This is a small but non-obvious change.

---

## The flags that matter

| Flag | What it does |
|---|---|
| `HttpOnly` | JS cannot read this cookie. `document.cookie` won't show it. XSS-proof. |
| `Secure` | Browser only sends it over HTTPS. Never over HTTP. |
| `SameSite=Strict` | Browser only sends it when the request originates from the same domain. Blocks CSRF. |
| `Expires` / `Max-Age` | When the cookie dies. Without this it's a "session cookie" — deleted when browser closes. |

## `Set-Cookie` header format

```
Set-Cookie: name=value; Flag1; Flag2=something; ...
```

The **name=value** pair is the only required part. Everything after the semicolons are optional attributes (flags). The full set defined by the HTTP spec:

**`HttpOnly`** — prevents JavaScript from accessing the cookie via `document.cookie`. This is the main defense against XSS stealing tokens.

**`Secure`** — the browser will only send this cookie over HTTPS connections, never plain HTTP.

**`SameSite`** — controls whether the browser sends the cookie on cross-origin requests. Three possible values: `Strict` (only same-domain requests), `Lax` (same-domain plus top-level navigations like clicking a link), and `None` (always send, but requires `Secure`).

**`Expires`** — an absolute date/time when the cookie should be deleted, e.g. `Expires=Thu, 01 Jan 2026 00:00:00 GMT`.

**`Max-Age`** — same idea as `Expires` but expressed as seconds from now, e.g. `Max-Age=604800` for 7 days. If both are set, `Max-Age` wins.

**`Domain`** — which domain(s) the cookie is sent to. If `Domain=example.com` is set, it also applies to subdomains like `api.example.com`. If omitted, it only applies to the exact host that set it.

**`Path`** — restricts the cookie to a specific URL path. `Path=/api` means the browser only sends it on requests to `/api/...`. Defaults to the path of the request that set it.

---

# apiFetch Concept Walkthrough

## What it needs to do

Every API call in the app needs to:

1. Attach `Authorization: Bearer <token>` header
2. Tell the browser to include the cookie (`credentials: 'include'`)
3. If the server returns 401 — silently get a new access token and retry
4. If the retry also fails — give up, clear the token, redirect to `/login`

All of this happens in one wrapper function so no service file needs to care about auth at all.

## The retry flow step by step

```
apiFetch("/jobs")
  │
  ├─ attach Bearer header
  ├─ credentials: 'include'
  │
  ▼
response 401?
  │
  ├─ NO → return response normally
  │
  └─ YES → call /auth/refresh (browser sends cookie automatically)
              │
              ├─ refresh OK → store new access token → retry original request → return
              │
              └─ refresh 401 → clearToken() → redirect to /login → throw
```

## The refresh lock problem

Imagine the user has three TanStack Query hooks firing on page load — `getJobs`, `getJob`, `getDocuments`. All three fire at roughly the same time. The access token has expired. All three get a 401. All three try to call `/auth/refresh`.

**Without a lock:** three refresh calls go out. The first one rotates the token (revokes old, issues new). The second and third try to use the now-revoked token — they get 401 back. The user gets logged out even though their session was valid.

**With a lock:** the first 401 starts a refresh and stores the promise in a module variable. The second and third 401s see that promise already exists and wait on it instead of starting their own. When the first refresh resolves, all three get the new token and retry.

```ts
let refreshPromise: Promise<string> | null = null
```

If `refreshPromise` is null, start a refresh and store the promise. If it's not null, await the existing one. Either way, clear it back to null when done.

## What `credentials: 'include'` does

By default, `fetch()` does not send cookies on cross-origin requests. The frontend runs on `localhost:5173`, the backend on `localhost:7100` — different ports means cross-origin.

`credentials: 'include'` tells the browser: send cookies on this request even though it's cross-origin. This is what makes the httpOnly refresh token cookie get sent to the backend automatically. Without it, `/auth/refresh` would never receive the cookie.

This pairs with `AllowCredentials()` on the backend — both sides must opt in.

## Shape of apiFetch

```ts
apiFetch(input: string, init?: RequestInit): Promise<Response>
```

It's a drop-in replacement for `fetch` — same signature, same return type. So in `jobService.ts`, changing `fetch(url, options)` to `apiFetch(url, options)` is the only edit needed. `handleResponse` and `handleEmptyResponse` stay unchanged — they still receive a `Response` object.

## One edge case: the refresh call itself

When `apiFetch` calls `/auth/refresh` to get a new token, that call must use plain `fetch` — not `apiFetch`. If it used `apiFetch`, a failed refresh would trigger another refresh, which would fail, which would trigger another... infinite loop. The refresh call is the one place that bypasses the wrapper.
