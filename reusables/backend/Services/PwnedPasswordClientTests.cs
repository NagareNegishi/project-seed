using System.Net;
using Microsoft.Extensions.Logging.Abstractions;
using Reusables.Services;

namespace Reusables.Tests.Services;

public class PwnedPasswordClientTests
{
    private class StubHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _respond;
        public StubHandler(Func<HttpRequestMessage, HttpResponseMessage> respond) => _respond = respond;

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(_respond(request));
    }

    private static PwnedPasswordClient MakeClient(Func<HttpRequestMessage, HttpResponseMessage> respond)
    {
        var httpClient = new HttpClient(new StubHandler(respond)) { BaseAddress = new Uri("https://api.pwnedpasswords.com/") };
        return new PwnedPasswordClient(httpClient, NullLogger<PwnedPasswordClient>.Instance);
    }

    [Fact]
    public async Task GetBreachCountAsync_SuffixFoundInRangeResponse_ReturnsItsCount()
    {
        var (prefix, suffix) = PwnedPasswordClient.Sha1PrefixSuffix("password123");
        var client = MakeClient(req =>
        {
            Assert.Equal($"range/{prefix}", req.RequestUri!.AbsolutePath.TrimStart('/'));
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent($"{suffix}:42\nOTHERSUFFIX:1")
            };
        });

        Assert.Equal(42, await client.GetBreachCountAsync("password123"));
    }

    [Fact]
    public async Task GetBreachCountAsync_SuffixNotInResponse_ReturnsZero()
    {
        var client = MakeClient(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("SOMEOTHERSUFFIX:5")
        });

        Assert.Equal(0, await client.GetBreachCountAsync("some-password"));
    }

    [Fact]
    public async Task GetBreachCountAsync_HttpFailure_FailsOpenToZero()
    {
        var client = MakeClient(_ => new HttpResponseMessage(HttpStatusCode.InternalServerError));

        Assert.Equal(0, await client.GetBreachCountAsync("some-password"));
    }

    [Fact]
    public async Task GetBreachCountAsync_EmptyPassword_ReturnsZeroWithoutCallingApi()
    {
        var called = false;
        var client = MakeClient(_ => { called = true; return new HttpResponseMessage(HttpStatusCode.OK); });

        Assert.Equal(0, await client.GetBreachCountAsync(""));
        Assert.False(called);
    }

    [Theory]
    [InlineData("ABC123:10", "ABC123", 10)]
    [InlineData("abc123:10", "ABC123", 10)]
    [InlineData("XYZ:notanumber", "XYZ", 0)]
    [InlineData("no-colon-here", "XYZ", 0)]
    public void ParseBreachCount_ParsesOrDefaultsTo0(string rangeResponse, string suffix, int expected)
    {
        Assert.Equal(expected, PwnedPasswordClient.ParseBreachCount(rangeResponse, suffix));
    }

    [Fact]
    public void Sha1PrefixSuffix_SplitsIntoFiveAndThirtyFiveChars()
    {
        var (prefix, suffix) = PwnedPasswordClient.Sha1PrefixSuffix("password123");

        Assert.Equal(5, prefix.Length);
        Assert.Equal(35, suffix.Length);
        Assert.Equal(prefix + suffix, Convert.ToHexString(System.Security.Cryptography.SHA1.HashData(System.Text.Encoding.UTF8.GetBytes("password123"))));
    }
}
