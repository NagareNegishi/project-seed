using Reusables.Extensions;

namespace Reusables.Tests.Extensions;

public class StringExtensionsTests
{
    [Theory]
    [InlineData("123 456 789", "123456789")]
    [InlineData("123-456-789", "123456789")]
    [InlineData("123 456-789", "123456789")]
    [InlineData("123456789", "123456789")]
    [InlineData("", "")]
    public void NormalizeAuthenticatorCode_StripsSpacesAndHyphens(string input, string expected)
    {
        Assert.Equal(expected, input.NormalizeAuthenticatorCode());
    }
}
