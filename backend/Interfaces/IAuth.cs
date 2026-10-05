



using backend.DTOs;


namespace backend.Interfaces;
public interface IAuth
{
    Task <PatientResponseDto> Register(RegisterDtos dto);
    Task<string> VerifyEmail(verifEmailDTO dto);
     Task<(LoginResponseDto dto,string RefreshToken,DateTime RefreshTokenExpiresAt)> login(LoginDto dto,string ip,string userAgent);




      Task<AccessTokenDtos> refreshToken(string refreshToken);

      Task logout(string refreshToken);
      Task logoutAll(string refreshToken);
       Task resendOtp(ResendOtpDtos dto);
       Task forgotPassword(ForgotPasswordDto dto);
       Task resetPassword(ResetPasswordDto dto);
}

    