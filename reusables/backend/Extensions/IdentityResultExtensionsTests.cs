using Microsoft.AspNetCore.Identity;
using Reusables.Extensions;

namespace Reusables.Tests.Extensions;

public class IdentityResultExtensionsTests
{
    [Fact]
    public void ToErrorMessage_JoinsDescriptions_WithASpace()
    {
        var result = IdentityResult.Failed(
            new IdentityError { Description = "Password too short." },
            new IdentityError { Description = "Password requires a digit." });

        Assert.Equal("Password too short. Password requires a digit.", result.ToErrorMessage());
    }

    [Fact]
    public void ToErrorMessage_OnSuccess_IsEmpty()
    {
        Assert.Equal("", IdentityResult.Success.ToErrorMessage());
    }
}
