# Refresh Tokens

## Key Concepts

1. **Two tokens, two jobs**
   - Access token (JWT, 15min) — stateless, proves identity on every request. Short expiry limits damage if stolen.
   - Refresh token (opaque GUID, 7 days) — stored in DB, only used to get a new access token. Can be revoked server-side.

2. **`jti` claim — JWT ID**
   A unique GUID added to every access token. Enables future blacklisting if needed and ties a specific access token to a refresh token issuance event.

3. **Refresh token rotation**
   Every time a refresh token is used, a new one is issued and the old one is revoked. This limits the window of a stolen refresh token — if an attacker uses it first, the real user's next silent refresh fails and forces re-login.

4. **The flow**
   ```
   Login → access token (15min) + refresh token (7 days)
            ↓
   Access token expires → POST /auth/refresh with refresh token
            ↓
   Server: validates refresh token in DB, revokes it, issues new pair
            ↓
   Logout → POST /auth/logout, revokes refresh token in DB
   ```

---

## How the Two Tokens Work Together

The access token is like a short-lived building pass — stateless, no database lookup needed, but expires fast on purpose. If stolen, the attacker only has 15 minutes.

The refresh token is like a receipt proving the pass was paid for. It lives in the database so it can be revoked at any time. It lasts 7 days but is *only* used for one thing: getting a fresh access token when the old one expires. It never goes to the `/jobs` or `/documents` endpoints.

## Why Rotation Matters

Every time a refresh token is used, the server issues a *brand new* one and revokes the old one:

```
Login → access token A + refresh token 1
Token A expires → client sends refresh token 1 → server revokes token 1, returns access token B + refresh token 2
... repeats until refresh token N expires after 7 days → user must log in again
```

**Security benefit:** If an attacker steals refresh token 1 and uses it before the legitimate user does, they get token 2 and the legitimate user's token 1 gets revoked. When the real user tries to use token 1, it fails — that failure signals the session was compromised and forces re-login. Without rotation, a stolen refresh token would work silently for the full 7 days.

---

## Implementation (completed)

Five things were added — recorded here for context:

- **R1** — `RefreshToken` table: columns `Token` (random GUID), `UserId`, `ExpiresAt`, `RevokedAt` (nullable — null means active)
- **R2** — EF migration to create the table in PostgreSQL
- **R3** — Login endpoint updated: returns `{ accessToken, refreshToken }`, access token gets a `jti` claim, expiry reduced to 15 minutes
- **R4** — `/auth/refresh` endpoint: validates token in DB, revokes it, issues new pair
- **R5** — `/auth/logout` endpoint: marks refresh token revoked; access token naturally expires within 15 minutes

**The `jti` claim** is a unique GUID stamped into each access token. Not strictly required, but provides a hook to blacklist specific access tokens in the future (e.g. revoke an exact session immediately rather than waiting 15 minutes for expiry).
