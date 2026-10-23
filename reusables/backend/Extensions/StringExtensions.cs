namespace Reusables.Extensions;

public static class StringExtensions
{
    // Users paste codes with spaces or hyphens (e.g. from an authenticator app); most
    // validators/parsers expect the digits only.
    public static string NormalizeAuthenticatorCode(this string code) =>
        code.Replace(" ", string.Empty).Replace("-", string.Empty);
}
