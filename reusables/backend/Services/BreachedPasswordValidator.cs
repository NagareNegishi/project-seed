using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace Reusables.Services;

// Generalized from the app's BreachedPasswordValidator - ApplicationUser became the generic TUser
// ASP.NET Identity already expects, and the app's AuthConfig.BreachOccurrenceThreshold became a
// plain int the caller supplies.

/// <summary>
/// Identity password validator that rejects a new password whose breach-occurrence count (from an
/// <see cref="IPwnedPasswordClient"/> or similar) meets the configured threshold. Register it
/// alongside Identity's built-in validators to cover every password-set path - create, change,
/// reset - with one registration.
/// </summary>
public class BreachedPasswordValidator<TUser> : IPasswordValidator<TUser> where TUser : class
{
    private readonly IPwnedPasswordClient _client;
    private readonly int _breachOccurrenceThreshold;
    private readonly ILogger _logger;

    public BreachedPasswordValidator(IPwnedPasswordClient client, int breachOccurrenceThreshold, ILogger logger)
    {
        _client = client;
        _breachOccurrenceThreshold = breachOccurrenceThreshold;
        _logger = logger;
    }

    public async Task<IdentityResult> ValidateAsync(UserManager<TUser> manager, TUser user, string? password)
    {
        if (string.IsNullOrEmpty(password))
            return IdentityResult.Success;

        try
        {
            var count = await _client.GetBreachCountAsync(password);
            if (count >= _breachOccurrenceThreshold)
                return IdentityResult.Failed(new IdentityError
                {
                    Code = "PwnedPassword",
                    Description = "This password has appeared in a known data breach. Please choose a different one."
                });
        }
        catch (Exception ex)
        {
            // Fail open - a lookup failure must not block a legitimate password set.
            _logger.LogWarning(ex, "Breached-password check failed open");
        }

        return IdentityResult.Success;
    }
}
