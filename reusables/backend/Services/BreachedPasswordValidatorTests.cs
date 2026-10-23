using Microsoft.Extensions.Logging.Abstractions;
using Reusables.Services;

namespace Reusables.Tests.Services;

public class BreachedPasswordValidatorTests
{
    private class TestUser { }

    private class StubPwnedPasswordClient : IPwnedPasswordClient
    {
        private readonly Func<int> _count;
        public StubPwnedPasswordClient(Func<int> count) => _count = count;
        public StubPwnedPasswordClient(int count) : this(() => count) { }

        public Task<int> GetBreachCountAsync(string password, CancellationToken cancellationToken = default) =>
            Task.FromResult(_count());
    }

    private static BreachedPasswordValidator<TestUser> MakeValidator(int breachCount, int threshold = 1) =>
        new(new StubPwnedPasswordClient(breachCount), breachOccurrenceThreshold: threshold, NullLogger.Instance);

    [Fact]
    public async Task ValidateAsync_CountBelowThreshold_Succeeds()
    {
        var validator = MakeValidator(breachCount: 0, threshold: 1);

        var result = await validator.ValidateAsync(null!, new TestUser(), "some-password");

        Assert.True(result.Succeeded);
    }

    [Fact]
    public async Task ValidateAsync_CountAtThreshold_Fails()
    {
        var validator = MakeValidator(breachCount: 1, threshold: 1);

        var result = await validator.ValidateAsync(null!, new TestUser(), "some-password");

        Assert.False(result.Succeeded);
        Assert.Equal("PwnedPassword", result.Errors.Single().Code);
    }

    [Fact]
    public async Task ValidateAsync_NullOrEmptyPassword_SucceedsWithoutCallingClient()
    {
        var validator = new BreachedPasswordValidator<TestUser>(
            new StubPwnedPasswordClient(() => throw new InvalidOperationException("should not be called")),
            breachOccurrenceThreshold: 1,
            NullLogger.Instance);

        Assert.True((await validator.ValidateAsync(null!, new TestUser(), null)).Succeeded);
        Assert.True((await validator.ValidateAsync(null!, new TestUser(), "")).Succeeded);
    }

    [Fact]
    public async Task ValidateAsync_ClientThrows_FailsOpenToSuccess()
    {
        var client = new StubPwnedPasswordClient(() => throw new HttpRequestException("down"));
        var validator = new BreachedPasswordValidator<TestUser>(client, breachOccurrenceThreshold: 1, NullLogger.Instance);

        var result = await validator.ValidateAsync(null!, new TestUser(), "some-password");

        Assert.True(result.Succeeded);
    }
}
