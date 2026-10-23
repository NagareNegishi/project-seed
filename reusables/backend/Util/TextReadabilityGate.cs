using System.Text;
using Microsoft.Extensions.Logging;

namespace Reusables.Util;

// Generalized from the app's CvTextReadability - callers threw a domain-specific parse
// exception with app-facing copy; this returns a result instead, so you decide what to do
// with a rejection (throw your own exception, log it, whatever fits your app).

/// <summary>
/// Gate for extracted text that a PDF/OCR pipeline could not decode cleanly: a broken CID
/// font with no ToUnicode map yields private-use codepoints, replacement chars, or a run with
/// no word breaks - text that passes a length check but is garbage to a downstream model or
/// human reader. Checks run per page and are aggregated by character mass, so one bad page in
/// a multi-page document still trips the gate. It only judges character composition, not
/// meaning - wrong-but-valid decodes and scrambled reading order are out of scope.
/// </summary>
public static class TextReadabilityGate
{
    // Each threshold is a first-principles ceiling/floor for plausible prose, set ~2-3x past
    // the worst plausible legitimate value - not fitted to any particular fixture set.
    private const double MaxPuaRatio         = 0.02;  // symbol-font contact glyphs legitimately sit in PUA
    private const double MaxReplacementRatio = 0.01;  // U+FFFD has no legitimate place in prose
    private const double MaxControlRatio     = 0.01;  // C0 controls other than tab / newline / CR
    private const int    MaxNonWhitespaceRun = 150;   // URLs and DOIs top out ~120 chars
    private const double MinWhitespaceRatio  = 0.06;  // real prose runs 14-18% (measured on CV fixtures)
    private const double MinLetterRatio      = 0.40;  // letters as a fraction of non-whitespace chars

    // Reject the document when failing pages hold more than this share of total character mass.
    private const double MaxFailingMassRatio = 0.40;

    public enum Result
    {
        Readable,
        /// <summary>No page had any visible (non-whitespace) characters.</summary>
        NoText,
        /// <summary>Enough pages failed the composition checks to reject the whole document.</summary>
        Unreadable,
    }

    /// <summary>Checks whether the per-page text is usable prose. Logs the per-page metrics either way.</summary>
    public static Result CheckReadability(IReadOnlyList<string> pages, ILogger logger)
    {
        var measured = pages
            .Select((text, i) => (Page: i + 1, Metrics: Measure(text)))
            .Where(x => x.Metrics is not null)
            .Select(x => (x.Page, Metrics: x.Metrics!.Value))
            .ToList();

        // Backstop: an empty `pages` list or every page being pure interior whitespace once
        // runes are counted both land here.
        if (measured.Count == 0)
            return Result.NoText;

        // Weight each page by its size: a short garbled page next to a long clean one is tolerable,
        // a long garbled page is not. allFailed also rejects the case where every page is small.
        long totalMass = measured.Sum(x => (long)x.Metrics.CharMass);
        long failingMass = measured.Where(x => x.Metrics.FailReason is not null).Sum(x => (long)x.Metrics.CharMass);
        bool allFailed = measured.All(x => x.Metrics.FailReason is not null);
        double failingFraction = (double)failingMass / totalMass;
        bool reject = allFailed || failingFraction > MaxFailingMassRatio;

        logger.LogInformation(
            "Text readability gate: {Pages} pages, {Chars} chars, failing mass {FailingPct:P0}, decision={Decision}. {PerPage}",
            measured.Count, totalMass, failingFraction, reject ? "reject" : "accept",
            string.Join("; ", measured.Select(FormatPage)));

        return reject ? Result.Unreadable : Result.Readable;
    }

