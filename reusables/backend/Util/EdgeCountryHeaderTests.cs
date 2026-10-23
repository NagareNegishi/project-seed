using Reusables.Util;

namespace Reusables.Tests.Util;

public class EdgeCountryHeaderTests
{
    [Fact]
    public void Parse_ValidTwoLetterCode_ReturnsUpperCased()
    {
        Assert.Equal("NZ", EdgeCountryHeader.Parse("nz"));
    }

    [Theory]
    [InlineData("XX")]
    [InlineData("T1")]
    public void Parse_DefaultNoSignalCode_ReturnsNull(string code)
    {
        Assert.Null(EdgeCountryHeader.Parse(code));
    }

    [Fact]
    public void Parse_CustomNoSignalCode_ReturnsNull()
    {
        Assert.Null(EdgeCountryHeader.Parse("ZZ", noSignalCodes: ["ZZ"]));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("N")]
    [InlineData("NZL")]
    [InlineData("N1")]
    public void Parse_MissingOrMalformed_ReturnsNull(string? headerValue)
    {
        Assert.Null(EdgeCountryHeader.Parse(headerValue));
    }
}
