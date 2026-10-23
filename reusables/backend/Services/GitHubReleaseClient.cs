using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Reusables.Services;

// Generalized from the app's DesktopReleaseService - only the "fetch the latest release from
// GitHub, cache it with a TTL" shell. Picking platform-specific assets out of the release was
// app-specific (installer filename conventions) and stays behind; read Assets yourself.

/// <summary>Fetches and caches the latest GitHub release for a repo via the public Releases API.</summary>
public class GitHubReleaseClient
{
    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<GitHubReleaseClient> _logger;

    public GitHubReleaseClient(HttpClient httpClient, IMemoryCache cache, ILogger<GitHubReleaseClient> logger, string userAgent)
    {
        _httpClient = httpClient;
        _cache = cache;
        _logger = logger;

        _httpClient.BaseAddress = new Uri("https://api.github.com/");
        // GitHub API rejects requests with no User-Agent
        _httpClient.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue(userAgent, "1.0"));
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/vnd.github+json"));
    }

    /// <summary>Returns the cached release when <paramref name="cacheKey"/> is still within its TTL, else fetches and re-caches it.</summary>
    public async Task<GitHubRelease> GetLatestReleaseAsync(string owner, string repo, string cacheKey, TimeSpan cacheTtl)
    {
        if (_cache.TryGetValue(cacheKey, out GitHubRelease? cached) && cached is not null)
            return cached;

        GitHubRelease release;
        try
        {
            var response = await _httpClient.GetAsync($"repos/{owner}/{repo}/releases/latest");
            response.EnsureSuccessStatusCode();

            release = await response.Content.ReadFromJsonAsync<GitHubRelease>()
                ?? throw new InvalidOperationException("GitHub returned an empty release payload.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to fetch latest release for {Owner}/{Repo} from GitHub.", owner, repo);
            throw;
        }

        _cache.Set(cacheKey, release, cacheTtl);
        return release;
    }
}

public record GitHubReleaseAsset(
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("browser_download_url")] string BrowserDownloadUrl);

public record GitHubRelease(
    [property: JsonPropertyName("tag_name")] string TagName,
    [property: JsonPropertyName("assets")] List<GitHubReleaseAsset> Assets);
