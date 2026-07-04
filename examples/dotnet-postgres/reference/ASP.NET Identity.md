# ASP.NET Core Identity + JWT — How It Works

The two-layer mode: Identity and JWT are separate concerns that work together.

- **ASP.NET Core Identity** — manages users. Handles password hashing, storing users in your DB, sign-in, lockout, roles, claims. It knows nothing about tokens.
- **JWT Bearer middleware** — validates incoming tokens on every request. It trusts tokens signed with your key.
- **Your /auth/login endpoint** — the glue. Uses Identity to verify credentials, then issues a JWT you construct yourself.

---

## What You Build vs What You Get for Free

**Identity gives you for free:**

- User registration, password hashing (PBKDF2), sign-in, account lockout
- Password reset & email confirmation token generation
- 7 new DB tables (AspNetUsers, AspNetRoles, etc.)
- `UserManager<T>` and `SignInManager<T>` — injectable services for all user operations

**You build yourself:**

- `POST /auth/login` — verify credentials via SignInManager, generate a JWT, return it
- `POST /auth/register` — call `UserManager.CreateAsync()`
- Refresh token logic (store in AspNetUserTokens, rotate on use)
- Email sending (Identity has a no-op sender by default)

---

## The AddIdentityApiEndpoints Shortcut — And Why to Skip It

.NET 8 added `MapIdentityApi<T>` which auto-generates `/login`, `/register`, `/refresh` etc. **Don't use it for this project.** Its tokens are opaque (not real JWTs), can't carry custom claims, and aren't inspectable by the React client. It's a shortcut that creates limitations.

---

## What the React Frontend Does

1. `POST /auth/login` → receive `{ accessToken, refreshToken }`
2. Store tokens (memory or localStorage)
3. Every API request: `Authorization: Bearer <accessToken>` header
4. On 401: call `POST /auth/refresh` → get new tokens, retry

TanStack Query handles this cleanly with an axios/fetch interceptor or a custom query client setup.

---

## Packages Needed

All .NET 10 compatible, versions confirmed.

| Package | What It Adds |
|---------|-------------|
| `Microsoft.AspNetCore.Identity.EntityFrameworkCore` v10.0.5 | Identity + EF Core integration |
| `Microsoft.AspNetCore.Authentication.JwtBearer` v10.0.5 | JWT validation middleware |
| Npgsql (already installed) | No extra Npgsql-Identity package needed |

---

## DB Schema Identity Adds

7 tables prefixed `AspNet*` — `AspNetUsers` is the main one. These get created via a new EF migration after setup, sitting alongside your existing Jobs table.

---

## Key .NET 10 Note

In .NET 10, API controllers now return 401 directly (instead of redirecting to a login page) when unauthenticated. This is the correct behavior for a SPA backend and means less config.

---

## Recommended Approach for This Project

1. Add Identity packages
2. Extend `ApplicationDbContext` from `IdentityDbContext<IdentityUser>`
3. Add migration (gets you the `AspNet*` tables)
4. Register Identity + JWT Bearer in `Program.cs`
5. Write `POST /auth/register` and `POST /auth/login` endpoints
6. Write `POST /auth/refresh` endpoint
7. Add `[Authorize]` to existing controllers
8. Wire up Bearer token header in the React API layer

---

## References & Further Reading

1. **ASP.NET Core Identity (what it is, what it manages):**
   - Microsoft's official intro — covers how Identity works as a membership system, the EF Core integration, and the database tables it creates: [Introduction to Identity on ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity?view=aspnetcore-10.0)
   - The configuration docs cover password policy, lockout settings, and how `IdentityOptions` works: [Configure ASP.NET Core Identity](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-configuration?view=aspnetcore-10.0)

2. **JWT Bearer authentication (what tokens are, how validation works):**
   - Microsoft's JWT Bearer docs explain how tokens encapsulate information for API resources and how the `JwtBearerHandler` validates tokens and extracts user identity from claims: [Configure JWT Bearer Authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-jwt-bearer-authentication?view=aspnetcore-10.0)

**Then, tutorials that combine both (Identity + JWT for an API):**

3. **Code Maze** — a three-part series covering JWT authentication in ASP.NET Core Web API on the server side, front-end integration, and refresh tokens: [code-maze.com/authentication-aspnetcore-jwt-1](https://code-maze.com/authentication-aspnetcore-jwt-1/)

4. **C# Corner walkthrough** — walks through using Identity with JWT end-to-end: setting up `IdentityDbContext`, registering Identity + JWT Bearer in `Program.cs`, and building register/login endpoints with `UserManager` and `SignInManager`: [c-sharpcorner.com — Securing ASP.NET Core APIs with Identity and JWT](https://www.c-sharpcorner.com/article/securing-asp-net-core-apis-with-identity-and-jwt/)

5. **codewithmukesh** — a detailed guide covering registration, token generation, secured endpoints, adding roles, and role-based authorization, described as close to production-ready: [codewithmukesh.com/blog/aspnet-core-api-with-jwt-authentication](https://codewithmukesh.com/blog/aspnet-core-api-with-jwt-authentication/)


**For understanding JWT (the concept itself):**

- **[jwt.io/introduction](https://jwt.io/introduction)** — the official JWT site explains what a JWT is, how it's structured (header, payload, signature), how tokens are sent in the Authorization header using the Bearer schema, and how the server validates them. Short, visual, and to the point. Also has a live decoder where you can paste a token and see the parts.

- **[freeCodeCamp — The JSON Web Token Handbook](https://www.freecodecamp.org/news/the-json-web-token-handbook-learn-to-use-jwts-for-web-authentication/)** — starts from *why* tokens exist (HTTP is stateless, so every request needs to carry its own proof of identity), then walks through the three parts of a JWT and explains that the signature is simply a hash of the header + payload using a secret key kept on the server. Has a companion video too.

- **[DEV.to — JWT explained in 4 minutes (with visuals)](https://dev.to/jaypmedia/jwt-explained-in-4-minutes-with-visuals-g3n)** — a quick visual explainer covering the three parts (header, payload, signature), that JWTs are encoded not encrypted, and why they're signed with a secret key known only to the server. Great if you just want the mental model fast.

**For understanding ASP.NET Core Identity (what it actually does):**

- **[Dot Net Tutorials — ASP.NET Core Identity course](https://dotnettutorials.net/course/asp-net-core-identity-tutorials/)** — explains Identity as a membership system, then walks through each piece: `UserManager` handles creating users, enforcing password policies, hashing passwords, managing reset tokens, and locking accounts after failed logins. `RoleManager` handles roles. Step-by-step with a single project throughout. Much more "here's what this does and why" than the Microsoft docs.

- **[TekTutorialsHub — ASP.NET Core Identity Tutorial](https://www.tektutorialshub.com/asp-net-core/asp-net-core-identity-tutorial/)** — builds Identity from scratch without using the template, adding registration, login, and logout forms manually so you actually understand what the API is doing. This is the "learn by building" approach.

**For the full picture (Identity + JWT wired together):**

- **[Code Maze — JWT Authentication series](https://code-maze.com/authentication-aspnetcore-jwt-1/)** — a three-part series: part one covers JWT auth in ASP.NET Core Web API, part two covers frontend integration, and part three covers refresh tokens. Each part explains *why* before showing code.
