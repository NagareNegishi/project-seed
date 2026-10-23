using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Reusables.Util;

namespace Reusables.Tests.Util;

public class LlmJsonResponseHelperTests
{
    // Captures formatted log messages so tests can assert a warning fired, without a mocking library.
    private sealed class CapturingLogger : ILogger
    {
        public List<string> Messages { get; } = new();

        public IDisposable BeginScope<TState>(TState state) where TState : notnull => NullScope.Instance;
        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
            Func<TState, Exception?, string> formatter) => Messages.Add(formatter(state, exception));

        private sealed class NullScope : IDisposable
        {
            public static readonly NullScope Instance = new();
            public void Dispose() { }
        }
    }

    private record SampleDto(
        [property: JsonPropertyName("name")] string Name,
        [property: JsonPropertyName("age")] int Age);

    [Fact]
    public void ExtractJson_ReturnsTheObject_WhenRawIsAlreadyJson()
    {
        var logger = new CapturingLogger();
        var json = LlmJsonResponseHelper.ExtractJson("{\"name\":\"Ada\"}", logger, "test");

        Assert.Equal("{\"name\":\"Ada\"}", json);
        Assert.Empty(logger.Messages);
    }

    [Fact]
    public void ExtractJson_StripsProseAroundTheObject_AndLogsAWarning()
    {
        var logger = new CapturingLogger();
        var json = LlmJsonResponseHelper.ExtractJson(
            "Sure, here is the JSON you asked for:\n{\"name\":\"Ada\"}\nLet me know if you need anything else!",
            logger, "test");

        Assert.Equal("{\"name\":\"Ada\"}", json);
        Assert.Contains(logger.Messages, m => m.Contains("text outside JSON"));
    }

    [Fact]
    public void ExtractJson_WithNoObjectAtAll_FallsBackToEmptyObject_AndLogsAWarning()
    {
        var logger = new CapturingLogger();
        var json = LlmJsonResponseHelper.ExtractJson("Sorry, I can't help with that.", logger, "test");

        Assert.Equal("{}", json);
        Assert.Contains(logger.Messages, m => m.Contains("no JSON object"));
    }

    [Fact]
    public void LogContractIssues_WarnsOnUnknownAndNullKeys_ButNotKnownNonNullKeys()
    {
        var logger = new CapturingLogger();
        var knownKeys = LlmJsonResponseHelper.GetKnownKeys<SampleDto>();

        LlmJsonResponseHelper.LogContractIssues(
            "{\"name\":\"Ada\",\"age\":null,\"extra\":true}", knownKeys, logger, "test");

        Assert.Contains(logger.Messages, m => m.Contains("Unexpected key") && m.Contains("extra"));
        Assert.Contains(logger.Messages, m => m.Contains("field is null") && m.Contains("age"));
        Assert.DoesNotContain(logger.Messages, m => m.Contains("name"));
    }

    [Fact]
    public void LogContractIssues_OnUnparseableJson_DoesNotThrow()
    {
        var logger = new CapturingLogger();
        var knownKeys = LlmJsonResponseHelper.GetKnownKeys<SampleDto>();

        var exception = Record.Exception(() =>
            LlmJsonResponseHelper.LogContractIssues("not json", knownKeys, logger, "test"));

        Assert.Null(exception);
    }

    [Fact]
    public void GetKnownKeys_ReadsJsonPropertyNames()
    {
        var keys = LlmJsonResponseHelper.GetKnownKeys<SampleDto>();

        Assert.Equal(new HashSet<string> { "name", "age" }, keys);
    }
}
