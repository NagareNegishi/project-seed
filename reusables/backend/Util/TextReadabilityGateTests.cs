using Microsoft.Extensions.Logging.Abstractions;
using Reusables.Util;

namespace Reusables.Tests.Util;

public class TextReadabilityGateTests
{
    private const string ReadableProse =
        "The quick brown fox jumps over the lazy dog. This paragraph exists purely to give the " +
        "readability gate a page of ordinary English prose to measure, with plenty of whitespace " +
        "between words and no unusual characters of any kind, repeated a few times so the total " +
        "character mass is large enough for the ratio-based thresholds to behave sensibly. " +
        "The quick brown fox jumps over the lazy dog, over and over, for good measure.";

    [Fact]
    public void CheckReadability_OnOrdinaryProse_IsReadable()
    {
        var result = TextReadabilityGate.CheckReadability([ReadableProse], NullLogger.Instance);

        Assert.Equal(TextReadabilityGate.Result.Readable, result);
    }

    [Fact]
    public void CheckReadability_OnNoPages_IsNoText()
    {
        var result = TextReadabilityGate.CheckReadability([], NullLogger.Instance);

        Assert.Equal(TextReadabilityGate.Result.NoText, result);
    }

    [Fact]
    public void CheckReadability_OnPurelyWhitespacePages_IsNoText()
    {
        var result = TextReadabilityGate.CheckReadability(["   \n\t  ", "  "], NullLogger.Instance);

        Assert.Equal(TextReadabilityGate.Result.NoText, result);
    }

    [Fact]
    public void CheckReadability_OnAPageOfReplacementCharacters_IsUnreadable()
    {
        // A broken CID font with no ToUnicode map decodes to U+FFFD - the exact failure this gate exists for.
        var garbled = new string('�', 500);

        var result = TextReadabilityGate.CheckReadability([garbled], NullLogger.Instance);

        Assert.Equal(TextReadabilityGate.Result.Unreadable, result);
    }

    [Fact]
    public void CheckReadability_OneBadPageAmongManyGoodOnes_StillReads()
    {
        // Failing mass under the 40% threshold shouldn't sink an otherwise-clean document.
        var garbled = new string('�', 200);
        var pages = new[] { ReadableProse, ReadableProse, ReadableProse, garbled };

        var result = TextReadabilityGate.CheckReadability(pages, NullLogger.Instance);

        Assert.Equal(TextReadabilityGate.Result.Readable, result);
    }

    [Fact]
    public void CheckReadability_OnAnUnbrokenRunWithNoWordBreaks_IsUnreadable()
    {
        // No whitespace at all: fails the longest-non-whitespace-run check (URLs/DOIs top out ~120 chars).
        var run = new string('a', 500);

        var result = TextReadabilityGate.CheckReadability([run], NullLogger.Instance);

        Assert.Equal(TextReadabilityGate.Result.Unreadable, result);
    }
}
