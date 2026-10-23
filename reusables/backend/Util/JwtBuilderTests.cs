using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Reusables.Util;

namespace Reusables.Tests.Util;

public class JwtBuilderTests
{
    private const string SigningKey = "this-is-a-test-signing-key-of-sufficient-length";

    [Fact]
    public void Write_RoundTrips_IssuerAudienceAndClaims()
    {
        var claims = new[] { new Claim(JwtRegisteredClaimNames.Sub, "user-123") };

        var token = JwtBuilder.Write(SigningKey, "test-issuer", "test-audience", claims, TimeSpan.FromMinutes(5));
        var parsed = new JwtSecurityTokenHandler().ReadJwtToken(token);

        Assert.Equal("test-issuer", parsed.Issuer);
        Assert.Equal("test-audience", parsed.Audiences.Single());
        Assert.Equal("user-123", parsed.Claims.Single(c => c.Type == JwtRegisteredClaimNames.Sub).Value);
    }

    [Fact]
    public void Write_SetsExpiryFromLifetime()
    {
        var before = DateTime.UtcNow;
        var token = JwtBuilder.Write(SigningKey, "issuer", "audience", [], TimeSpan.FromMinutes(10));
        var parsed = new JwtSecurityTokenHandler().ReadJwtToken(token);

        Assert.InRange(parsed.ValidTo, before.AddMinutes(10).AddSeconds(-5), before.AddMinutes(10).AddSeconds(5));
    }
}
