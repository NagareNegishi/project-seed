using System.Security.Claims;
using Reusables.Extensions;

namespace Reusables.Tests.Extensions;

public class ClaimsPrincipalExtensionsTests
{
    private static ClaimsPrincipal MakeUser(string? userId = null, string? email = null)
    {
        var claims = new List<Claim>();
        if (userId is not null) claims.Add(new Claim(ClaimTypes.NameIdentifier, userId));
        if (email is not null) claims.Add(new Claim(ClaimTypes.Email, email));
        return new ClaimsPrincipal(new ClaimsIdentity(claims));
    }

    [Fact]
    public void GetUserId_ReadsTheNameIdentifierClaim()
    {
        var user = MakeUser(userId: "user-123");
        Assert.Equal("user-123", user.GetUserId());
    }

    [Fact]
    public void GetEmail_ReadsTheEmailClaim()
    {
        var user = MakeUser(email: "a@example.com");
        Assert.Equal("a@example.com", user.GetEmail());
    }
}
