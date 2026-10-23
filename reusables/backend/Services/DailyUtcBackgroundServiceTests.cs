using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Reusables.Services;

namespace Reusables.Tests.Services;

public class DailyUtcBackgroundServiceTests
{
    // Overrides the real wall-clock wait so the loop spins on RunAsync immediately - the test
    // drives iteration count itself instead of waiting for a real daily slot.
    private class ImmediateWaitService : DailyUtcBackgroundService
    {
        private readonly Func<CancellationToken, Task> _run;
        public ImmediateWaitService(Func<CancellationToken, Task> run, ILogger logger) : base(hourUtc: 0, logger) => _run = run;

        protected override Task WaitForNextSlotAsync(CancellationToken stoppingToken) => Task.CompletedTask;
        protected override Task RunAsync(CancellationToken stoppingToken) => _run(stoppingToken);
    }

    private class CapturingLogger : ILogger
    {
        public List<string> Errors { get; } = [];
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            if (logLevel == LogLevel.Error)
                Errors.Add(formatter(state, exception));
        }
    }

    [Fact]
    public async Task ExecuteAsync_RunThrows_LoopContinuesToNextRun()
    {
        var runCount = 0;
        var thirdRun = new TaskCompletionSource();
        var service = new ImmediateWaitService(_ =>
        {
            runCount++;
            if (runCount == 1) throw new InvalidOperationException("boom");
            if (runCount == 3) thirdRun.TrySetResult();
            return Task.CompletedTask;
        }, NullLogger.Instance);

        await service.StartAsync(CancellationToken.None);
        await thirdRun.Task.WaitAsync(TimeSpan.FromSeconds(5));
        await service.StopAsync(CancellationToken.None);

        Assert.True(runCount >= 3);
    }

    [Fact]
    public async Task ExecuteAsync_RunThrows_LogsError()
    {
        var logger = new CapturingLogger();
        var logged = new TaskCompletionSource();
        var service = new ImmediateWaitService(_ =>
        {
            throw new InvalidOperationException("boom");
        }, logger);

        // Poll briefly for the async log write rather than assuming a fixed delay is enough.
        _ = Task.Run(async () =>
        {
            while (logger.Errors.Count == 0) await Task.Delay(5);
            logged.TrySetResult();
        });

        await service.StartAsync(CancellationToken.None);
        await logged.Task.WaitAsync(TimeSpan.FromSeconds(5));
        await service.StopAsync(CancellationToken.None);

        Assert.Contains(logger.Errors, m => m.Contains("Daily background run failed"));
    }
}
