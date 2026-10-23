using System.Security.Claims;

namespace Reusables.Extensions;

// Generalized from the app's ClaimsPrincipalExtensions - a Tier()/IsDemo() pair reading
// app-specific claims was left behind; add your own claim readers alongside these.
public static class ClaimsPrincipalExtensions
{
    // The JWT sub claim - always present under [Authorize].
    public static string GetUserId(this ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.NameIdentifier)!;

    // The JWT email claim - always present under [Authorize] (set at token mint).
    public static string GetEmail(this ClaimsPrincipal user) =>
        user.FindFirstValue(ClaimTypes.Email)!;
}
