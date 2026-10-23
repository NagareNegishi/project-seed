using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;

namespace Reusables.Util;

// Generalized from the app's ClaudeResponseHelper - the mechanics (a text-completion LLM
// wrapping JSON in prose despite instructions, or drifting from its documented shape) aren't
// provider-specific.

/// <summary>Shared raw-response handling for LLM-backed services: JSON extraction + contract-issue logging.</summary>
public static class LlmJsonResponseHelper
{
    // The model may return prose around the JSON despite instructions — extract the first { } block.
    // Falls back to "{}" so deserialization always yields a safe empty result rather than throwing.
    public static string ExtractJson(string raw, ILogger logger, string context)
    {
        var trimmed = raw.Trim();
        var start = trimmed.IndexOf('{');
        var end = trimmed.LastIndexOf('}');

        if (start == -1 || end == -1 || end < start)
        {
            logger.LogWarning("{Context} response contains no JSON object. Raw: {Raw}", context, raw);
            return "{}";
        }

        var json = trimmed[start..(end + 1)];

        if (start > 0 || end < trimmed.Length - 1)
            logger.LogWarning("{Context} response contains text outside JSON. Raw: {Raw}", context, raw);

        return json;
    }

    // Logs contract violations to tune prompts over time — not surfaced to the user.
    public static void LogContractIssues(string json, HashSet<string> knownKeys, ILogger logger, string context)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var props = doc.RootElement.EnumerateObject().ToList();

            if (props.Count == 0)
            {
                logger.LogWarning("{Context} response is an empty object.", context);
                return;
            }

            foreach (var prop in props)
            {
                if (!knownKeys.Contains(prop.Name))
                    logger.LogWarning("Unexpected key in {Context} response: {Key}", context, prop.Name);
                else if (prop.Value.ValueKind == JsonValueKind.Null)
                    logger.LogWarning("{Context} field is null: {Field}", context, prop.Name);
            }
        }
        // Caller already logs/handles unparseable JSON via ExtractJson's fallback.
        catch (JsonException) { }
    }

    // Derived from [JsonPropertyName] on T via reflection; cached per closed generic type.
    public static HashSet<string> GetKnownKeys<T>() => KnownKeysCache<T>.Keys;

    private static class KnownKeysCache<T>
    {
        public static readonly HashSet<string> Keys = typeof(T)
            .GetProperties()
            .Select(p => p.GetCustomAttribute<JsonPropertyNameAttribute>()?.Name)
            .Where(name => name != null)
            .ToHashSet()!;
    }
}
