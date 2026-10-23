using Reusables.Util;

namespace Reusables.Tests.Util;

public class ExpiryClockTests
{
    [Fact]
    public void ComputeExpiryDate_WithNoAnchor_IsNull()
    {
        Assert.Null(ExpiryClock.ComputeExpiryDate(null, monthsUntilExpiry: 6));
    }

    [Fact]
    public void ComputeExpiryDate_AddsMonthsToTheAnchor()
    {
        var anchor = new DateTime(2026, 1, 15);
        var expiry = ExpiryClock.ComputeExpiryDate(anchor, monthsUntilExpiry: 6);

        Assert.Equal(new DateOnly(2026, 7, 15), expiry);
    }

    [Theory]
    [InlineData(2026, 6, 15, true)]  // 16 days out - comfortably in the window
    [InlineData(2026, 6, 1, true)]   // exactly 30 days out - boundary, in the window
    [InlineData(2026, 5, 31, false)] // 31 days out - not yet
    public void IsInReminderWindow_ChecksDaysUntilExpiry(int year, int month, int day, bool expected)
    {
        var expiryDate = new DateOnly(2026, 7, 1);
        var today = new DateOnly(year, month, day);

        Assert.Equal(expected, ExpiryClock.IsInReminderWindow(expiryDate, today, reminderWindowDays: 30));
    }
}
