using Reusables.Util;

namespace Reusables.Tests.Util;

public class OffPeakScheduleTests
{
    [Fact]
    public void NextOccurrenceUtc_BeforeTodaysSlot_ReturnsToday()
    {
        var now = new DateTimeOffset(2026, 3, 5, 10, 0, 0, TimeSpan.Zero);
        var next = OffPeakSchedule.NextOccurrenceUtc(now, hourUtc: 15);

        Assert.Equal(new DateTimeOffset(2026, 3, 5, 15, 0, 0, TimeSpan.Zero), next);
    }

    [Fact]
    public void NextOccurrenceUtc_AfterTodaysSlot_ReturnsTomorrow()
    {
        var now = new DateTimeOffset(2026, 3, 5, 20, 0, 0, TimeSpan.Zero);
        var next = OffPeakSchedule.NextOccurrenceUtc(now, hourUtc: 15);

        Assert.Equal(new DateTimeOffset(2026, 3, 6, 15, 0, 0, TimeSpan.Zero), next);
    }

    [Fact]
    public void NextOccurrenceUtc_ExactlyOnTheSlot_CountsAsAlreadyRun()
    {
        var now = new DateTimeOffset(2026, 3, 5, 15, 0, 0, TimeSpan.Zero);
        var next = OffPeakSchedule.NextOccurrenceUtc(now, hourUtc: 15);

        Assert.Equal(new DateTimeOffset(2026, 3, 6, 15, 0, 0, TimeSpan.Zero), next);
    }
}