    /// <summary>Per-page character metrics and the first failing check, or null when the page has no visible characters.</summary>
    private static PageMetrics? Measure(string page)
    {
        int total = 0, whitespace = 0, letters = 0, spacelessLetters = 0;
        int pua = 0, replacement = 0, control = 0;
        int run = 0, longestRun = 0;

        // EnumerateRunes yields U+FFFD for ill-formed UTF-16 (unpaired surrogates from a bad decode),
        // so those count against the replacement-char check rather than being skipped.
        foreach (var rune in page.EnumerateRunes())
        {
            total++;
            int cp = rune.Value;

            if (Rune.IsWhiteSpace(rune))
            {
                whitespace++;
                run = 0;
            }
            else if (++run > longestRun)
            {
                longestRun = run;
            }

            // Codepoint-class tallies - mutually exclusive, all script-agnostic.
            if (IsPrivateUse(cp)) pua++;
            else if (cp == 0xFFFD) replacement++;
            else if (cp <= 0x1F && cp is not (0x09 or 0x0A or 0x0D)) control++;

            if (Rune.IsLetter(rune))
            {
                letters++;
                if (IsSpacelessScript(cp)) spacelessLetters++;
            }
        }

        int nonWhitespace = total - whitespace;
        if (nonWhitespace == 0)
            return null;

        // Majority no-space script: the two whitespace-based checks do not apply to this page.
        bool spaceless = letters > 0 && spacelessLetters * 2 >= letters;

        double puaRatio         = (double)pua / total;
        double replacementRatio = (double)replacement / total;
        double controlRatio     = (double)control / total;
        double whitespaceRatio  = (double)whitespace / total;
        double letterRatio      = (double)letters / nonWhitespace;

        // Codepoint-class checks first so a script-guarded page is still tested for composition;
        // the last two are the whitespace-based checks the script guard turns off. The label is
        // the first failing check and goes straight into the log line.
        string? fail =
            puaRatio > MaxPuaRatio ? "pua"
            : replacementRatio > MaxReplacementRatio ? "fffd"
            : controlRatio > MaxControlRatio ? "c0"
            : letterRatio < MinLetterRatio ? "letters"
            : !spaceless && longestRun > MaxNonWhitespaceRun ? "run"
            : !spaceless && whitespaceRatio < MinWhitespaceRatio ? "whitespace"
            : null;

        return new PageMetrics(total, spaceless, puaRatio, replacementRatio, controlRatio,
            longestRun, whitespaceRatio, letterRatio, fail);
    }

    private static string FormatPage((int Page, PageMetrics M) x) =>
        $"p{x.Page} {x.M.FailReason ?? "ok"}{(x.M.Spaceless ? " spaceless" : "")} " +
        $"pua={x.M.PuaRatio:F3} fffd={x.M.ReplacementRatio:F3} c0={x.M.ControlRatio:F3} " +
        $"run={x.M.LongestRun} ws={x.M.WhitespaceRatio:F2} let={x.M.LetterRatio:F2}";

    private static bool IsPrivateUse(int cp) =>
        cp is (>= 0xE000 and <= 0xF8FF)
           or (>= 0xF0000 and <= 0xFFFFD)
           or (>= 0x100000 and <= 0x10FFFD);

    // Only ever called for letters, so ranges can be coarse - non-letter codepoints inside
    // these blocks (e.g. CJK symbols) never reach here.
    private static bool IsSpacelessScript(int cp) =>
        cp is (>= 0x3400 and <= 0x9FFF)     // CJK Unified + Extension A
           or (>= 0x20000 and <= 0x2FA1F)   // CJK Extension B and later
           or (>= 0x3040 and <= 0x30FF)     // Hiragana + Katakana
           or (>= 0x31F0 and <= 0x31FF)     // Katakana phonetic extensions
           or (>= 0x0E00 and <= 0x0EFF)     // Thai + Lao
           or (>= 0x1780 and <= 0x17FF)     // Khmer
           or (>= 0x1000 and <= 0x109F);    // Myanmar

    private readonly record struct PageMetrics(
        int CharMass, bool Spaceless,
        double PuaRatio, double ReplacementRatio, double ControlRatio,
        int LongestRun, double WhitespaceRatio, double LetterRatio,
        string? FailReason);
}
