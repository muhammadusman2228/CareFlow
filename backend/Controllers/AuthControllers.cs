


using System.Data;
using System.Security.Authentication;
using backend.Data;
using backend.DTOs;
using backend.Interfaces;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;

namespace backend.Controllers;

[ApiController]
[Route("/api/[controller]")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{

    private readonly IAuth _authService;
    public AuthController(IAuth authService)
    {
        _authService = authService;
    }
    [HttpPost("patient/register")]
    public async Task<ActionResult<PatientResponseDto>> Register([FromBody] RegisterDtos dto)
    {
        try
        {
            var patient = await _authService.Register(dto);
            return CreatedAtAction(nameof(Register), patient);
        }
        catch (DuplicateWaitObjectException)
        {
            return Conflict(new { message = "This email is already taken" });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Error occured while loading information" });
        }
    }
    [HttpPost("patient/verify-email")]
    public async Task<ActionResult> verifyEmail(verifEmailDTO dto)
    {
        try
        {
            var result = await _authService.VerifyEmail(dto);
            return Ok(new { message = result });
        }
        catch (InvalidDataException)
        {
            return BadRequest(new { message = "Invalid Credentials" });
        }
        catch (InvalidCredentialException)
        {
            return BadRequest(new { message = "Invalid Credentails" });
        }
        catch
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Try again after some time" });
        }
    }
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto dto)
    {
        try
        {

            var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
            if (Request.Headers.ContainsKey("X-Forwarded-For"))
            {
                ip = Request.Headers["X-Forwarded-For"].FirstOrDefault() ?? ip;
            }

            var userAgent = Request.Headers["User-Agent"].ToString();
            if (string.IsNullOrWhiteSpace(userAgent))
            {
                userAgent = "Unknown";
            }

            var (responseDto, refreshToken, refreshExpiry) = await _authService.login(dto, ip, userAgent);

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax,
                Expires = refreshExpiry
            };
            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);

            return Ok(responseDto);
        }
        catch (InvalidCredentialException ex)
        {

            return Unauthorized(new { message = ex.Message });
        }
        catch (InvalidConstraintException ex)
        {

            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {

            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "An error occurred while logging in." });
        }
    }

    [HttpPost("refresh-token")]
    [DisableRateLimiting]
    public async Task<ActionResult<AccessTokenDtos>> refreshToken()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return Unauthorized(new {message="No refresh Token"});
        }
        try
        {
              var response = await _authService.refreshToken(refreshToken);
              return Ok(response);
        }
        catch(SecurityTokenException ex){
        return Unauthorized(new {message=ex.Message});
        }
        catch(Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,new {message="Try again later"});
        }
    }

    [HttpPost("logout")]
    [DisableRateLimiting]
    public async Task<ActionResult> logout()
    {
        try
        {
              var refreshToken = Request.Cookies["refreshToken"];
        if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            await _authService.logout(refreshToken);
        
            }
            
            Response.Cookies.Delete("refreshToken",new CookieOptions{
                SameSite=SameSiteMode.Lax,
                Secure=true,
                HttpOnly=true

            });
            return Ok(new {message="Log out Successfully"});
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,new {message="Try again later"});
        }
    }

    [HttpPost("logout-all")]
    [DisableRateLimiting]
    public async Task<ActionResult> logoutAll()
    {
        try
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if(!string.IsNullOrWhiteSpace(refreshToken))
            {
             await _authService.logoutAll(refreshToken);
           
            }
             Response.Cookies.Delete("refreshToken",new CookieOptions
             {
                 SameSite=SameSiteMode.Lax,
                 Secure=true,
                 HttpOnly=true
             }) ;
             return Ok(new {message="Logout from all devices"});
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,new {message="Try again after some time"});
        }
    }

    [HttpPost("resend-otp")]
    public async Task<ActionResult> resendOtp([FromBody] ResendOtpDtos dto)
    {
        try
        {
           await _authService.resendOtp(dto);
           return Ok(new {message="Otp is sent successfully"}); 
        }
        catch (InvalidCredentialException)
        {
            return Ok(new {message="Otp is sent successfully"});

        }
        catch (InvalidOperationException )
        {
            return BadRequest(new {message="Already Verified. Please login "});

        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError,ex.Message);
        }
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult> forgotPassword([FromBody] ForgotPasswordDto dto)
    {
        try
        {
            await _authService.forgotPassword(dto);
            return Ok(new { message = "If your account exists, a reset code has been sent." });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Try again later" });
        }
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult> resetPassword([FromBody] ResetPasswordDto dto)
    {
        try
        {
            await _authService.resetPassword(dto);
            return Ok(new { message = "Password reset successfully. Please login with your new password." });
        }
        catch (InvalidCredentialException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidDataException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Try again later" });
        }
    }

}

