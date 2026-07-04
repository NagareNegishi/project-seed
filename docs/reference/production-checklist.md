# Production Checklist

Generic step order for taking an app to production. Extracted from the
Job-Application-Tracker production build; details for a worked .NET/AWS example
live in that repo's `docs/plans/production-build.md`.

1. **Auth** — token strategy, refresh flow, email verification.
2. **Infrastructure** — compute, database, object storage, DNS. Record choices in `docs/stack-decisions`-style doc.
3. **Production config** — prod settings file + `.env.example` documenting every deploy-time env var; fail-fast startup validation for required keys.
4. **Logging** — global exception handler + structured logs to stdout.
5. **Health check** — anonymous `/health` endpoint with a DB connectivity check; container `HEALTHCHECK` pings it.
6. **Security headers** — nosniff, frame denial, referrer policy, permissions policy, CSP; lock `AllowedHosts` to the real domain. Keep all headers at one level (nginx: `add_header` in a `location {}` drops server-level headers).
7. **CI/CD** — pipeline: test → build+push images → deploy. Build on CI runners, pull on the host.
8. **DB migrations in CI** — migration job between build and deploy; failed migration stops the pipeline.
9. **First deploy** — expect case-sensitivity and env-var substitution issues; add manual trigger (`workflow_dispatch`).
10. **SSL** — certbot standalone or Caddy; auto-renewal; HSTS header in the HTTPS block only.
11. **Rate limiting** — per-IP policies on auth endpoints only; tighter limits on endpoints that send email.
12. **Monitoring** — defer until real traffic; structured logs + health check + cert-expiry emails cover a low-traffic app.
