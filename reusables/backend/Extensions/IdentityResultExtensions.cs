using Microsoft.AspNetCore.Identity;

namespace Reusables.Extensions;

public static class IdentityResultExtensions
{
    // Joins Identity's per-error descriptions into one user-facing string
    public static string ToErrorMessage(this IdentityResult result) =>
        string.Join(" ", result.Errors.Select(e => e.Description));
}
