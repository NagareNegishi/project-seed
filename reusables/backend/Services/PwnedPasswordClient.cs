using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;

namespace Reusables.Services;

/// <summary>
/// HIBP Pwned Passwords range-API client. SHA-1s the password, sends only the 5-char prefix, and
/// matches the 35-char suffix against the "SUFFIX:COUNT" response. Free, keyless, k-anonymous.
/// Fails open: any error is logged and reported as 0 occurrences so it cannot block a password set.
/// Register with a base address of https://api.pwnedpasswords.com/ (e.g. via AddHttpClient).
/// </summary>
public class PwnedPasswordClient : IPwnedPasswordClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<PwnedPasswordClient> _logger;

    public PwnedPasswordClient(HttpClient httpClient, ILogger<PwnedPasswordClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<int> GetBreachCountAsync(string password, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(password))
            return 0;

        var (prefix, suffix) = Sha1PrefixSuffix(password);

        try
        {
            var response = await _httpClient.GetAsync($"range/{prefix}", cancellationToken);
            response.EnsureSuccessStatusCode();
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            return ParseBreachCount(body, suffix);
        }
        catch (Exception ex)
        {
            // Defence in depth, not the primary control - HIBP being down must not break registration.
            _logger.LogWarning(ex, "HIBP range lookup failed; treating password as not breached");
            return 0;
        }
    }

    /// <summary>Splits the uppercase SHA-1 hex of the password into the 5-char API prefix and 35-char suffix.</summary>
    internal static (string Prefix, string Suffix) Sha1PrefixSuffix(string password)
    {
        var hash = SHA1.HashData(Encoding.UTF8.GetBytes(password));
        var hex = Convert.ToHexString(hash); // uppercase, matches the API response casing
        return (hex[..5], hex[5..]);
    }

    /// <summary>
    /// Finds <paramref name="suffix"/> in a newline-delimited "SUFFIX:COUNT" range response and returns
    /// its count, or 0 if the suffix is absent or the line is malformed.
    /// </summary>
    internal static int ParseBreachCount(string rangeResponse, string suffix)
    {
        foreach (var line in rangeResponse.Split('\n'))
        {
            var separator = line.IndexOf(':');
            if (separator <= 0)
                continue;

            if (!line.AsSpan(0, separator).Trim().Equals(suffix, StringComparison.OrdinalIgnoreCase))
                continue;

            return int.TryParse(line.AsSpan(separator + 1).Trim(), out var count) ? count : 0;
        }

        return 0;
    }
}
