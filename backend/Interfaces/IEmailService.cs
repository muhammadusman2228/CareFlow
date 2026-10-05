

using backend.DTOs;

namespace backend.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(EmailDto dto);
    Task SendOtpEmailAsync(string recipientEmail, string otpCode, string subject = "CareFlow - Verify Your Email Address", string purpose = "verify your email address");
}