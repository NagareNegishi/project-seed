using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace Reusables.Util;

// Generalized from the app's AuthTokenService.WriteJwt - the one place it builds a signed HS256
// JWT; claim selection, audience, and lifetime are all caller-supplied there and stay that way here.

/// <summary>Builds a signed HS256 JWT from claims, an audience, and a lifetime.</summary>
public static class JwtBuilder
{
    public static string Write(
        string signingKey, string issuer, string? audience, IEnumerable<Claim> claims, TimeSpan lifetime)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(signingKey));
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.Add(lifetime),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
