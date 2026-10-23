namespace Reusables.Util;

/// <summary>Next-occurrence math for a daily job pinned to a fixed UTC hour.</summary>
public static class OffPeakSchedule
{
    // Exactly on the hour counts as "already run" — returns the next day's slot, not now.
    // A mid-day restart therefore reschedules to the upcoming slot instead of firing immediately.
    public static DateTimeOffset NextOccurrenceUtc(DateTimeOffset nowUtc, int hourUtc)
    {
        var next = new DateTimeOffset(nowUtc.UtcDateTime.Date, TimeSpan.Zero).AddHours(hourUtc);
        if (next <= nowUtc)
            next = next.AddDays(1);
        return next;
    }
}
