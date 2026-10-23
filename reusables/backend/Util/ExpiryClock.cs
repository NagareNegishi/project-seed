namespace Reusables.Util;

// Generalized from the app's PurgeClock - the anchor (which fields to consider, e.g.
// "max of LastLoginAt/MovedToFreeAt") is app-specific; compute it yourself and pass it in.

/// <summary>Shared expiry-clock math: an expiry date derived from an anchor, and a reminder window before it.</summary>
public static class ExpiryClock
{
    /// <summary>Expiry date `monthsUntilExpiry` after `anchor`; null when there's no anchor to expire from.</summary>
    public static DateOnly? ComputeExpiryDate(DateTime? anchor, int monthsUntilExpiry) =>
        anchor is null ? null : DateOnly.FromDateTime(anchor.Value.AddMonths(monthsUntilExpiry));

    /// <summary>True from the first reminder onward (`reminderWindowDays` out or closer).</summary>
    public static bool IsInReminderWindow(DateOnly expiryDate, DateOnly today, int reminderWindowDays) =>
        expiryDate.DayNumber - today.DayNumber <= reminderWindowDays;
}
