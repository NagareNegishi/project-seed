using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Reusables.Util;

namespace Reusables.Services;

// Generalized from three near-identical background services in the app (daily AI-usage-count
// reset, inactivity purge, refresh-token cleanup), each hand-rolling this same wait loop around
// Util.OffPeakSchedule with its own try/catch. Subclass and implement RunAsync with the day's work.

/// <summary>
/// Wakes once daily at a fixed UTC hour and runs one unit of work. An exception from that work is
/// caught and logged; the loop still wakes for the next day's run.
/// </summary>
public abstract class DailyUtcBackgroundService : BackgroundService
{
    private readonly int _hourUtc;
    private readonly ILogger _logger;

    protected DailyUtcBackgroundService(int hourUtc, ILogger logger)
    {
        _hourUtc = hourUtc;
        _logger = logger;
    }

    /// <summary>The day's unit of work.</summary>
    protected abstract Task RunAsync(CancellationToken stoppingToken);

    // Seam for tests: production waits for the real next UTC slot; a test can return immediately
    // and drive iteration count through stoppingToken instead of the wall clock.
    protected virtual Task WaitForNextSlotAsync(CancellationToken stoppingToken)
    {
        var next = OffPeakSchedule.NextOccurrenceUtc(DateTimeOffset.UtcNow, _hourUtc);
        return Task.Delay(next - DateTimeOffset.UtcNow, stoppingToken);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await WaitForNextSlotAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            try
            {
                await RunAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Daily background run failed.");
            }
        }
    }
}
