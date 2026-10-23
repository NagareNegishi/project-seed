namespace Reusables.Util;

// Generalized from the app's CloudflareRequestCountryResolver - takes the raw header value instead
// of an HttpContext (pull CF-IPCountry, or your edge provider's equivalent, out of the request
// yourself), and takes the "no signal" placeholder codes as a parameter since each provider picks
// its own (Cloudflare: XX, T1).

/// <summary>Parses an edge-CDN "country" header value into an ISO 3166-1 alpha-2 code.</summary>
public static class EdgeCountryHeader
{
    private static readonly string[] DefaultNoSignalCodes = ["XX", "T1"];

    /// <summary>Returns the upper-cased two-letter code, or null when there's no usable signal.</summary>
    public static string? Parse(string? headerValue, IReadOnlyCollection<string>? noSignalCodes = null)
    {
        var value = (headerValue ?? "").Trim().ToUpperInvariant();
        if (value.Length != 2 || !value.All(char.IsAsciiLetterUpper))
            return null;

        return (noSignalCodes ?? DefaultNoSignalCodes).Contains(value) ? null : value;
    }
}
