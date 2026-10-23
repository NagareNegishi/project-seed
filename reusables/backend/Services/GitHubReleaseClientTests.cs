using System.Net;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Reusables.Services;

namespace Reusables.Tests.Services;

public class GitHubReleaseClientTests
{
    private class StubHandler : HttpMessageHandler
    {
        public int CallCount { get; private set; }
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _respond;
        public StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) => _respond = respond;

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            CallCount++;
            return Task.FromResult(_respond(request));
        }
    }

    private static GitHubReleaseClient MakeClient(StubHandler handler, out IMemoryCache cache)
    {
        cache = new MemoryCache(new MemoryCacheOptions());
        var httpClient = new HttpClient(handler);
        return new GitHubReleaseClient(httpClient, cache, NullLogger<GitHubReleaseClient>.Instance, userAgent: "TestAgent");
    }

    private static HttpResponseMessage JsonResponse(string json) => new(HttpStatusCode.OK)
    {
        Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json")
    };

    [Fact]
    public async Task GetLatestReleaseAsync_FetchesAndMapsTheRelease()
    {
        var handler = new StubHandler(req =>
        {
            Assert.Equal("repos/owner/repo/releases/latest", req.RequestUri!.AbsolutePath.TrimStart('/'));
            return JsonResponse("""{"tag_name":"v1.2.3","assets":[{"name":"app.msi","browser_download_url":"https://example.com/app.msi"}]}""");
        });
        var client = MakeClient(handler, out _);

        var release = await client.GetLatestReleaseAsync("owner", "repo", "cache-key", TimeSpan.FromMinutes(5));

        Assert.Equal("v1.2.3", release.TagName);
        Assert.Equal("app.msi", release.Assets.Single().Name);
    }

    [Fact]
    public async Task GetLatestReleaseAsync_SecondCallWithinTtl_ReturnsCachedWithoutRefetching()
    {
        var handler = new StubHandler(_ => JsonResponse("""{"tag_name":"v1.0.0","assets":[]}"""));
        var client = MakeClient(handler, out _);

        await client.GetLatestReleaseAsync("owner", "repo", "cache-key", TimeSpan.FromMinutes(5));
        await client.GetLatestReleaseAsync("owner", "repo", "cache-key", TimeSpan.FromMinutes(5));

        Assert.Equal(1, handler.CallCount);
    }

    [Fact]
    public async Task GetLatestReleaseAsync_HttpFailure_Throws()
    {
        var handler = new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.NotFound));
        var client = MakeClient(handler, out _);

        await Assert.ThrowsAsync<HttpRequestException>(
            () => client.GetLatestReleaseAsync("owner", "repo", "cache-key", TimeSpan.FromMinutes(5)));
    }
}
