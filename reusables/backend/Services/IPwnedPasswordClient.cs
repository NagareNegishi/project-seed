namespace Reusables.Services;

/// <summary>Looks up how many times a password appears in the Have I Been Pwned breach corpus.</summary>
public interface IPwnedPasswordClient
{
    /// <summary>
    /// Returns the breach-occurrence count for the password via the HIBP range API (k-anonymity:
    /// only the first 5 SHA-1 hex characters leave the process). 0 means "not found". Implementations
    /// fail open - a network or API error returns 0, it does not throw.
    /// </summary>
    Task<int> GetBreachCountAsync(string password, CancellationToken cancellationToken = default);
}
