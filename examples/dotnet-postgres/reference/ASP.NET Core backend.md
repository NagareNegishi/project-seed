# ASP.NET Core Backend — Decisions & Patterns

## Enum validation: `JsonStringEnumConverter` with `allowIntegerValues: false`

**The chain:**

```
Request JSON → System.Text.Json deserializer → JsonStringEnumConverter rejects unknown value → ModelState invalid → [ApiController] returns 400
```

Invalid enum strings are rejected before controller code runs. The `[ApiController]` attribute automatically returns HTTP 400 on invalid model state — no manual `ModelState.IsValid` checks needed.

**Implementation in `Program.cs`:**

```csharp
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter(allowIntegerValues: false)
        );
    });
```

One registration covers all enums across all DTOs.

**References:**
- [Model Binding in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/mvc/models/model-binding?view=aspnetcore-10.0)
- [Customize property names with System.Text.Json](https://learn.microsoft.com/en-us/dotnet/standard/serialization/system-text-json/customize-properties)
- [Model validation in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/mvc/models/validation?view=aspnetcore-10.0)

---

## `AllowedHosts` — Why it matters

`AllowedHosts: "*"` in `appsettings.json` means the ASP.NET backend will respond to requests with *any* `Host` header. An attacker can send a request with a forged `Host` header (e.g. `evil.com`), and if the app uses that value to generate links — password reset emails, redirects — it could point users to a malicious site. Locking this to the actual domain means the backend rejects requests that don't match.

In production this is set in `appsettings.Production.json`. In development `"*"` is acceptable since the backend is not publicly reachable.

---

## Security headers — where each lives in this architecture

This project has two layers (Nginx in front, ASP.NET behind), and security headers split accordingly:

**Nginx** handles all browser-facing response headers — HSTS, CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. These go in `nginx.conf` as `add_header` directives. See Step 6 in `docs/Production build plan.md` for the full list and values.

**ASP.NET** handles `AllowedHosts` — this is request validation on the backend side, not a response header, so it belongs in the app config rather than Nginx.

The backend container never sees HTTPS at all — it only receives internal HTTP from Nginx over the Docker network. SSL terminates at Nginx.

---

## Testing with xUnit

Tests in this project use an in-memory EF Core database (unique `Guid` per test class), controllers instantiated directly (no HTTP pipeline), and Moq for `IStorageService`. See `JobTrackerApi.Tests/` for examples.

**xUnit concept map** — for reference if coming from another framework:

| Purpose | xUnit | JUnit | Jest |
|---|---|---|---|
| Single test | `[Fact]` | `@Test` | `test()` / `it()` |
| Parameterised test | `[Theory]` | `@ParameterizedTest` | `test.each()` |
| Inline data | `[InlineData(...)]` | `@ValueSource` / `@CsvSource` | template literal in `test.each` |
| Skip a test | `[Fact(Skip="reason")]` | `@Disabled` | `test.skip()` |
| Before each test | Constructor | `@BeforeEach` | `beforeEach()` |
| After each test | `Dispose()` / `IDisposable` | `@AfterEach` | `afterEach()` |
| Before all tests | `IClassFixture<T>` | `@BeforeAll` | `beforeAll()` |
| Group tests | Class | Class / `@Nested` | `describe()` |
| Expected exception | `Assert.Throws<T>()` | `assertThrows()` | `expect().toThrow()` |
| Async test | `async Task` return type | `@Test` + `CompletableFuture` | `async/await` natively |

**References:**
- [Unit testing C# with xUnit](https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-csharp-with-xunit) — `[Fact]`, `[Theory]`, `[InlineData]`, `dotnet test`
- [Test controller logic in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/mvc/controllers/testing?view=aspnetcore-9.0) — unit testing controllers with Moq, in isolation from filters/routing/model binding
